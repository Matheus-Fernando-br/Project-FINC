import { Router } from "express";
import { TIPOS_NOTA, notaItemSchema, optText, tipoItemPermitido } from "@finc/shared";
import { z } from "zod";
import type { AppContext } from "../context.js";
import type { Queryable } from "../db/index.js";
import { naoEncontrado, parse, regra } from "../http/errors.js";
import { uid } from "../middleware/auth.js";
import { audit } from "../services/audit.js";
import { UUID_RE } from "./crud.js";
import { criarRascunho, resolverItens } from "./notas.js";

const pedidoSchema = z.object({
  cliente_id: z.string({ required_error: "Selecione um cliente" }).uuid("Selecione um cliente"),
  data_pedido: z.string().date().optional(),
  itens: z.array(notaItemSchema).min(1, "Adicione pelo menos 1 item").max(200),
  desconto: z.coerce.number().min(0).optional().default(0),
  observacoes: optText(2000),
});

async function carregar(q: Queryable, userId: string, id: string, lock = false) {
  if (!UUID_RE.test(id)) throw naoEncontrado("Pedido");
  const { rows } = await q.query<Record<string, unknown>>(
    `SELECT p.*, c.nome_social AS cliente_nome FROM pedidos p LEFT JOIN clientes c ON c.id = p.cliente_id
      WHERE p.id = $1 AND p.usuario_id = $2 ${lock ? "FOR UPDATE OF p" : ""}`,
    [id, userId],
  );
  const p = rows[0];
  if (!p) throw naoEncontrado("Pedido");
  p.itens = (await q.query("SELECT * FROM pedido_itens WHERE pedido_id = $1 ORDER BY ordem", [id])).rows;
  return p;
}

async function gravarItens(q: Queryable, userId: string, pedidoId: string, input: z.infer<typeof pedidoSchema>) {
  const { rows: cli } = await q.query("SELECT id FROM clientes WHERE id = $1 AND usuario_id = $2", [input.cliente_id, userId]);
  if (!cli[0]) throw regra("Cliente não encontrado.");
  const itens = await resolverItens(q, userId, null, input.itens);
  await q.query("DELETE FROM pedido_itens WHERE pedido_id = $1", [pedidoId]);
  for (const i of itens) {
    await q.query(
      `INSERT INTO pedido_itens (pedido_id, ordem, tipo, produto_id, servico_id, descricao, quantidade, valor_unitario, subtotal)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [pedidoId, i.ordem, i.tipo, i.produto_id, i.servico_id, i.descricao, i.quantidade, i.valor_unitario, i.subtotal],
    );
  }
  const bruto = itens.reduce((s, i) => s + i.subtotal, 0);
  const total = Math.max(0, Math.round((bruto - (input.desconto ?? 0)) * 100) / 100);
  await q.query(
    "UPDATE pedidos SET cliente_id=$3, data_pedido=COALESCE($4::date, data_pedido), desconto=$5, observacoes=$6, total=$7, atualizado_em=now() WHERE id=$1 AND usuario_id=$2",
    [pedidoId, userId, input.cliente_id, input.data_pedido ?? null, input.desconto ?? 0, input.observacoes ?? null, total],
  );
}

export function pedidosRoutes(ctx: AppContext) {
  const r = Router();
  const { db } = ctx;

  r.get("/", async (req, res) => {
    const params: unknown[] = [uid(req)];
    let filtro = "";
    if (typeof req.query.status === "string" && ["aberto", "faturado", "cancelado"].includes(req.query.status)) {
      params.push(req.query.status);
      filtro = "AND p.status = $2";
    }
    const { rows } = await db.query(
      `SELECT p.id, p.numero, p.status, p.data_pedido, p.total, p.nota_id, c.nome_social AS cliente_nome
         FROM pedidos p LEFT JOIN clientes c ON c.id = p.cliente_id WHERE p.usuario_id = $1 ${filtro}
        ORDER BY p.numero DESC LIMIT 500`,
      params,
    );
    res.json(rows);
  });

  r.get("/:id", async (req, res) => res.json(await carregar(db, uid(req), req.params.id)));

  r.post("/", async (req, res) => {
    const input = parse(pedidoSchema, req.body);
    const id = await db.tx(async (q) => {
      // Numeração sequencial por conta; o índice único protege contra corrida.
      const { rows } = await q.query<{ id: string }>(
        `INSERT INTO pedidos (usuario_id, numero, cliente_id)
         VALUES ($1, (SELECT COALESCE(max(numero), 0) + 1 FROM pedidos WHERE usuario_id = $1), $2) RETURNING id`,
        [uid(req), input.cliente_id],
      );
      const pid = rows[0]!.id;
      await gravarItens(q, uid(req), pid, input);
      await audit(q, req, uid(req), "pedidos.criar", "pedidos", pid);
      return pid;
    });
    res.status(201).json(await carregar(db, uid(req), id));
  });

  r.put("/:id", async (req, res) => {
    const input = parse(pedidoSchema, req.body);
    await db.tx(async (q) => {
      const p = await carregar(q, uid(req), req.params.id, true);
      if (p.status !== "aberto") throw regra("Somente pedidos em aberto podem ser alterados.");
      await gravarItens(q, uid(req), req.params.id, input);
      await audit(q, req, uid(req), "pedidos.atualizar", "pedidos", req.params.id);
    });
    res.json(await carregar(db, uid(req), req.params.id));
  });

  r.post("/:id/cancelar", async (req, res) => {
    await db.tx(async (q) => {
      const p = await carregar(q, uid(req), req.params.id, true);
      if (p.status !== "aberto") throw regra("Somente pedidos em aberto podem ser cancelados.");
      await q.query("UPDATE pedidos SET status='cancelado', atualizado_em=now() WHERE id=$1", [req.params.id]);
      await audit(q, req, uid(req), "pedidos.cancelar", "pedidos", req.params.id);
    });
    res.json(await carregar(db, uid(req), req.params.id));
  });

  /** Gera um rascunho de documento fiscal a partir do pedido (fluxo pedido → nota). */
  r.post("/:id/gerar-nota", async (req, res) => {
    const { tipo } = parse(z.object({ tipo: z.enum(TIPOS_NOTA) }), req.body);
    const notaId = await db.tx(async (q) => {
      const p = await carregar(q, uid(req), req.params.id, true);
      if (p.status !== "aberto") throw regra("Este pedido já foi faturado ou cancelado.");
      const itens = p.itens as { tipo: "produto" | "servico"; produto_id: string | null; servico_id: string | null; quantidade: number; valor_unitario: number }[];
      const incompat = itens.filter((i) => !tipoItemPermitido(tipo, i.tipo));
      if (incompat.length) {
        throw regra(tipo === "NFS-e" ? "NFS-e aceita apenas serviços: o pedido contém produtos." : `${tipo} aceita apenas produtos: o pedido contém serviços.`);
      }
      if (!p.cliente_id) throw regra("O cliente deste pedido foi excluído.");
      const body = {
        tipo,
        cliente_id: p.cliente_id,
        itens: itens.map((i) => ({ produto_id: i.produto_id, servico_id: i.servico_id, quantidade: Number(i.quantidade), valor_unitario: Number(i.valor_unitario) })),
        desconto_incondicional: Number(p.desconto),
        observacoes: `Referente ao pedido nº ${p.numero}${p.observacoes ? `. ${p.observacoes}` : ""}`,
        gerar_financeiro: true,
      };
      // Reaproveita o fluxo de rascunho de nota (mesmas validações).
      const nid = await criarRascunho(q, uid(req), body);
      await q.query("UPDATE pedidos SET status='faturado', nota_id=$2, atualizado_em=now() WHERE id=$1", [req.params.id, nid]);
      await audit(q, req, uid(req), "pedidos.gerar_nota", "pedidos", req.params.id, { nota_id: nid });
      return nid;
    });
    res.status(201).json({ nota_id: notaId });
  });

  return r;
}
