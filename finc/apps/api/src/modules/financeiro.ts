import { Router } from "express";
import { baixaContaSchema, contaSchema } from "@finc/shared";
import { z } from "zod";
import type { AppContext } from "../context.js";
import type { Queryable } from "../db/index.js";
import { naoEncontrado, parse, regra } from "../http/errors.js";
import { uid } from "../middleware/auth.js";
import { audit } from "../services/audit.js";
import { planoDoUsuario, usoAtual } from "../services/planos.js";
import { UUID_RE } from "./crud.js";

const filtroContas = z.object({
  tipo: z.enum(["receber", "pagar"]).optional(),
  status: z.enum(["aberta", "paga", "cancelada", "vencida"]).optional(),
  de: z.string().date().optional(),
  ate: z.string().date().optional(),
});

async function contaDoUsuario(q: Queryable, userId: string, id: string) {
  if (!UUID_RE.test(id)) throw naoEncontrado("Lançamento");
  const { rows } = await q.query<{ id: string; status: string; nota_id: string | null }>(
    "SELECT id, status, nota_id FROM contas WHERE id = $1 AND usuario_id = $2 FOR UPDATE",
    [id, userId],
  );
  if (!rows[0]) throw naoEncontrado("Lançamento");
  return rows[0];
}

export function financeiroRoutes(ctx: AppContext) {
  const r = Router();
  const { db } = ctx;

  r.get("/contas", async (req, res) => {
    const f = parse(filtroContas, req.query);
    const params: unknown[] = [uid(req)];
    const conds = ["c.usuario_id = $1"];
    if (f.tipo) conds.push(`c.tipo = $${params.push(f.tipo)}`);
    if (f.status === "vencida") conds.push("c.status = 'aberta' AND c.vencimento < CURRENT_DATE");
    else if (f.status) conds.push(`c.status = $${params.push(f.status)}`);
    if (f.de) conds.push(`c.vencimento >= $${params.push(f.de)}::date`);
    if (f.ate) conds.push(`c.vencimento <= $${params.push(f.ate)}::date`);
    const { rows } = await db.query(
      `SELECT c.*, cl.nome_social AS cliente_nome, (c.status = 'aberta' AND c.vencimento < CURRENT_DATE) AS vencida
         FROM contas c LEFT JOIN clientes cl ON cl.id = c.cliente_id
        WHERE ${conds.join(" AND ")} ORDER BY c.vencimento ASC, c.criado_em ASC LIMIT 1000`,
      params,
    );
    res.json(rows);
  });

  r.get("/resumo", async (req, res) => {
    const { rows } = await db.query(
      `SELECT
         COALESCE(sum(valor) FILTER (WHERE tipo='receber' AND status='aberta'), 0) AS a_receber,
         COALESCE(sum(valor) FILTER (WHERE tipo='pagar' AND status='aberta'), 0) AS a_pagar,
         COALESCE(sum(valor) FILTER (WHERE tipo='receber' AND status='aberta' AND vencimento < CURRENT_DATE), 0) AS receber_vencido,
         COALESCE(sum(valor) FILTER (WHERE tipo='pagar' AND status='aberta' AND vencimento < CURRENT_DATE), 0) AS pagar_vencido,
         COALESCE(sum(valor) FILTER (WHERE tipo='receber' AND status='paga' AND data_pagamento >= date_trunc('month', CURRENT_DATE)), 0) AS recebido_mes,
         COALESCE(sum(valor) FILTER (WHERE tipo='pagar' AND status='paga' AND data_pagamento >= date_trunc('month', CURRENT_DATE)), 0) AS pago_mes
       FROM contas WHERE usuario_id = $1`,
      [uid(req)],
    );
    const s = rows[0] as Record<string, number>;
    res.json({ ...s, saldo_previsto: Number(s.a_receber) - Number(s.a_pagar), saldo_mes: Number(s.recebido_mes) - Number(s.pago_mes) });
  });

  r.post("/contas", async (req, res) => {
    const c = parse(contaSchema, req.body);
    if (c.cliente_id) {
      const ok = await db.query("SELECT 1 FROM clientes WHERE id = $1 AND usuario_id = $2", [c.cliente_id, uid(req)]);
      if (!ok.rows[0]) throw regra("Cliente não encontrado.");
    }
    const { rows } = await db.query<{ id: string }>(
      `INSERT INTO contas (usuario_id, tipo, descricao, valor, vencimento, categoria, cliente_id, observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [uid(req), c.tipo, c.descricao, c.valor, c.vencimento, c.categoria ?? null, c.cliente_id ?? null, c.observacoes ?? null],
    );
    await audit(db, req, uid(req), "contas.criar", "contas", rows[0]!.id);
    res.status(201).json(rows[0]);
  });

  r.put("/contas/:id", async (req, res) => {
    const c = parse(contaSchema, req.body);
    const out = await db.tx(async (q) => {
      const atual = await contaDoUsuario(q, uid(req), req.params.id);
      if (atual.status !== "aberta") throw regra("Somente lançamentos em aberto podem ser editados.");
      if (atual.nota_id) throw regra("Lançamentos gerados por documento fiscal só podem ter a baixa registrada.");
      const { rows } = await q.query(
        `UPDATE contas SET tipo=$3, descricao=$4, valor=$5, vencimento=$6, categoria=$7, cliente_id=$8, observacoes=$9, atualizado_em=now()
          WHERE id=$1 AND usuario_id=$2 RETURNING *`,
        [req.params.id, uid(req), c.tipo, c.descricao, c.valor, c.vencimento, c.categoria ?? null, c.cliente_id ?? null, c.observacoes ?? null],
      );
      return rows[0];
    });
    await audit(db, req, uid(req), "contas.atualizar", "contas", req.params.id);
    res.json(out);
  });

  r.post("/contas/:id/baixar", async (req, res) => {
    const b = parse(baixaContaSchema, req.body ?? {});
    await db.tx(async (q) => {
      const atual = await contaDoUsuario(q, uid(req), req.params.id);
      if (atual.status !== "aberta") throw regra("Somente lançamentos em aberto podem ser baixados.");
      await q.query(
        "UPDATE contas SET status='paga', data_pagamento=COALESCE($3::date, CURRENT_DATE), forma_pagamento=$4, atualizado_em=now() WHERE id=$1 AND usuario_id=$2",
        [req.params.id, uid(req), b.data_pagamento ?? null, b.forma_pagamento ?? null],
      );
      await audit(q, req, uid(req), "contas.baixar", "contas", req.params.id);
    });
    res.json({ ok: true });
  });

  r.post("/contas/:id/estornar", async (req, res) => {
    await db.tx(async (q) => {
      const atual = await contaDoUsuario(q, uid(req), req.params.id);
      if (atual.status !== "paga") throw regra("Somente lançamentos pagos podem ser estornados.");
      await q.query("UPDATE contas SET status='aberta', data_pagamento=NULL, forma_pagamento=NULL, atualizado_em=now() WHERE id=$1", [req.params.id]);
      await audit(q, req, uid(req), "contas.estornar", "contas", req.params.id);
    });
    res.json({ ok: true });
  });

  r.delete("/contas/:id", async (req, res) => {
    await db.tx(async (q) => {
      const atual = await contaDoUsuario(q, uid(req), req.params.id);
      if (atual.nota_id) throw regra("Lançamentos de documento fiscal são cancelados junto com o documento.");
      if (atual.status === "paga") throw regra("Estorne o lançamento antes de excluí-lo.");
      await q.query("DELETE FROM contas WHERE id = $1", [req.params.id]);
      await audit(q, req, uid(req), "contas.excluir", "contas", req.params.id);
    });
    res.json({ ok: true });
  });

  return r;
}

/** Indicadores do painel — todos calculados a partir dos dados reais do usuário. */
export function dashboardRoutes(ctx: AppContext) {
  const r = Router();
  const { db } = ctx;
  r.get("/", async (req, res) => {
    const id = uid(req);
    const [faturamento, topClientes, topItens, porTipo, financeiro, estoqueBaixo, plano, uso, recentes] = await Promise.all([
      db.query(
        `SELECT to_char(m, 'YYYY-MM') AS mes, COALESCE(sum(n.total), 0) AS total, count(n.id)::int AS quantidade
           FROM generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month') m
           LEFT JOIN notas n ON n.usuario_id = $1 AND n.status = 'emitida' AND date_trunc('month', n.data_emissao) = m
          GROUP BY m ORDER BY m`,
        [id],
      ),
      db.query(
        `SELECT destinatario->>'nome' AS nome, sum(total) AS total, count(*)::int AS quantidade FROM notas
          WHERE usuario_id = $1 AND status = 'emitida' GROUP BY 1 ORDER BY 2 DESC LIMIT 5`,
        [id],
      ),
      db.query(
        `SELECT i.descricao AS nome, i.tipo, sum(i.subtotal) AS total, sum(i.quantidade) AS quantidade
           FROM nota_itens i JOIN notas n ON n.id = i.nota_id
          WHERE n.usuario_id = $1 AND n.status = 'emitida' GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 5`,
        [id],
      ),
      db.query(
        `SELECT tipo, count(*)::int AS quantidade, COALESCE(sum(total), 0) AS total FROM notas
          WHERE usuario_id = $1 AND status = 'emitida' GROUP BY tipo ORDER BY tipo`,
        [id],
      ),
      db.query(
        `SELECT
           COALESCE(sum(valor) FILTER (WHERE tipo='receber' AND status='aberta'), 0) AS a_receber,
           COALESCE(sum(valor) FILTER (WHERE tipo='pagar' AND status='aberta'), 0) AS a_pagar,
           count(*) FILTER (WHERE status='aberta' AND vencimento < CURRENT_DATE)::int AS vencidas,
           count(*) FILTER (WHERE status='aberta' AND vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + 7)::int AS vencendo_7_dias
         FROM contas WHERE usuario_id = $1`,
        [id],
      ),
      db.query(
        `SELECT id, nome, sku, estoque_atual, estoque_minimo FROM produtos
          WHERE usuario_id = $1 AND controla_estoque AND estoque_minimo IS NOT NULL AND estoque_atual <= estoque_minimo
          ORDER BY nome LIMIT 10`,
        [id],
      ),
      planoDoUsuario(db, id),
      usoAtual(db, id),
      db.query(
        `SELECT id, tipo, numero, status, total, data_emissao, criado_em, destinatario->>'nome' AS cliente_nome
           FROM notas WHERE usuario_id = $1 ORDER BY COALESCE(data_emissao, criado_em) DESC LIMIT 5`,
        [id],
      ),
    ]);
    res.json({
      faturamentoMensal: faturamento.rows,
      topClientes: topClientes.rows,
      topItens: topItens.rows,
      notasPorTipo: porTipo.rows,
      financeiro: financeiro.rows[0],
      estoqueBaixo: estoqueBaixo.rows,
      plano,
      uso,
      notasRecentes: recentes.rows,
    });
  });
  return r;
}
