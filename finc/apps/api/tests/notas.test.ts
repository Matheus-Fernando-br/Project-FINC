import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CLIENTE, ENDERECO, PRODUTO, SERVICO, api, registrar, setup, type TestEnv, type Usuario } from "./helpers.js";

let env: TestEnv;
beforeAll(async () => {
  env = await setup();
});
afterAll(() => env.close());

async function preparar(comEndereco = true) {
  const u = await registrar(env, "Loja da Maria");
  if (comEndereco) await api(u).put("/perfil", { nome: "Loja da Maria", telefone: "11988887777", ...ENDERECO });
  const cliente = (await api(u).post("/clientes", CLIENTE)).body;
  const produto = (await api(u).post("/produtos", { ...PRODUTO, controla_estoque: true, estoque_inicial: 5 })).body;
  const servico = (await api(u).post("/servicos", SERVICO)).body;
  return { u, cliente, produto, servico };
}

const notaProduto = (clienteId: string, produtoId: string, qtd = 2) => ({
  tipo: "NF-e",
  cliente_id: clienteId,
  itens: [{ produto_id: produtoId, quantidade: qtd }],
  desconto_incondicional: 1,
  observacoes: "Pedido <urgente> & especial",
  transporte: { incluir_frete: true, nome: "Transportes Rápidos", placa: "ABC1D23", peso_bruto: 2 },
});

describe("documentos fiscais", () => {
  it("aplica a regra de tipo de item por tipo de nota", async () => {
    const { u, cliente, produto, servico } = await preparar();
    const r1 = await api(u).post("/notas", { tipo: "NFS-e", cliente_id: cliente.id, itens: [{ produto_id: produto.id, quantidade: 1 }] });
    expect(r1.status).toBe(422);
    const r2 = await api(u).post("/notas", { tipo: "NF-e", cliente_id: cliente.id, itens: [{ servico_id: servico.id, quantidade: 1 }] });
    expect(r2.status).toBe(422);
    const semItens = await api(u).post("/notas", { tipo: "NF-e", cliente_id: cliente.id, itens: [] });
    expect(semItens.status).toBe(400);
  });

  it("calcula totais no servidor (preço do catálogo) e mantém rascunho editável", async () => {
    const { u, cliente, produto } = await preparar();
    const r = await api(u).post("/notas", notaProduto(cliente.id, produto.id));
    expect(r.status).toBe(201);
    expect(r.body.status).toBe("rascunho");
    expect(r.body.numero).toBeNull();
    // 2 x 10 = 20; ICMS 18% = 3.60; PIS/COFINS 3,65% = 0.73; desconto 1 → 23.33
    expect(r.body.valor_produtos).toBe(20);
    expect(r.body.valor_icms).toBe(3.6);
    expect(r.body.valor_pis_cofins).toBe(0.73);
    expect(r.body.total).toBe(23.33);
    const upd = await api(u).put(`/notas/${r.body.id}`, notaProduto(cliente.id, produto.id, 1));
    expect(upd.body.valor_produtos).toBe(10);
    expect(upd.body.itens).toHaveLength(1);
  });

  it("exige endereço do emitente para emitir", async () => {
    const { u, cliente, produto } = await preparar(false);
    const r = await api(u).post("/notas", { ...notaProduto(cliente.id, produto.id), emitir: true });
    expect(r.status).toBe(422);
    expect(r.body.error.message).toContain("Meus Dados");
    // a transação foi desfeita: nenhum rascunho órfão
    expect((await api(u).get("/notas")).body.total).toBe(0);
  });

  it("emite com numeração sequencial, baixa estoque, lança no financeiro e notifica", async () => {
    const { u, cliente, produto } = await preparar();
    const n1 = await api(u).post("/notas", { ...notaProduto(cliente.id, produto.id), emitir: true });
    expect(n1.status).toBe(201);
    expect(n1.body.status).toBe("emitida");
    expect(n1.body.numero).toBe(1);
    expect(n1.body.emitente.cidade).toBe("São Paulo");
    const rasc = await api(u).post("/notas", notaProduto(cliente.id, produto.id, 1));
    const n2 = await api(u).post(`/notas/${rasc.body.id}/emitir`);
    expect(n2.body.numero).toBe(2);
    expect((await api(u).get(`/produtos/${produto.id}`)).body.estoque_atual).toBe(2);
    const contas = await api(u).get("/financeiro/contas?tipo=receber");
    expect(contas.body).toHaveLength(2);
    expect(contas.body[0].nota_id).toBeTruthy();
    expect((await api(u).put(`/notas/${n1.body.id}`, notaProduto(cliente.id, produto.id))).status).toBe(422);
    expect((await api(u).del(`/notas/${n1.body.id}`)).status).toBe(422);
    const notifs = await api(u).get("/notificacoes");
    expect(notifs.body.items.some((n: { titulo: string }) => n.titulo === "NF-e nº 1 emitida")).toBe(true);
    // estoque insuficiente bloqueia emissão
    const r = await api(u).post("/notas", { ...notaProduto(cliente.id, produto.id, 50), emitir: true });
    expect(r.status).toBe(422);
    expect(r.body.error.message).toContain("Estoque insuficiente");
  });

  it("gera PDF e XML com escape de caracteres especiais", async () => {
    const { u, cliente, produto } = await preparar();
    const n = await api(u).post("/notas", { ...notaProduto(cliente.id, produto.id), emitir: true });
    const pdf = await api(u).get(`/notas/${n.body.id}/pdf`).buffer(true).parse((res, cb) => {
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => cb(null, Buffer.concat(chunks)));
    });
    expect(pdf.headers["content-type"]).toBe("application/pdf");
    expect((pdf.body as Buffer).subarray(0, 5).toString()).toBe("%PDF-");
    const xml = await api(u).get(`/notas/${n.body.id}/xml`);
    expect(xml.headers["content-type"]).toContain("application/xml");
    expect(xml.text).toContain("<notaFiscal xmlns=\"urn:finc:documento:2.0\">");
    expect(xml.text).toContain("<numero>000000001</numero>");
    expect(xml.text).toContain("Pedido &lt;urgente&gt; &amp; especial");
    expect(xml.text).toContain("<modalidadeFrete>0 - Por conta do remetente</modalidadeFrete>");
    expect(xml.text).toContain("SEM VALOR FISCAL");
  });

  it("cancela com justificativa, estorna estoque e cancela o recebível", async () => {
    const { u, cliente, produto } = await preparar();
    const n = await api(u).post("/notas", { ...notaProduto(cliente.id, produto.id), emitir: true });
    expect((await api(u).post(`/notas/${n.body.id}/cancelar`, { motivo: "curto" })).status).toBe(400);
    // recebimento baixado impede o cancelamento
    const conta = (await api(u).get("/financeiro/contas")).body[0];
    await api(u).post(`/financeiro/contas/${conta.id}/baixar`, {});
    expect((await api(u).post(`/notas/${n.body.id}/cancelar`, { motivo: "Erro na digitação do pedido" })).status).toBe(422);
    await api(u).post(`/financeiro/contas/${conta.id}/estornar`);
    const c = await api(u).post(`/notas/${n.body.id}/cancelar`, { motivo: "Erro na digitação do pedido" });
    expect(c.status).toBe(200);
    expect(c.body.status).toBe("cancelada");
    expect((await api(u).get(`/produtos/${produto.id}`)).body.estoque_atual).toBe(5);
    expect((await api(u).get("/financeiro/contas")).body[0].status).toBe("cancelada");
  });

  it("NFS-e soma ISS; ambiente de produção exige provedor fiscal", async () => {
    const { u, cliente, servico } = await preparar();
    const n = await api(u).post("/notas", { tipo: "NFS-e", cliente_id: cliente.id, itens: [{ servico_id: servico.id, quantidade: 2 }], emitir: true });
    expect(n.body.valor_servicos).toBe(400);
    expect(n.body.valor_iss).toBe(20);
    expect(n.body.total).toBe(420);
    const cfg = (await api(u).get("/config/fiscal")).body;
    await api(u).put("/config/fiscal", { ...cfg, ambiente: "producao", somar_impostos: false, cfop_padrao: null, natureza_operacao: null });
    const r = await api(u).post("/notas", { tipo: "NFS-e", cliente_id: cliente.id, itens: [{ servico_id: servico.id, quantidade: 1 }], emitir: true });
    expect(r.status).toBe(503);
    expect(r.body.error.code).toBe("INTEGRACAO_NAO_CONFIGURADA");
  });

  it("respeita o limite mensal de documentos do plano", async () => {
    const { u, cliente, servico } = await preparar();
    await env.ctx.db.query("UPDATE planos SET limite_notas_mes = 2 WHERE codigo = 'basico'");
    try {
      const body = { tipo: "NFS-e", cliente_id: cliente.id, itens: [{ servico_id: servico.id, quantidade: 1 }], emitir: true };
      expect((await api(u).post("/notas", body)).status).toBe(201);
      expect((await api(u).post("/notas", body)).status).toBe(201);
      const r = await api(u).post("/notas", body);
      expect(r.status).toBe(402);
      expect(r.body.error.code).toBe("LIMITE_PLANO");
    } finally {
      await env.ctx.db.query("UPDATE planos SET limite_notas_mes = 30 WHERE codigo = 'basico'");
    }
  });

  it("envia o documento ao contador por e-mail com PDF e XML anexos", async () => {
    const { u, cliente, servico } = await preparar();
    const contador = (await api(u).post("/contadores", { nome: "Contábil", email: "contabil@escritorio.com" })).body;
    const n = await api(u).post("/notas", { tipo: "NFS-e", cliente_id: cliente.id, itens: [{ servico_id: servico.id, quantidade: 1 }], emitir: true });
    const r = await api(u).post(`/notas/${n.body.id}/enviar-contador`, { contador_id: contador.id });
    expect(r.status).toBe(200);
    const email = env.emails.at(-1)!;
    expect(email.to).toBe("contabil@escritorio.com");
    expect(email.attachments?.map((a) => a.filename)).toEqual(["finc-nfse-serie1-000000001.pdf", "finc-nfse-serie1-000000001.xml"]);
  });

  it("isola documentos entre contas", async () => {
    const a = await preparar();
    const b: Usuario = await registrar(env);
    const n = await api(a.u).post("/notas", notaProduto(a.cliente.id, a.produto.id));
    expect((await api(b).get(`/notas/${n.body.id}`)).status).toBe(404);
    expect((await api(b).get(`/notas/${n.body.id}/pdf`)).status).toBe(404);
    // B não consegue usar cliente/produto de A
    const r = await api(b).post("/notas", notaProduto(a.cliente.id, a.produto.id));
    expect(r.status).toBe(422);
  });
});

describe("pedidos de venda", () => {
  it("cria pedido, gera rascunho de nota e marca como faturado", async () => {
    const { u, cliente, produto, servico } = await preparar();
    const p = await api(u).post("/pedidos", { cliente_id: cliente.id, itens: [{ produto_id: produto.id, quantidade: 3, valor_unitario: 9 }], desconto: 2 });
    expect(p.status).toBe(201);
    expect(p.body.numero).toBe(1);
    expect(p.body.total).toBe(25);
    const misto = await api(u).post("/pedidos", { cliente_id: cliente.id, itens: [{ servico_id: servico.id, quantidade: 1 }] });
    expect((await api(u).post(`/pedidos/${misto.body.id}/gerar-nota`, { tipo: "NF-e" })).status).toBe(422);
    const g = await api(u).post(`/pedidos/${p.body.id}/gerar-nota`, { tipo: "NF-e" });
    expect(g.status).toBe(201);
    const nota = (await api(u).get(`/notas/${g.body.nota_id}`)).body;
    expect(nota.status).toBe("rascunho");
    expect(nota.valor_produtos).toBe(27);
    expect(nota.observacoes).toContain("pedido nº 1");
    expect((await api(u).get(`/pedidos/${p.body.id}`)).body.status).toBe("faturado");
    expect((await api(u).post(`/pedidos/${p.body.id}/cancelar`)).status).toBe(422);
    // excluir o rascunho reabre o pedido
    await api(u).del(`/notas/${g.body.nota_id}`);
    expect((await api(u).get(`/pedidos/${p.body.id}`)).body.status).toBe("aberto");
  });
});

describe("financeiro e painel", () => {
  it("contas a pagar/receber, baixa, estorno, resumo e dashboard com dados reais", async () => {
    const { u, cliente, servico } = await preparar();
    const pagar = await api(u).post("/financeiro/contas", { tipo: "pagar", descricao: "Aluguel", valor: "1.500,00".replace(".", ""), vencimento: "2020-01-10", categoria: "Aluguel" });
    expect(pagar.status).toBe(201);
    expect(pagar.body.valor).toBe(1500);
    expect((await api(u).post("/financeiro/contas", { tipo: "pagar", descricao: "X", valor: 0, vencimento: "2024-01-01" })).status).toBe(400);
    const vencidas = await api(u).get("/financeiro/contas?status=vencida");
    expect(vencidas.body).toHaveLength(1);
    await api(u).post("/notas", { tipo: "NFS-e", cliente_id: cliente.id, itens: [{ servico_id: servico.id, quantidade: 1 }], emitir: true, vencimento: "2099-01-01" });
    let resumo = (await api(u).get("/financeiro/resumo")).body;
    expect(resumo.a_receber).toBe(210);
    expect(resumo.a_pagar).toBe(1500);
    expect(resumo.saldo_previsto).toBe(-1290);
    await api(u).post(`/financeiro/contas/${pagar.body.id}/baixar`, { forma_pagamento: "PIX" });
    resumo = (await api(u).get("/financeiro/resumo")).body;
    expect(resumo.a_pagar).toBe(0);
    expect(resumo.pago_mes).toBe(1500);
    expect((await api(u).del(`/financeiro/contas/${pagar.body.id}`)).status).toBe(422);
    const dash = (await api(u).get("/dashboard")).body;
    expect(dash.faturamentoMensal).toHaveLength(12);
    expect(dash.faturamentoMensal.at(-1).total).toBe(210);
    expect(dash.topClientes[0]).toMatchObject({ nome: CLIENTE.nome_social, total: 210 });
    expect(dash.topItens[0].nome).toBe("Consultoria");
    expect(dash.uso.notas_mes).toBe(1);
    expect(dash.plano.codigo).toBe("basico");
  });
});
