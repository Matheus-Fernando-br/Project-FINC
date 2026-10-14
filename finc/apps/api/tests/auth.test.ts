import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { api, gerarCpf, registrar, setup, type TestEnv } from "./helpers.js";

let env: TestEnv;
beforeAll(async () => {
  env = await setup();
});
afterAll(() => env.close());

describe("público", () => {
  it("health informa banco e integrações", async () => {
    const r = await request(env.app).get("/api/health");
    expect(r.status).toBe(200);
    expect(r.body.banco).toEqual({ ok: true, tipo: process.env.TEST_DATABASE_URL ? "pg" : "pglite" });
    expect(r.body.integracoes.certificado).toBe(true);
  });
  it("lista os planos BÁSICO e BLACK", async () => {
    const r = await request(env.app).get("/api/planos");
    expect(r.status).toBe(200);
    expect(r.body.map((p: { codigo: string }) => p.codigo)).toEqual(["basico", "black"]);
    expect(r.body[1].limites.notas_mes).toBeNull();
  });
  it("rota inexistente devolve 404 JSON", async () => {
    const r = await request(env.app).get("/api/nao-existe");
    expect(r.status).toBe(404);
    expect(r.body.error.code).toBe("NAO_ENCONTRADO");
  });
  it("aplica cabeçalhos de segurança", async () => {
    const r = await request(env.app).get("/api/health");
    expect(r.headers["x-content-type-options"]).toBe("nosniff");
    expect(r.headers["content-security-policy"]).toContain("default-src 'self'");
    expect(r.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("cadastro e login", () => {
  it("valida CPF, senha e aceite de termos", async () => {
    const r = await request(env.app).post("/api/auth/cadastro").send({
      nome: "X", tipo_pessoa: "FISICA", cpf_cnpj: "12345678900", email: "ruim", senha: "123", telefone: "1", aceite_termos: false,
    });
    expect(r.status).toBe(400);
    const campos = r.body.error.details.map((d: { campo: string }) => d.campo);
    expect(campos).toEqual(expect.arrayContaining(["email", "senha", "telefone", "aceite_termos"]));
  });

  it("cadastra no plano BÁSICO, abre sessão e impede duplicidade", async () => {
    const u = await registrar(env);
    const me = await api(u).get("/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.usuario.plano.codigo).toBe("basico");
    expect(me.body.csrfToken).toBe(u.csrf);
    const dup = await request(env.app).post("/api/auth/cadastro").send({
      nome: "Outro", tipo_pessoa: "FISICA", cpf_cnpj: u.cpf, email: "outro@teste.com", senha: "Senha1234", telefone: "11999998888", aceite_termos: true,
    });
    expect(dup.status).toBe(409);
    expect(dup.body.error.message).toContain("CPF/CNPJ");
  });

  it("login por e-mail ou por CPF/CNPJ; cookie HttpOnly", async () => {
    const u = await registrar(env);
    const porEmail = await request(env.app).post("/api/auth/login").send({ login: u.email.toUpperCase(), senha: u.senha });
    expect(porEmail.status).toBe(200);
    expect(String(porEmail.headers["set-cookie"])).toMatch(/finc_sessao=.*HttpOnly/);
    const porCpf = await request(env.app).post("/api/auth/login").send({ login: u.cpf.replace(/(\d{3})(\d{3})(\d{3})/, "$1.$2.$3-"), senha: u.senha });
    expect(porCpf.status).toBe(200);
  });

  it("mensagem genérica para credenciais inválidas e bloqueio após 5 falhas", async () => {
    const u = await registrar(env);
    const inexistente = await request(env.app).post("/api/auth/login").send({ login: "ninguem@teste.com", senha: "x" });
    expect(inexistente.status).toBe(401);
    expect(inexistente.body.error.code).toBe("CREDENCIAIS_INVALIDAS");
    for (let i = 0; i < 5; i++) {
      const r = await request(env.app).post("/api/auth/login").send({ login: u.email, senha: "errada123" });
      expect(r.status).toBe(401);
    }
    const bloqueado = await request(env.app).post("/api/auth/login").send({ login: u.email, senha: u.senha });
    expect(bloqueado.status).toBe(429);
  });

  it("exige sessão e token CSRF", async () => {
    expect((await request(env.app).get("/api/clientes")).status).toBe(401);
    const u = await registrar(env);
    const semCsrf = await u.agent.post("/api/clientes").send({});
    expect(semCsrf.status).toBe(403);
    expect(semCsrf.body.error.code).toBe("CSRF");
  });

  it("logout revoga a sessão no servidor", async () => {
    const u = await registrar(env);
    expect((await api(u).post("/auth/logout")).status).toBe(200);
    expect((await api(u).get("/auth/me")).status).toBe(401);
  });
});

describe("senhas e sessões", () => {
  it("fluxo de redefinição de senha por e-mail", async () => {
    const u = await registrar(env);
    const antes = env.emails.length;
    const r = await request(env.app).post("/api/auth/esqueci-senha").send({ email: u.email });
    expect(r.status).toBe(200);
    const semConta = await request(env.app).post("/api/auth/esqueci-senha").send({ email: "nao@existe.com" });
    expect(semConta.body.message).toBe(r.body.message);
    expect(env.emails.length).toBe(antes + 1);
    const token = new URL(env.emails.at(-1)!.text.match(/https?:\/\/\S+/)![0]).searchParams.get("token")!;
    const fraca = await request(env.app).post("/api/auth/redefinir-senha").send({ token, senha: "fraca" });
    expect(fraca.status).toBe(400);
    const ok = await request(env.app).post("/api/auth/redefinir-senha").send({ token, senha: "NovaSenha99" });
    expect(ok.status).toBe(200);
    // sessões anteriores foram encerradas e o token não pode ser reutilizado
    expect((await api(u).get("/auth/me")).status).toBe(401);
    expect((await request(env.app).post("/api/auth/redefinir-senha").send({ token, senha: "OutraSenha1" })).status).toBe(422);
    expect((await request(env.app).post("/api/auth/login").send({ login: u.email, senha: "NovaSenha99" })).status).toBe(200);
  });

  it("alterar senha confere a atual e encerra as outras sessões", async () => {
    const u = await registrar(env);
    const outra = request.agent(env.app);
    await outra.post("/api/auth/login").send({ login: u.email, senha: u.senha });
    const errada = await api(u).post("/auth/alterar-senha", { senha_atual: "xxx", nova_senha: "Trocada123" });
    expect(errada.status).toBe(400);
    const ok = await api(u).post("/auth/alterar-senha", { senha_atual: u.senha, nova_senha: "Trocada123" });
    expect(ok.status).toBe(200);
    expect((await outra.get("/api/auth/me")).status).toBe(401);
    expect((await api(u).get("/auth/me")).status).toBe(200);
  });

  it("lista e revoga sessões", async () => {
    const u = await registrar(env);
    const outra = request.agent(env.app);
    await outra.post("/api/auth/login").send({ login: u.email, senha: u.senha });
    const lista = await api(u).get("/auth/sessoes");
    expect(lista.body).toHaveLength(2);
    const alvo = lista.body.find((s: { atual: boolean }) => !s.atual);
    expect((await api(u).del(`/auth/sessoes/${alvo.id}`)).status).toBe(200);
    expect((await outra.get("/api/auth/me")).status).toBe(401);
  });

  it("gera CPFs de teste válidos", () => {
    expect(gerarCpf()).toMatch(/^\d{11}$/);
  });
});
