import { Router, type Request } from "express";
import type { RecursoLimitado } from "@finc/shared";
import type { ZodTypeAny } from "zod";
import type { AppContext } from "../context.js";
import type { Queryable } from "../db/index.js";
import { naoEncontrado, parse } from "../http/errors.js";
import { uid } from "../middleware/auth.js";
import { audit } from "../services/audit.js";
import { assertLimite } from "../services/planos.js";
import { toCsv } from "../services/csv.js";

/**
 * Fábrica de rotas CRUD multi-tenant. Elimina a duplicação de controllers da FINC original
 * e corrige o "mass assignment": somente as colunas declaradas são gravadas, e usuario_id
 * sempre vem da sessão (nunca do corpo da requisição).
 */
export interface CrudDef {
  tabela: string;
  entidade: string;
  schema: ZodTypeAny;
  updateSchema?: ZodTypeAny;
  colunas: string[];
  ordem: string;
  busca: string[];
  recurso?: RecursoLimitado;
  csv: { coluna: string; titulo: string }[];
  /** Ganchos opcionais executados na mesma transação. */
  afterInsert?: (
    q: Queryable,
    userId: string,
    row: Record<string, unknown>,
    input: Record<string, unknown>,
  ) => Promise<void>;
  filtros?: (req: Request) => { sql: string; params: unknown[] };
}

const PAGE_MAX = 200;
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function pick(obj: Record<string, unknown>, cols: string[]) {
  return cols.filter((c) => obj[c] !== undefined).map((c) => [c, obj[c]] as const);
}

export async function inserir(
  q: Queryable,
  def: CrudDef,
  userId: string,
  data: Record<string, unknown>,
) {
  const pares = pick(data, def.colunas);
  const cols = ["usuario_id", ...pares.map(([c]) => c)];
  const vals = [userId, ...pares.map(([, v]) => v)];
  const { rows } = await q.query<Record<string, unknown>>(
    `INSERT INTO ${def.tabela} (${cols.join(", ")}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING *`,
    vals,
  );
  const row = rows[0]!;
  if (def.afterInsert) await def.afterInsert(q, userId, row, data);
  return row;
}

export function crudRoutes(ctx: AppContext, def: CrudDef) {
  const r = Router();
  const { db } = ctx;
  r.param("id", (_req, _res, next, id) => {
    if (!UUID_RE.test(String(id))) throw naoEncontrado(def.entidade);
    next();
  });

  function where(req: Request) {
    const params: unknown[] = [uid(req)];
    const conds = ["usuario_id = $1"];
    const termo = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
    if (termo) {
      params.push(`%${termo.replace(/[%_\\]/g, "\\$&")}%`);
      conds.push(`(${def.busca.map((c) => `${c}::text ILIKE $${params.length}`).join(" OR ")})`);
    }
    if (def.filtros) {
      const f = def.filtros(req);
      if (f.sql) {
        conds.push(f.sql.replace(/\$(\d+)/g, (_, n) => `$${Number(n) + params.length}`));
        params.push(...f.params);
      }
    }
    return { sql: conds.join(" AND "), params };
  }

  r.get("/", async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(PAGE_MAX, Math.max(1, Number(req.query.pageSize) || 20));
    const w = where(req);
    const total = await db.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM ${def.tabela} WHERE ${w.sql}`,
      w.params,
    );
    const { rows } = await db.query(
      `SELECT * FROM ${def.tabela} WHERE ${w.sql} ORDER BY ${def.ordem} LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      w.params,
    );
    res.json({ items: rows, total: total.rows[0]?.n ?? 0, page, pageSize });
  });

  r.get("/exportar.csv", async (req, res) => {
    const w = where(req);
    const { rows } = await db.query<Record<string, unknown>>(
      `SELECT * FROM ${def.tabela} WHERE ${w.sql} ORDER BY ${def.ordem}`,
      w.params,
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${def.tabela}.csv"`);
    res.send(toCsv(rows, def.csv));
  });

  r.get("/:id", async (req, res) => {
    const { rows } = await db.query(
      `SELECT * FROM ${def.tabela} WHERE id = $1 AND usuario_id = $2`,
      [req.params.id, uid(req)],
    );
    if (!rows[0]) throw naoEncontrado(def.entidade);
    res.json(rows[0]);
  });

  r.post("/", async (req, res) => {
    const data = parse(def.schema, req.body) as Record<string, unknown>;
    const row = await db.tx(async (q) => {
      if (def.recurso) await assertLimite(q, uid(req), def.recurso);
      const created = await inserir(q, def, uid(req), data);
      await audit(q, req, uid(req), `${def.tabela}.criar`, def.tabela, String(created.id));
      return created;
    });
    res.status(201).json(row);
  });

  r.put("/:id", async (req, res) => {
    const data = parse(def.updateSchema ?? def.schema, req.body) as Record<string, unknown>;
    const pares = pick(data, def.colunas);
    const sets = pares.map(([c], i) => `${c} = $${i + 3}`);
    const { rows } = await db.query(
      `UPDATE ${def.tabela} SET ${[...sets, "atualizado_em = now()"].join(", ")}
        WHERE id = $1 AND usuario_id = $2 RETURNING *`,
      [req.params.id, uid(req), ...pares.map(([, v]) => v)],
    );
    if (!rows[0]) throw naoEncontrado(def.entidade);
    await audit(db, req, uid(req), `${def.tabela}.atualizar`, def.tabela, req.params.id);
    res.json(rows[0]);
  });

  r.delete("/:id", async (req, res) => {
    const { rowCount } = await db.query(
      `DELETE FROM ${def.tabela} WHERE id = $1 AND usuario_id = $2`,
      [req.params.id, uid(req)],
    );
    if (!rowCount) throw naoEncontrado(def.entidade);
    await audit(db, req, uid(req), `${def.tabela}.excluir`, def.tabela, req.params.id);
    res.json({ ok: true });
  });

  return r;
}
