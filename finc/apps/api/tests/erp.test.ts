import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  CLIENTE,
  ENDERECO,
  PRODUTO,
  SERVICO,
  api,
  registrar,
  setup,
  type TestEnv,
} from "./helpers.js";

let env: TestEnv;
beforeAll(async () => {
  env = await setup();
});
afterAll(() => env.close());

const FORNECEDOR = {
  nome_social: "Distribuidora Atacado LTDA",
  tipo_pessoa: "JURIDICA",
  cpf_cnpj: "11444777000161",
  contato: "Carlos",
  email: "vendas@atacado.com",
};

async function preparar() {
  const u = await registrar(env, "Mercadinho ERP");
  await api(u).put("/perfil", { nome: "Mercadinho ERP", telefone: "11988887777", ...ENDERECO });
  const cliente = (await api(u).post("/clientes", CLIENTE)).body;
  const produto = (
    await api(u).post("/produtos", { ...PRODUTO, controla_estoque: true, estoque_inicial: 2 })
  ).body;
  const servico = (await api(u).post("/servicos", SERVICO)).body;
  const fornecedor = (await api(u).post("/fornecedores", FORNECEDOR)).body;
  return { u, cliente, produto, servico, fornecedor };
}

describe("fornecedores", () => {
  it("CRUD com validação de documento e isolamento entre contas", async () => {
    const { u, fornecedor } = await preparar();
    expect(fornecedor.cpf_cnpj).toBe("11444777000161");
    expect(
      (await api(u).post("/fornecedores", { ...FORNECEDOR, cpf_cnpj: "11444777000160" })).status,
    ).toBe(400);
    expect((await api(u).post("/fornecedores", FORNECEDOR)).status).toBe(409);
    expect((await api(u).get("/fornecedores?q=atacado")).body.total).toBe(1);
    const outro = await registrar(env);
    expect((await api(outro).get(`/fornecedores/${fornecedor.id}`)).status).toBe(404);
  });
});

describe("compras (suprimentos)", () => {
  it("recebimento dá entrada no estoque e lança conta a pagar ao fornecedor", async () => {
    const { u, produto, fornecedor } = await preparar();
    const c = await api(u).post("/compras", {
      fornecedor_id: fornecedor.id,
      itens: [{ produto_id: produto.id, quantidade: 10, custo_unitario: "4,50" }],
      frete: 5,
      desconto: 2,
    });
    expect(c.status).toBe(201);
    expect(c.body.numero).toBe(1);
    expect(c.body.total).toBe(48);
    const upd = await api(u).put(`/compras/${c.body.id}`, {
      fornecedor_id: fornecedor.id,
      itens: [{ produto_id: produto.id, quantidade: 8, custo_unitario: 5 }],
    });
    expect(upd.body.total).toBe(40);
    const r = await api(u).post(`/compras/${c.body.id}/receber`, { vencimento: "2099-01-10" });
    expect(r.body.status).toBe("recebida");
    expect((await api(u).get(`/produtos/${produto.id}`)).body.estoque_atual).toBe(10);
    const contas = (await api(u).get("/financeiro/contas?tipo=pagar")).body;
    expect(contas).toHaveLength(1);
    expect(contas[0]).toMatchObject({
      valor: 40,
      vencimento: "2099-01-10",
      categoria: "Fornecedores",
    });
    expect((await api(u).post(`/compras/${c.body.id}/receber`, {})).status).toBe(422);
    expect((await api(u).post(`/compras/${c.body.id}/cancelar`)).status).toBe(422);
  });

  it("valida fornecedor e produtos da própria conta", async () => {
    const { u, produto } = await preparar();
    const outro = await preparar();
    const r = await api(u).post("/compras", {
      fornecedor_id: outro.fornecedor.id,
      itens: [{ produto_id: produto.id, quantidade: 1, custo_unitario: 1 }],
    });
    expect(r.status).toBe(422);
  });
});

describe("orçamentos", () => {
  it("aprovação e conversão em pedido de venda", async () => {
    const { u, cliente, produto, servico } = await preparar();
    const o = await api(u).post("/orcamentos", {
      cliente_id: cliente.id,
      validade: "2099-12-31",
      itens: [
        { produto_id: produto.id, quantidade: 2 },
        { servico_id: servico.id, quantidade: 1, valor_unitario: 150 },
      ],
      desconto: 10,
      condicoes: "Pagamento em 30 dias",
    });
    expect(o.status).toBe(201);
    expect(o.body.total).toBe(160);
    expect((await api(u).post(`/orcamentos/${o.body.id}/aprovar`)).body.status).toBe("aprovado");
    expect((await api(u).post(`/orcamentos/${o.body.id}/xpto`)).status).toBe(400);
    const conv = await api(u).post(`/orcamentos/${o.body.id}/converter`);
    expect(conv.status).toBe(201);
    const pedido = (await api(u).get(`/pedidos/${conv.body.pedido_id}`)).body;
    expect(pedido.total).toBe(160);
    expect(pedido.observacoes).toContain("orçamento nº 1");
    expect((await api(u).get(`/orcamentos/${o.body.id}`)).body.status).toBe("convertido");
    expect((await api(u).post(`/orcamentos/${o.body.id}/converter`)).status).toBe(422);
  });
});

describe("PDV / NFC-e ao consumidor final", () => {
  it("emite sem cliente, baixa estoque e registra recebimento no ato", async () => {
    const { u, produto } = await preparar();
    const r = await api(u).post("/notas", {
      tipo: "NFC-e",
      itens: [{ produto_id: produto.id, quantidade: 2 }],
      forma_pagamento: "PIX",
      emitir: true,
    });
    expect(r.status).toBe(201);
    expect(r.body.destinatario.nome).toBe("Consumidor final");
    expect(r.body.forma_pagamento).toBe("PIX");
    expect((await api(u).get(`/produtos/${produto.id}`)).body.estoque_atual).toBe(0);
    const conta = (await api(u).get("/financeiro/contas?tipo=receber")).body[0];
    expect(conta).toMatchObject({ status: "paga", forma_pagamento: "PIX" });
    const semCliente = await api(u).post("/notas", {
      tipo: "NF-e",
      itens: [{ produto_id: produto.id, quantidade: 1 }],
    });
    expect(semCliente.status).toBe(400);
    expect(semCliente.body.error.details[0].campo).toBe("cliente_id");
  });
});

describe("relatórios e busca", () => {
  it("vendas, DRE, fluxo de caixa e estoque com exportação CSV", async () => {
    const { u, cliente, servico, produto, fornecedor } = await preparar();
    await api(u).post("/notas", {
      tipo: "NFS-e",
      cliente_id: cliente.id,
      itens: [{ servico_id: servico.id, quantidade: 1 }],
      forma_pagamento: "Dinheiro",
      emitir: true,
    });
    await api(u).post("/financeiro/contas", {
      tipo: "pagar",
      descricao: "Aluguel",
      valor: 100,
      vencimento: "2020-01-01",
      categoria: "Aluguel",
    });
    const conta = (await api(u).get("/financeiro/contas?tipo=pagar")).body[0];
    await api(u).post(`/financeiro/contas/${conta.id}/baixar`, {});
    const compra = await api(u).post("/compras", {
      fornecedor_id: fornecedor.id,
      itens: [{ produto_id: produto.id, quantidade: 3, custo_unitario: 2 }],
    });
    await api(u).post(`/compras/${compra.body.id}/receber`, {});

    const hoje = new Date().toISOString().slice(0, 10);
    const de = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const ate = new Date(Date.now() + 40 * 86400000).toISOString().slice(0, 10);
    const porCliente = (await api(u).get(`/relatorios/vendas?de=${de}&ate=${ate}&agrupar=cliente`))
      .body;
    expect(porCliente.total).toBe(210);
    expect(porCliente.linhas[0]).toMatchObject({ grupo: CLIENTE.nome_social, quantidade: 1 });
    const porItem = (await api(u).get(`/relatorios/vendas?de=${de}&ate=${ate}&agrupar=item`)).body;
    expect(porItem.linhas[0].grupo).toBe("Consultoria");
    const dre = (await api(u).get(`/relatorios/dre?de=${de}&ate=${hoje}`)).body;
    expect(dre).toMatchObject({ receitas: 210, despesas: 100, resultado: 110 });
    const fluxo = (await api(u).get(`/relatorios/fluxo-caixa?de=${hoje}&ate=${ate}`)).body;
    expect(fluxo.linhas.length).toBeGreaterThan(30);
    expect(fluxo.saldo_final).toBe(210 - 100 - 6); // recebido hoje − aluguel pago hoje − compra a pagar
    const estoque = (await api(u).get("/relatorios/estoque")).body;
    expect(estoque.valor_total).toBe(50);
    const csv = await api(u).get(`/relatorios/vendas?de=${de}&ate=${ate}&agrupar=dia&formato=csv`);
    expect(csv.headers["content-type"]).toContain("text/csv");
    expect(csv.text).toContain("dia;quantidade;total;tributos");
    expect((await api(u).get(`/relatorios/dre?de=${ate}&ate=${de}`)).status).toBe(422);
    expect((await api(u).get(`/relatorios/dre?de=2000-01-01&ate=${hoje}`)).status).toBe(422);

    const busca = (await api(u).get("/busca?q=alfa")).body;
    expect(busca.map((b: { tipo: string }) => b.tipo)).toEqual(
      expect.arrayContaining(["cliente", "nota"]),
    );
    expect((await api(u).get("/busca?q=a")).body).toEqual([]);
  });
});
