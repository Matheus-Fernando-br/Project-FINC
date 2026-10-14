import { Router } from "express";
import {
  compraSchema,
  fornecedorSchema,
  orcamentoSchema,
  receberCompraSchema,
  round2,
} from "@finc/shared";
import { z } from "zod";
import type { AppContext } from "../context.js";
import type { Queryable } from "../db/index.js";
import { naoEncontrado, parse, regra } from "../http/errors.js";
import { uid } from "../middleware/auth.js";
import { audit } from "../services/audit.js";
import { toCsv } from "../services/csv.js";
import { notificar } from "../services/notificacoes.js";
import { movimentar } from "./cadastros.js";
import { crudRoutes, UUID_RE, type CrudDef } from "./crud.js";
import { resolverItens } from "./notas.js";
import { criarPedido } from "./pedidos.js";

const END = ["cep", "uf", "cidade", "logradouro", "bairro", "numero", "complemento"];

const fornecedoresDef: CrudDef = {
  tabela: "fornecedores",
  entidade: "Fornecedor",
  schema: fornecedorSchema,
  colunas: [
    "nome_social",
    "tipo_pessoa",
    "cpf_cnpj",
    "inscricao_estadual",
    "contato",
    "email",
    "telefone",
    "observacoes",
    ...END,
  ],
  ordem: "nome_social ASC",
  busca: ["nome_social", "cpf_cnpj", "email", "contato", "cidade"],
  csv: ["nome_social", "tipo_pessoa", "cpf_cnpj", "contato", "email", "telefone", ...END].map(
    (c) => ({ coluna: c, titulo: c }),
  ),
};

/** Próximo número sequencial por conta em tabelas com UNIQUE(usuario_id, numero). */
async function proximoNumero(q: Queryable, tabela: "compras" | "orcamentos", userId: string) {
  const { rows } = await q.query<{ n: number }>(
    `SELECT COALESCE(max(numero), 0) + 1 AS n FROM ${tabela} WHERE usuario_id = $1`,
    [userId],
  );
  return rows[0]!.n;
}

/* ======================= Compras ======================= */

async function carregarCompra(q: Queryable, userId: string, id: string, lock = false) {
  if (!UUID_RE.test(id)) throw naoEncontrado("Compra");
  const { rows } = await q.query<Record<string, unknown>>(
    `SELECT c.*, f.nome_social AS fornecedor_nome FROM compras c LEFT JOIN fornecedores f ON f.id = c.fornecedor_id
      WHERE c.id = $1 AND c.usuario_id = $2 ${lock ? "FOR UPDATE OF c" : ""}`,
    [id, userId],
  );
  const c = rows[0];
  if (!c) throw naoEncontrado("Compra");
  c.itens = (
    await q.query("SELECT * FROM compra_itens WHERE compra_id = $1 ORDER BY ordem", [id])
  ).rows;
  return c;
}

async function gravarCompra(
  q: Queryable,
  userId: string,
  compraId: string,
  input: z.infer<typeof compraSchema>,
) {
  const forn = await q.query("SELECT 1 FROM fornecedores WHERE id = $1 AND usuario_id = $2", [
    input.fornecedor_id,
    userId,
  ]);
  if (!forn.rows[0]) throw regra("Fornecedor não encontrado.");
  await q.query("DELETE FROM compra_itens WHERE compra_id = $1", [compraId]);
  let bruto = 0;
  for (const [idx, it] of input.itens.entries()) {
    const { rows } = await q.query<{ nome: string }>(
      "SELECT nome FROM produtos WHERE id = $1 AND usuario_id = $2",
      [it.produto_id, userId],
    );
    if (!rows[0]) throw regra(`Item ${idx + 1}: produto não encontrado.`);
    const subtotal = round2(it.quantidade * it.custo_unitario);
    bruto += subtotal;
    await q.query(
      `INSERT INTO compra_itens (compra_id, ordem, produto_id, descricao, quantidade, custo_unitario, subtotal)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [compraId, idx + 1, it.produto_id, rows[0].nome, it.quantidade, it.custo_unitario, subtotal],
    );
  }
  const total = Math.max(0, round2(bruto + (input.frete ?? 0) - (input.desconto ?? 0)));
  await q.query(
    `UPDATE compras SET fornecedor_id=$3, data_compra=COALESCE($4::date, data_compra), previsao=$5, frete=$6, desconto=$7,
       total=$8, observacoes=$9, atualizado_em=now() WHERE id=$1 AND usuario_id=$2`,
    [
      compraId,
      userId,
      input.fornecedor_id,
      input.data_compra ?? null,
      input.previsao ?? null,
      input.frete ?? 0,
      input.desconto ?? 0,
      total,
      input.observacoes ?? null,
    ],
  );
}

export function comprasRoutes(ctx: AppContext) {
  const r = Router();
  const { db } = ctx;

  r.get("/", async (req, res) => {
    const params: unknown[] = [uid(req)];
    let filtro = "";
    if (
      typeof req.query.status === "string" &&
      ["aberta", "recebida", "cancelada"].includes(req.query.status)
    ) {
      params.push(req.query.status);
      filtro = "AND c.status = $2";
    }
    const { rows } = await db.query(
      `SELECT c.id, c.numero, c.status, c.data_compra, c.previsao, c.total, f.nome_social AS fornecedor_nome
         FROM compras c LEFT JOIN fornecedores f ON f.id = c.fornecedor_id
        WHERE c.usuario_id = $1 ${filtro} ORDER BY c.numero DESC LIMIT 500`,
      params,
    );
    res.json(rows);
  });

  r.get("/:id", async (req, res) => res.json(await carregarCompra(db, uid(req), req.params.id)));

  r.post("/", async (req, res) => {
    const input = parse(compraSchema, req.body);
    const id = await db.tx(async (q) => {
      const numero = await proximoNumero(q, "compras", uid(req));
      const { rows } = await q.query<{ id: string }>(
        "INSERT INTO compras (usuario_id, numero, fornecedor_id) VALUES ($1, $2, $3) RETURNING id",
        [uid(req), numero, input.fornecedor_id],
      );
      await gravarCompra(q, uid(req), rows[0]!.id, input);
      await audit(q, req, uid(req), "compras.criar", "compras", rows[0]!.id);
      return rows[0]!.id;
    });
    res.status(201).json(await carregarCompra(db, uid(req), id));
  });

  r.put("/:id", async (req, res) => {
    const input = parse(compraSchema, req.body);
    await db.tx(async (q) => {
      const c = await carregarCompra(q, uid(req), req.params.id, true);
      if (c.status !== "aberta") throw regra("Somente compras em aberto podem ser alteradas.");
      await gravarCompra(q, uid(req), req.params.id, input);
      await audit(q, req, uid(req), "compras.atualizar", "compras", req.params.id);
    });
    res.json(await carregarCompra(db, uid(req), req.params.id));
  });

  /** Recebimento: entrada no estoque e conta a pagar ao fornecedor. */
  r.post("/:id/receber", async (req, res) => {
    const opt = parse(receberCompraSchema, req.body ?? {});
    await db.tx(async (q) => {
      const c = await carregarCompra(q, uid(req), req.params.id, true);
      if (c.status !== "aberta") throw regra("Esta compra já foi recebida ou cancelada.");
      const itens = c.itens as { produto_id: string | null; quantidade: number }[];
      for (const it of itens) {
        if (!it.produto_id) continue;
        const p = await q.query<{ controla_estoque: boolean }>(
          "SELECT controla_estoque FROM produtos WHERE id = $1 AND usuario_id = $2",
          [it.produto_id, uid(req)],
        );
        if (p.rows[0]?.controla_estoque) {
          await movimentar(
            q,
            uid(req),
            it.produto_id,
            "entrada",
            Number(it.quantidade),
            `Entrada pela compra nº ${c.numero}`,
          );
        }
      }
      await q.query(
        "UPDATE compras SET status='recebida', recebida_em=now(), atualizado_em=now() WHERE id=$1",
        [req.params.id],
      );
      if (opt.gerar_conta && Number(c.total) > 0) {
        await q.query(
          `INSERT INTO contas (usuario_id, tipo, descricao, valor, vencimento, categoria, fornecedor_id, compra_id)
           VALUES ($1, 'pagar', $2, $3, COALESCE($4::date, CURRENT_DATE + 30), 'Fornecedores', $5, $6)`,
          [
            uid(req),
            `Compra nº ${c.numero} — ${c.fornecedor_nome ?? "fornecedor"}`,
            c.total,
            opt.vencimento ?? null,
            c.fornecedor_id,
            req.params.id,
          ],
        );
      }
      await notificar(ctx, q, uid(req), {
        tipo: "compra",
        titulo: `Compra nº ${c.numero} recebida`,
        mensagem: "Estoque atualizado e conta a pagar lançada no financeiro.",
        link: `/compras/${req.params.id}`,
      });
      await audit(q, req, uid(req), "compras.receber", "compras", req.params.id);
    });
    res.json(await carregarCompra(db, uid(req), req.params.id));
  });

  r.post("/:id/cancelar", async (req, res) => {
    await db.tx(async (q) => {
      const c = await carregarCompra(q, uid(req), req.params.id, true);
      if (c.status !== "aberta") throw regra("Somente compras em aberto podem ser canceladas.");
      await q.query("UPDATE compras SET status='cancelada', atualizado_em=now() WHERE id=$1", [
        req.params.id,
      ]);
      await audit(q, req, uid(req), "compras.cancelar", "compras", req.params.id);
    });
    res.json(await carregarCompra(db, uid(req), req.params.id));
  });
  return r;
}

/* ======================= Orçamentos ======================= */

async function carregarOrcamento(q: Queryable, userId: string, id: string, lock = false) {
  if (!UUID_RE.test(id)) throw naoEncontrado("Orçamento");
  const { rows } = await q.query<Record<string, unknown>>(
    `SELECT o.*, c.nome_social AS cliente_nome FROM orcamentos o LEFT JOIN clientes c ON c.id = o.cliente_id
      WHERE o.id = $1 AND o.usuario_id = $2 ${lock ? "FOR UPDATE OF o" : ""}`,
    [id, userId],
  );
  const o = rows[0];
  if (!o) throw naoEncontrado("Orçamento");
  o.itens = (
    await q.query("SELECT * FROM orcamento_itens WHERE orcamento_id = $1 ORDER BY ordem", [id])
  ).rows;
  return o;
}

async function gravarOrcamento(
  q: Queryable,
  userId: string,
  id: string,
  input: z.infer<typeof orcamentoSchema>,
) {
  const cli = await q.query("SELECT 1 FROM clientes WHERE id = $1 AND usuario_id = $2", [
    input.cliente_id,
    userId,
  ]);
  if (!cli.rows[0]) throw regra("Cliente não encontrado.");
  const itens = await resolverItens(q, userId, null, input.itens);
  await q.query("DELETE FROM orcamento_itens WHERE orcamento_id = $1", [id]);
  for (const i of itens) {
    await q.query(
      `INSERT INTO orcamento_itens (orcamento_id, ordem, tipo, produto_id, servico_id, descricao, quantidade, valor_unitario, subtotal)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        id,
        i.ordem,
        i.tipo,
        i.produto_id,
        i.servico_id,
        i.descricao,
        i.quantidade,
        i.valor_unitario,
        i.subtotal,
      ],
    );
  }
  const total = Math.max(
    0,
    round2(itens.reduce((s, i) => s + i.subtotal, 0) - (input.desconto ?? 0)),
  );
  await q.query(
    `UPDATE orcamentos SET cliente_id=$3, data_orcamento=COALESCE($4::date, data_orcamento), validade=$5, desconto=$6,
       total=$7, condicoes=$8, observacoes=$9, atualizado_em=now() WHERE id=$1 AND usuario_id=$2`,
    [
      id,
      userId,
      input.cliente_id,
      input.data_orcamento ?? null,
      input.validade ?? null,
      input.desconto ?? 0,
      total,
      input.condicoes ?? null,
      input.observacoes ?? null,
    ],
  );
}

export function orcamentosRoutes(ctx: AppContext) {
  const r = Router();
  const { db } = ctx;

  r.get("/", async (req, res) => {
    const params: unknown[] = [uid(req)];
    let filtro = "";
    if (
      typeof req.query.status === "string" &&
      ["aberto", "aprovado", "recusado", "convertido"].includes(req.query.status)
    ) {
      params.push(req.query.status);
      filtro = "AND o.status = $2";
    }
    const { rows } = await db.query(
      `SELECT o.id, o.numero, o.status, o.data_orcamento, o.validade, o.total, o.pedido_id, c.nome_social AS cliente_nome,
              (o.status = 'aberto' AND o.validade IS NOT NULL AND o.validade < CURRENT_DATE) AS vencido
         FROM orcamentos o LEFT JOIN clientes c ON c.id = o.cliente_id
        WHERE o.usuario_id = $1 ${filtro} ORDER BY o.numero DESC LIMIT 500`,
      params,
    );
    res.json(rows);
  });

  r.get("/:id", async (req, res) => res.json(await carregarOrcamento(db, uid(req), req.params.id)));

  r.post("/", async (req, res) => {
    const input = parse(orcamentoSchema, req.body);
    const id = await db.tx(async (q) => {
      const numero = await proximoNumero(q, "orcamentos", uid(req));
      const { rows } = await q.query<{ id: string }>(
        "INSERT INTO orcamentos (usuario_id, numero, cliente_id) VALUES ($1, $2, $3) RETURNING id",
        [uid(req), numero, input.cliente_id],
      );
      await gravarOrcamento(q, uid(req), rows[0]!.id, input);
      await audit(q, req, uid(req), "orcamentos.criar", "orcamentos", rows[0]!.id);
      return rows[0]!.id;
    });
    res.status(201).json(await carregarOrcamento(db, uid(req), id));
  });

  r.put("/:id", async (req, res) => {
    const input = parse(orcamentoSchema, req.body);
    await db.tx(async (q) => {
      const o = await carregarOrcamento(q, uid(req), req.params.id, true);
      if (o.status !== "aberto") throw regra("Somente orçamentos em aberto podem ser alterados.");
      await gravarOrcamento(q, uid(req), req.params.id, input);
      await audit(q, req, uid(req), "orcamentos.atualizar", "orcamentos", req.params.id);
    });
    res.json(await carregarOrcamento(db, uid(req), req.params.id));
  });

  /** Converte o orçamento (aberto ou aprovado) em pedido de venda. */
  r.post("/:id/converter", async (req, res) => {
    const pedidoId = await db.tx(async (q) => {
      const o = await carregarOrcamento(q, uid(req), req.params.id, true);
      if (!["aberto", "aprovado"].includes(String(o.status))) {
        throw regra("Somente orçamentos em aberto ou aprovados podem virar pedido.");
      }
      if (!o.cliente_id) throw regra("O cliente deste orçamento foi excluído.");
      const itens = o.itens as {
        produto_id: string | null;
        servico_id: string | null;
        quantidade: number;
        valor_unitario: number;
      }[];
      const pid = await criarPedido(q, uid(req), {
        cliente_id: String(o.cliente_id),
        itens: itens.map((i) => ({
          produto_id: i.produto_id,
          servico_id: i.servico_id,
          quantidade: Number(i.quantidade),
          valor_unitario: Number(i.valor_unitario),
        })),
        desconto: Number(o.desconto),
        observacoes: `Originado do orçamento nº ${o.numero}${o.observacoes ? `. ${o.observacoes}` : ""}`,
      });
      await q.query(
        "UPDATE orcamentos SET status='convertido', pedido_id=$2, atualizado_em=now() WHERE id=$1",
        [req.params.id, pid],
      );
      await audit(q, req, uid(req), "orcamentos.converter", "orcamentos", req.params.id, {
        pedido_id: pid,
      });
      return pid;
    });
    res.status(201).json({ pedido_id: pedidoId });
  });
  r.post("/:id/:acao", async (req, res) => {
    const acao = z.enum(["aprovar", "recusar", "reabrir"]).parse(req.params.acao);
    const destino = { aprovar: "aprovado", recusar: "recusado", reabrir: "aberto" }[acao];
    await db.tx(async (q) => {
      const o = await carregarOrcamento(q, uid(req), req.params.id, true);
      const permitido =
        acao === "reabrir"
          ? ["aprovado", "recusado"].includes(String(o.status))
          : o.status === "aberto";
      if (!permitido) throw regra("Operação não permitida para o status atual do orçamento.");
      await q.query("UPDATE orcamentos SET status=$2, atualizado_em=now() WHERE id=$1", [
        req.params.id,
        destino,
      ]);
      await audit(q, req, uid(req), `orcamentos.${acao}`, "orcamentos", req.params.id);
    });
    res.json(await carregarOrcamento(db, uid(req), req.params.id));
  });

  return r;
}

/* ======================= Relatórios ======================= */

const periodoSchema = z.object({
  de: z.string().date("Data inicial inválida"),
  ate: z.string().date("Data final inválida"),
  formato: z.enum(["json", "csv"]).optional(),
});

function periodo(query: unknown) {
  const p = parse(periodoSchema, query);
  if (p.de > p.ate) throw regra("A data inicial deve ser anterior à data final.");
  if ((Date.parse(p.ate) - Date.parse(p.de)) / 86400000 > 731) {
    throw regra("Escolha um período de no máximo 2 anos.");
  }
  return p;
}

export function relatoriosRoutes(ctx: AppContext) {
  const r = Router();
  const { db } = ctx;

  const responder = (
    res: Parameters<Parameters<typeof r.get>[1]>[1],
    formato: string | undefined,
    nome: string,
    linhas: Record<string, unknown>[],
    colunas: { coluna: string; titulo: string }[],
    extra: Record<string, unknown> = {},
  ) => {
    if (formato === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${nome}.csv"`);
      res.send(toCsv(linhas, colunas));
      return;
    }
    res.json({ linhas, ...extra });
  };

  /** Vendas no período agrupadas por dia, cliente ou item. */
  r.get("/vendas", async (req, res) => {
    const p = periodo(req.query);
    const agrupar = z
      .enum(["dia", "cliente", "item", "tipo"])
      .catch("dia")
      .parse(req.query.agrupar);
    const base = `FROM notas n WHERE n.usuario_id = $1 AND n.status = 'emitida'
                  AND n.data_emissao >= $2::date AND n.data_emissao < ($3::date + 1)`;
    let sql: string;
    if (agrupar === "item") {
      sql = `SELECT i.descricao AS grupo, i.tipo, sum(i.quantidade) AS quantidade, sum(i.subtotal) AS total
               FROM nota_itens i JOIN notas n ON n.id = i.nota_id
              WHERE n.usuario_id = $1 AND n.status = 'emitida' AND n.data_emissao >= $2::date AND n.data_emissao < ($3::date + 1)
              GROUP BY 1, 2 ORDER BY total DESC`;
    } else {
      const col =
        agrupar === "dia"
          ? "to_char(n.data_emissao AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')"
          : agrupar === "cliente"
            ? "COALESCE(n.destinatario->>'nome', 'Consumidor final')"
            : "n.tipo";
      sql = `SELECT ${col} AS grupo, count(*)::int AS quantidade, sum(n.total) AS total, sum(n.valor_tributos) AS tributos
               ${base} GROUP BY 1 ORDER BY ${agrupar === "dia" ? "1" : "total DESC"}`;
    }
    const { rows } = await db.query<Record<string, unknown>>(sql, [uid(req), p.de, p.ate]);
    const total = rows.reduce((s, x) => s + Number(x.total), 0);
    responder(
      res,
      p.formato,
      `vendas-${agrupar}-${p.de}-${p.ate}`,
      rows,
      [
        { coluna: "grupo", titulo: agrupar },
        ...(agrupar === "item" ? [{ coluna: "tipo", titulo: "tipo" }] : []),
        { coluna: "quantidade", titulo: "quantidade" },
        { coluna: "total", titulo: "total" },
        ...(agrupar !== "item" ? [{ coluna: "tributos", titulo: "tributos" }] : []),
      ],
      { total: round2(total), agrupar },
    );
  });

  /** DRE simplificado (regime de caixa): recebimentos e pagamentos baixados no período, por categoria. */
  r.get("/dre", async (req, res) => {
    const p = periodo(req.query);
    const { rows } = await db.query<{ tipo: string; categoria: string; total: number }>(
      `SELECT tipo, COALESCE(categoria, 'Sem categoria') AS categoria, sum(valor) AS total FROM contas
        WHERE usuario_id = $1 AND status = 'paga' AND data_pagamento BETWEEN $2::date AND $3::date
        GROUP BY 1, 2 ORDER BY 1 DESC, 3 DESC`,
      [uid(req), p.de, p.ate],
    );
    const receitas = round2(
      rows.filter((x) => x.tipo === "receber").reduce((s, x) => s + Number(x.total), 0),
    );
    const despesas = round2(
      rows.filter((x) => x.tipo === "pagar").reduce((s, x) => s + Number(x.total), 0),
    );
    const linhas = rows.map((x) => ({
      grupo: x.tipo === "receber" ? "Receitas" : "Despesas",
      categoria: x.categoria,
      total: x.total,
    }));
    responder(
      res,
      p.formato,
      `dre-${p.de}-${p.ate}`,
      linhas,
      [
        { coluna: "grupo", titulo: "grupo" },
        { coluna: "categoria", titulo: "categoria" },
        { coluna: "total", titulo: "total" },
      ],
      { receitas, despesas, resultado: round2(receitas - despesas) },
    );
  });

  /** Fluxo de caixa diário: previsto (vencimentos em aberto) e realizado (baixas). */
  r.get("/fluxo-caixa", async (req, res) => {
    const p = periodo(req.query);
    const { rows } = await db.query<Record<string, number | string>>(
      `SELECT to_char(d, 'YYYY-MM-DD') AS dia,
              COALESCE(sum(c.valor) FILTER (WHERE c.tipo='receber' AND c.status='paga' AND c.data_pagamento = d::date), 0) AS entradas_realizadas,
              COALESCE(sum(c.valor) FILTER (WHERE c.tipo='pagar' AND c.status='paga' AND c.data_pagamento = d::date), 0) AS saidas_realizadas,
              COALESCE(sum(c.valor) FILTER (WHERE c.tipo='receber' AND c.status='aberta' AND c.vencimento = d::date), 0) AS entradas_previstas,
              COALESCE(sum(c.valor) FILTER (WHERE c.tipo='pagar' AND c.status='aberta' AND c.vencimento = d::date), 0) AS saidas_previstas
         FROM generate_series($2::date, $3::date, interval '1 day') d
         LEFT JOIN contas c ON c.usuario_id = $1 AND (c.data_pagamento = d::date OR c.vencimento = d::date)
        GROUP BY d ORDER BY d`,
      [uid(req), p.de, p.ate],
    );
    let saldo = 0;
    const linhas = rows.map((x) => {
      saldo = round2(
        saldo +
          Number(x.entradas_realizadas) +
          Number(x.entradas_previstas) -
          Number(x.saidas_realizadas) -
          Number(x.saidas_previstas),
      );
      return { ...x, saldo_acumulado: saldo };
    });
    responder(
      res,
      p.formato,
      `fluxo-caixa-${p.de}-${p.ate}`,
      linhas,
      [
        "dia",
        "entradas_realizadas",
        "saidas_realizadas",
        "entradas_previstas",
        "saidas_previstas",
        "saldo_acumulado",
      ].map((c) => ({ coluna: c, titulo: c })),
      { saldo_final: saldo },
    );
  });

  /** Posição de estoque valorizada pelo preço de venda. */
  r.get("/estoque", async (req, res) => {
    const formato = req.query.formato === "csv" ? "csv" : "json";
    const { rows } = await db.query<Record<string, unknown>>(
      `SELECT nome, sku, unidade_medida, estoque_atual, estoque_minimo, preco_unitario,
              round(estoque_atual * preco_unitario, 2) AS valor_estoque,
              (estoque_minimo IS NOT NULL AND estoque_atual <= estoque_minimo) AS abaixo_minimo
         FROM produtos WHERE usuario_id = $1 AND controla_estoque ORDER BY nome`,
      [uid(req)],
    );
    const total = rows.reduce((s, x) => s + Number(x.valor_estoque), 0);
    responder(
      res,
      formato,
      "posicao-estoque",
      rows,
      [
        "nome",
        "sku",
        "unidade_medida",
        "estoque_atual",
        "estoque_minimo",
        "preco_unitario",
        "valor_estoque",
      ].map((c) => ({ coluna: c, titulo: c })),
      { valor_total: round2(total) },
    );
  });
  return r;
}

/** Busca global (barra de pesquisa do topo): clientes, produtos, serviços, notas e fornecedores. */
export function buscaRoutes(ctx: AppContext) {
  const r = Router();
  r.get("/", async (req, res) => {
    const termo = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 80) : "";
    if (termo.length < 2) return void res.json([]);
    const like = `%${termo.replace(/[%_\\]/g, "\\$&")}%`;
    const digitos = termo.replace(/\D/g, "");
    const { rows } = await ctx.db.query(
      `(SELECT 'cliente' AS tipo, id, nome_social AS titulo, cpf_cnpj AS detalhe FROM clientes
         WHERE usuario_id = $1 AND (nome_social ILIKE $2 OR cpf_cnpj = NULLIF($3, '')) LIMIT 5)
       UNION ALL
       (SELECT 'produto', id, nome, sku FROM produtos WHERE usuario_id = $1 AND (nome ILIKE $2 OR sku ILIKE $2) LIMIT 5)
       UNION ALL
       (SELECT 'servico', id, nome, codigo_interno FROM servicos WHERE usuario_id = $1 AND nome ILIKE $2 LIMIT 5)
       UNION ALL
       (SELECT 'fornecedor', id, nome_social, cpf_cnpj FROM fornecedores
         WHERE usuario_id = $1 AND (nome_social ILIKE $2 OR cpf_cnpj = NULLIF($3, '')) LIMIT 5)
       UNION ALL
       (SELECT 'nota', id, tipo || ' ' || COALESCE(lpad(numero::text, 9, '0'), 'rascunho'), destinatario->>'nome' FROM notas
         WHERE usuario_id = $1 AND (destinatario->>'nome' ILIKE $2 OR numero::text = NULLIF($3, '')) LIMIT 5)`,
      [uid(req), like, digitos],
    );
    res.json(rows);
  });
  return r;
}

export const fornecedoresRoutes = (ctx: AppContext) => crudRoutes(ctx, fornecedoresDef);
