import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CLIENTE, PRODUTO, SERVICO, api, registrar, setup, type TestEnv } from "./helpers.js";

let env: TestEnv;
beforeAll(async () => {
  env = await setup();
});
afterAll(() => env.close());

describe("clientes", () => {
  it("CRUD completo com busca, paginação e exportação CSV", async () => {
    const u = await registrar(env);
    const c = await api(u).post("/clientes", CLIENTE);
    expect(c.status).toBe(201);
    expect(c.body.cpf_cnpj).toBe("11222333000181");
    await api(u).post("/clientes", {
      nome_social: "Beatriz",
      tipo_pessoa: "PFisica",
      cpf_cnpj: "529.982.247-25",
    });
    const busca = await api(u).get("/clientes?q=alfa");
    expect(busca.body.total).toBe(1);
    const pag = await api(u).get("/clientes?pageSize=1&page=2");
    expect(pag.body.items).toHaveLength(1);
    expect(pag.body.total).toBe(2);
    const upd = await api(u).put(`/clientes/${c.body.id}`, {
      ...CLIENTE,
      nome_social: "Cliente Alfa ME",
    });
    expect(upd.body.nome_social).toBe("Cliente Alfa ME");
    const csv = await api(u).get("/clientes/exportar.csv");
    expect(csv.headers["content-type"]).toContain("text/csv");
    expect(csv.text).toContain("Cliente Alfa ME");
    expect((await api(u).del(`/clientes/${c.body.id}`)).status).toBe(200);
    expect((await api(u).get(`/clientes/${c.body.id}`)).status).toBe(404);
  });

  it("valida documento de acordo com o tipo de pessoa e impede duplicados", async () => {
    const u = await registrar(env);
    const r = await api(u).post("/clientes", { ...CLIENTE, cpf_cnpj: "11222333000180" });
    expect(r.status).toBe(400);
    expect(r.body.error.details[0].campo).toBe("cpf_cnpj");
    await api(u).post("/clientes", CLIENTE);
    expect((await api(u).post("/clientes", CLIENTE)).status).toBe(409);
  });

  it("isola dados entre contas e ignora campos não permitidos (mass assignment)", async () => {
    const a = await registrar(env);
    const b = await registrar(env);
    const c = await api(a).post("/clientes", CLIENTE);
    expect((await api(b).get(`/clientes/${c.body.id}`)).status).toBe(404);
    expect((await api(b).put(`/clientes/${c.body.id}`, CLIENTE)).status).toBe(404);
    expect((await api(b).del(`/clientes/${c.body.id}`)).status).toBe(404);
    expect((await api(b).get("/clientes")).body.total).toBe(0);
    const meB = await api(b).get("/auth/me");
    const hack = await api(a).put(`/clientes/${c.body.id}`, {
      ...CLIENTE,
      usuario_id: meB.body.usuario.id,
      id: "x",
    });
    expect(hack.status).toBe(200);
    expect((await api(b).get("/clientes")).body.total).toBe(0);
  });

  it("id malformado devolve 404 (não 500)", async () => {
    const u = await registrar(env);
    expect((await api(u).get("/clientes/abc")).status).toBe(404);
  });
});

describe("produtos, serviços e estoque", () => {
  it("valida NCM/CFOP/alíquotas e controla estoque", async () => {
    const u = await registrar(env);
    const ruim = await api(u).post("/produtos", { ...PRODUTO, ncm: "123", icms: 150 });
    expect(ruim.status).toBe(400);
    const p = await api(u).post("/produtos", {
      ...PRODUTO,
      controla_estoque: true,
      estoque_inicial: 10,
      estoque_minimo: 3,
    });
    expect(p.status).toBe(201);
    expect((await api(u).get(`/produtos/${p.body.id}`)).body.estoque_atual).toBe(10);
    const saida = await api(u).post("/estoque/movimentos", {
      produto_id: p.body.id,
      tipo: "saida",
      quantidade: 8,
    });
    expect(saida.body.saldo).toBe(2);
    const insuf = await api(u).post("/estoque/movimentos", {
      produto_id: p.body.id,
      tipo: "saida",
      quantidade: 5,
    });
    expect(insuf.status).toBe(422);
    const movs = await api(u).get(`/estoque/movimentos?produto_id=${p.body.id}`);
    expect(movs.body.map((m: { tipo: string }) => m.tipo)).toEqual(["saida", "entrada"]);
    const baixo = await api(u).get("/produtos?estoque_baixo=1");
    expect(baixo.body.total).toBe(1);
    const notifs = await api(u).get("/notificacoes");
    expect(notifs.body.items.some((n: { titulo: string }) => n.titulo === "Estoque baixo")).toBe(
      true,
    );
    // PUT não altera o saldo (só movimentos alteram)
    await api(u).put(`/produtos/${p.body.id}`, {
      ...PRODUTO,
      controla_estoque: true,
      estoque_atual: 999,
    });
    expect((await api(u).get(`/produtos/${p.body.id}`)).body.estoque_atual).toBe(2);
    expect((await api(u).post("/produtos", PRODUTO)).status).toBe(409);
  });

  it("CRUD de serviços", async () => {
    const u = await registrar(env);
    const s = await api(u).post("/servicos", SERVICO);
    expect(s.status).toBe(201);
    expect(s.body.cnae).toBe("7020400");
    expect((await api(u).post("/servicos", { ...SERVICO, cnae: "12" })).status).toBe(400);
    expect((await api(u).get("/servicos")).body.total).toBe(1);
  });
});

describe("contadores e limites de plano", () => {
  it("aplica limite do BÁSICO no servidor, libera no BLACK e bloqueia downgrade", async () => {
    const u = await registrar(env);
    const c1 = await api(u).post("/contadores", {
      nome: "Contador Um",
      email: "um@contab.com",
      crc: "SP-1",
    });
    expect(c1.status).toBe(201);
    const c2 = await api(u).post("/contadores", {
      nome: "Contador Dois",
      email: "dois@contab.com",
    });
    expect(c2.status).toBe(402);
    expect(c2.body.error.code).toBe("LIMITE_PLANO");
    const up = await api(u).put("/assinatura", { plano_codigo: "black" });
    expect(up.status).toBe(200);
    expect(
      (await api(u).post("/contadores", { nome: "Contador Dois", email: "dois@contab.com" }))
        .status,
    ).toBe(201);
    const down = await api(u).put("/assinatura", { plano_codigo: "basico" });
    expect(down.status).toBe(422);
    expect(down.body.error.message).toContain("contadores (2/1)");
    const ass = await api(u).get("/assinatura");
    expect(ass.body.plano.codigo).toBe("black");
    expect(ass.body.historico).toHaveLength(2);
    expect(ass.body.uso.contadores).toBe(2);
  });
});

describe("importação de planilhas", () => {
  it("importa CSV com relatório linha a linha (aceitas e rejeitadas)", async () => {
    const u = await registrar(env);
    const csv = [
      "nome;tipoPessoa;cpf_cnpj;email;cep;uf;cidade;rua;numero;bairro",
      "Ana Souza;PFisica;529.982.247-25;ana@x.com;01001000;SP;São Paulo;Rua A;10;Centro",
      "Empresa Errada;PJuridica;11.222.333/0001-80;;;;;;;",
      "Loja Boa;PJuridica;11.222.333/0001-81;loja@x.com;;MG;BH;;;",
      "Ana Duplicada;PFisica;52998224725;;;;;;;",
    ].join("\n");
    const r = await api(u)
      .post("/importacao/clientes")
      .attach("arquivo", Buffer.from(csv), "clientes.csv");
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ total: 4, importados: 2, rejeitados: 2 });
    expect(r.body.erros.map((e: { linha: number }) => e.linha)).toEqual([3, 5]);
    const modelo = await api(u).get("/importacao/produtos/modelo.csv");
    expect(modelo.text).toContain("ncm");
  });

  it("respeita o limite do plano na importação", async () => {
    const u = await registrar(env);
    const linhas = ["nome_social;tipo_pessoa;cpf_cnpj"];
    // 101 CPFs válidos distintos > limite de 100 clientes do BÁSICO
    const { gerarCpf } = await import("./helpers.js");
    for (let i = 0; i < 101; i++) linhas.push(`Cliente ${i};FISICA;${gerarCpf()}`);
    const r = await api(u)
      .post("/importacao/clientes")
      .attach("arquivo", Buffer.from(linhas.join("\n")), "c.csv");
    expect(r.status).toBe(402);
  });
});
