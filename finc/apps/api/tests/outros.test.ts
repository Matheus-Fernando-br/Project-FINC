import forge from "node-forge";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { lerCertificado } from "../src/modules/arquivos.js";
import { api, registrar, setup, type TestEnv } from "./helpers.js";

let env: TestEnv;
beforeAll(async () => {
  env = await setup();
});
afterAll(() => env.close());

function gerarPfx(cn: string, senha: string, diasValidade = 365): Buffer {
  const keys = forge.pki.rsa.generateKeyPair(1024);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = "0a1b2c";
  cert.validity.notBefore = new Date(Date.now() - 86400000);
  cert.validity.notAfter = new Date(Date.now() + diasValidade * 86400000);
  const attrs = [{ name: "commonName", value: cn }];
  cert.setSubject(attrs);
  cert.setIssuer([{ name: "commonName", value: "AC Teste FINC" }]);
  cert.sign(keys.privateKey, forge.md.sha256.create());
  const p12 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], senha, { algorithm: "3des" });
  return Buffer.from(forge.asn1.toDer(p12).getBytes(), "binary");
}

describe("certificado digital A1", () => {
  it("valida senha, titular e armazena cifrado", async () => {
    const u = await registrar(env);
    const pfx = gerarPfx(`LOJA DA MARIA:${u.cpf}`, "senha-cert");
    const errada = await api(u)
      .post("/certificado")
      .field("senha", "x")
      .attach("arquivo", pfx, "cert.pfx");
    expect(errada.status).toBe(400);
    const outro = await api(u)
      .post("/certificado")
      .field("senha", "s")
      .attach("arquivo", gerarPfx("OUTRA:11222333000181", "s"), "c.pfx");
    expect(outro.status).toBe(422);
    const ok = await api(u)
      .post("/certificado")
      .field("senha", "senha-cert")
      .attach("arquivo", pfx, "cert.pfx");
    expect(ok.status).toBe(201);
    expect(ok.body.certificado.documento).toBe(u.cpf);
    const info = await api(u).get("/certificado");
    expect(info.body.certificado.titular).toBe("LOJA DA MARIA");
    expect(info.body.certificado.expirado).toBe(false);
    const { rows } = await env.ctx.db.query<{ arquivo_cifrado: string }>(
      "SELECT arquivo_cifrado FROM certificados",
    );
    expect(rows[0]!.arquivo_cifrado).not.toContain(pfx.toString("base64").slice(0, 40));
    expect((await api(u).post("/certificado/validar")).body.ok).toBe(true);
    expect((await api(u).del("/certificado")).status).toBe(200);
    expect((await api(u).get("/certificado")).body.certificado).toBeNull();
  });

  it("rejeita certificado expirado e extensão inválida", async () => {
    const u = await registrar(env);
    const exp = await api(u)
      .post("/certificado")
      .field("senha", "a")
      .attach("arquivo", gerarPfx(`X:${u.cpf}`, "a", -1), "c.p12");
    expect(exp.status).toBe(422);
    const ext = await api(u)
      .post("/certificado")
      .field("senha", "a")
      .attach("arquivo", Buffer.from("x"), "c.txt");
    expect(ext.status).toBe(400);
    expect(() => lerCertificado(Buffer.from("lixo"), "a")).toThrow();
  });

  it("desativado sem CERT_ENCRYPTION_KEY", async () => {
    const env2 = await setup({ CERT_ENCRYPTION_KEY: "" });
    try {
      const u = await registrar(env2);
      const r = await api(u)
        .post("/certificado")
        .field("senha", "a")
        .attach("arquivo", Buffer.from("x"), "c.pfx");
      expect(r.status).toBe(503);
      expect((await api(u).get("/certificado")).body.habilitado).toBe(false);
    } finally {
      await env2.close();
    }
  });
});

describe("suporte", () => {
  it("chamados autenticados, isolados por conta, com aviso ao Telegram", async () => {
    const a = await registrar(env, "Cliente Suporte");
    const b = await registrar(env);
    const c = await api(a).post("/suporte/chamados", {
      categoria: "Notas fiscais",
      assunto: "Dúvida no CFOP",
      mensagem: "Qual CFOP usar?",
    });
    expect(c.status).toBe(201);
    expect(c.body.protocolo).toMatch(/^\d{14}$/);
    expect(env.telegramMsgs.at(-1)).toContain("Novo chamado");
    expect((await api(b).get(`/suporte/chamados/${c.body.id}`)).status).toBe(404);
    expect(
      (await api(b).post(`/suporte/chamados/${c.body.id}/mensagens`, { mensagem: "invasão" }))
        .status,
    ).toBe(404);
    const m = await api(a).post(`/suporte/chamados/${c.body.id}/mensagens`, {
      mensagem: "Complemento",
    });
    expect(m.body.mensagens).toHaveLength(2);
    expect((await api(a).get("/admin/chamados")).status).toBe(403);
  });

  it("painel admin responde e o usuário é notificado", async () => {
    const user = await registrar(env);
    const admin = await registrar(env);
    await env.ctx.db.query("UPDATE usuarios SET papel = 'admin' WHERE email = $1", [admin.email]);
    const c = await api(user).post("/suporte/chamados", {
      categoria: "Planos",
      assunto: "Upgrade",
      mensagem: "Como faço upgrade?",
    });
    const lista = await api(admin).get("/admin/chamados?status=aberto");
    expect(lista.body.some((x: { id: string }) => x.id === c.body.id)).toBe(true);
    const resp = await api(admin).post(`/admin/chamados/${c.body.id}/responder`, {
      mensagem: "Vá em Planos > BLACK.",
    });
    expect(resp.body.status).toBe("aceito");
    const notifs = (await api(user).get("/notificacoes")).body;
    expect(notifs.items[0].titulo).toContain(c.body.protocolo);
    expect(notifs.naoLidas).toBeGreaterThan(0);
    await api(admin).post(`/admin/chamados/${c.body.id}/fechar`);
    expect(
      (await api(user).post(`/suporte/chamados/${c.body.id}/mensagens`, { mensagem: "ainda?" }))
        .status,
    ).toBe(422);
    await api(user).post("/notificacoes/lidas");
    expect((await api(user).get("/notificacoes")).body.naoLidas).toBe(0);
  });

  it("webhook do Telegram exige segredo e o chat configurado", async () => {
    const u = await registrar(env);
    const c = await api(u).post("/suporte/chamados", {
      categoria: "Outros",
      assunto: "Teste bot",
      mensagem: "oi",
    });
    const body = {
      callback_query: {
        id: "1",
        data: `ACEITAR:${c.body.id}`,
        from: { id: 5 },
        message: { chat: { id: 999 }, message_id: 1 },
      },
    };
    expect(
      (await request(env.app).post("/api/integracoes/telegram/webhook").send(body)).status,
    ).toBe(403);
    const outroChat = {
      callback_query: { ...body.callback_query, message: { chat: { id: 1 }, message_id: 1 } },
    };
    await request(env.app)
      .post("/api/integracoes/telegram/webhook")
      .set("X-Telegram-Bot-Api-Secret-Token", "segredo-webhook")
      .send(outroChat);
    expect((await api(u).get(`/suporte/chamados/${c.body.id}`)).body.status).toBe("aberto");
    const ok = await request(env.app)
      .post("/api/integracoes/telegram/webhook")
      .set("X-Telegram-Bot-Api-Secret-Token", "segredo-webhook")
      .send(body);
    expect(ok.status).toBe(200);
    expect((await api(u).get(`/suporte/chamados/${c.body.id}`)).body.status).toBe("aceito");
    // modo responder
    await request(env.app)
      .post("/api/integracoes/telegram/webhook")
      .set("X-Telegram-Bot-Api-Secret-Token", "segredo-webhook")
      .send({ callback_query: { ...body.callback_query, data: `RESPONDER:${c.body.id}` } });
    await request(env.app)
      .post("/api/integracoes/telegram/webhook")
      .set("X-Telegram-Bot-Api-Secret-Token", "segredo-webhook")
      .send({ message: { text: "Resposta pelo bot", from: { id: 5 }, chat: { id: 999 } } });
    const msgs = (await api(u).get(`/suporte/chamados/${c.body.id}`)).body.mensagens;
    expect(msgs.at(-1)).toMatchObject({ autor: "suporte", mensagem: "Resposta pelo bot" });
  });

  it("feedback autenticado", async () => {
    expect(
      (await request(env.app).post("/api/suporte/feedback").send({ mensagem: "spam" })).status,
    ).toBe(401);
    const u = await registrar(env);
    expect((await api(u).post("/suporte/feedback", { mensagem: "Ótima plataforma" })).status).toBe(
      201,
    );
  });
});

describe("perfil, preferências, CEP e LGPD", () => {
  it("atualiza perfil sem permitir troca de CPF/CNPJ", async () => {
    const u = await registrar(env);
    const r = await api(u).put("/perfil", {
      nome: "Novo Nome",
      telefone: "1133334444",
      cpf_cnpj: "11222333000181",
      cep: "01001-000",
      uf: "SP",
    });
    expect(r.status).toBe(200);
    expect(r.body.nome).toBe("Novo Nome");
    expect(r.body.cpf_cnpj).toBe(u.cpf);
    expect(r.body.cep).toBe("01001000");
    expect((await api(u).put("/perfil", { nome: "A", telefone: "1" })).status).toBe(400);
  });

  it("preferências e configuração fiscal persistidas", async () => {
    const u = await registrar(env);
    const pref = (await api(u).get("/config/preferencias")).body;
    expect(pref.atalhos.length).toBeGreaterThan(0);
    const novo = {
      ...pref,
      modo_compacto: true,
      atalhos: [{ label: "Estoque", icon: "bi-box", to: "/estoque" }],
    };
    expect((await api(u).put("/config/preferencias", novo)).status).toBe(200);
    expect((await api(u).get("/config/preferencias")).body.modo_compacto).toBe(true);
    expect(
      (
        await api(u).put("/config/preferencias", {
          ...novo,
          atalhos: [{ label: "x", icon: "javascript:alert(1)", to: "/" }],
        })
      ).status,
    ).toBe(400);
    const cfg = (await api(u).get("/config/fiscal")).body;
    expect(cfg).toMatchObject({
      ambiente: "homologacao",
      serie: 1,
      proximo_numero: 1,
      regime_tributario: "mei",
      somar_impostos: true,
    });
  });

  it("consulta CEP pelo servidor", async () => {
    const u = await registrar(env);
    const r = await api(u).get("/util/cep/01001-000");
    expect(r.body).toMatchObject({ uf: "SP", cidade: "São Paulo", bairro: "Sé" });
    expect((await api(u).get("/util/cep/99999999")).status).toBe(404);
    expect((await api(u).get("/util/cep/123")).status).toBe(400);
  });

  it("canais de notificação refletem a configuração real", async () => {
    const u = await registrar(env);
    const canais = (await api(u).get("/notificacoes/canais")).body;
    expect(canais.email.disponivel).toBe(false); // SMTP não configurado nas variáveis de ambiente do teste
    const teste = await api(u).post("/notificacoes/canais/email/teste");
    expect(teste.status).toBe(200); // mailer de teste injetado
  });

  it("exporta dados, registra atividade e exclui a conta", async () => {
    const u = await registrar(env);
    await api(u).post("/clientes", {
      nome_social: "Exportável",
      tipo_pessoa: "FISICA",
      cpf_cnpj: "52998224725",
    });
    const exp = await api(u).get("/conta/exportar");
    expect(exp.body.perfil.email).toBe(u.email);
    expect(exp.body.clientes).toHaveLength(1);
    expect(exp.body.perfil.senha_hash).toBeUndefined();
    const ativ = (await api(u).get("/conta/atividade")).body;
    expect(ativ.map((a: { acao: string }) => a.acao)).toEqual(
      expect.arrayContaining(["usuario.cadastro", "clientes.criar", "lgpd.exportar"]),
    );
    expect(
      (await api(u).post("/conta/excluir", { senha: "errada", confirmacao: "EXCLUIR" })).status,
    ).toBe(400);
    expect(
      (await api(u).post("/conta/excluir", { senha: u.senha, confirmacao: "EXCLUIR" })).status,
    ).toBe(200);
    expect(
      (await request(env.app).post("/api/auth/login").send({ login: u.email, senha: u.senha }))
        .status,
    ).toBe(401);
  });
});
