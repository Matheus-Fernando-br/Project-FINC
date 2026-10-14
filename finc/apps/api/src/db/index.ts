import { mkdirSync } from "node:fs";
import path from "node:path";
import pg from "pg";

/**
 * Camada de acesso a dados com duas implementações intercambiáveis:
 *  - PostgreSQL (pg.Pool)        → produção e Docker (DATABASE_URL=postgres://...)
 *  - PGlite (Postgres em WASM)   → desenvolvimento e testes sem servidor (DATABASE_URL=pglite://dir | pglite://memory)
 * Ambas executam o mesmo SQL, então migrações e consultas são idênticas.
 */

export interface QueryResult<T> {
  rows: T[];
  rowCount: number;
}

export interface Queryable {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
  /** Executa um script com vários comandos (sem parâmetros). */
  exec(sql: string): Promise<void>;
}

export interface Db extends Queryable {
  readonly kind: "pg" | "pglite";
  tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

const NUMERIC = 1700;
const INT8 = 20;
const DATE = 1082;

function createPg(url: string): Db {
  const types = {
    getTypeParser: (oid: number, format?: "text" | "binary") => {
      if (oid === NUMERIC) return (v: string) => Number(v);
      if (oid === INT8) return (v: string) => Number(v);
      if (oid === DATE) return (v: string) => v;
      return pg.types.getTypeParser(oid, format as "text");
    },
  };
  const pool = new pg.Pool({ connectionString: url, max: 10, types: types as pg.CustomTypesConfig });
  const wrap = (c: pg.Pool | pg.PoolClient): Queryable => ({
    async query<T>(sql: string, params: unknown[] = []) {
      const r = await c.query(sql, params);
      return { rows: r.rows as T[], rowCount: r.rowCount ?? 0 };
    },
    async exec(sql: string) {
      await c.query(sql);
    },
  });
  const base = wrap(pool);
  return {
    kind: "pg",
    query: base.query,
    exec: base.exec,
    async tx(fn) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const out = await fn(wrap(client));
        await client.query("COMMIT");
        return out;
      } catch (e) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw e;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}

async function createPglite(url: string): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const target = url.replace(/^pglite:\/\//, "");
  let dataDir: string | undefined;
  if (target && target !== "memory") {
    dataDir = path.resolve(target);
    mkdirSync(dataDir, { recursive: true });
  }
  const db = new PGlite(dataDir);
  await db.waitReady;
  const wrap = (c: { query: typeof db.query; exec: typeof db.exec }): Queryable => ({
    async query<T>(sql: string, params: unknown[] = []) {
      const r = await c.query<Record<string, unknown>>(sql, params);
      // Normaliza tipos para o mesmo formato do driver pg configurado acima.
      const conv = r.fields.filter((f) => f.dataTypeID === NUMERIC || f.dataTypeID === INT8 || f.dataTypeID === DATE);
      if (conv.length) {
        for (const row of r.rows) {
          for (const f of conv) {
            const v = row[f.name];
            if (v === null || v === undefined) continue;
            row[f.name] = f.dataTypeID === DATE ? (v instanceof Date ? v.toISOString().slice(0, 10) : String(v)) : Number(v);
          }
        }
      }
      return { rows: r.rows as T[], rowCount: r.affectedRows ?? r.rows.length };
    },
    async exec(sql: string) {
      await c.exec(sql);
    },
  });
  const base = wrap(db);
  return {
    kind: "pglite",
    query: base.query,
    exec: base.exec,
    tx: (fn) => db.transaction((t) => fn(wrap(t))),
    close: () => db.close(),
  };
}

export async function createDb(url: string): Promise<Db> {
  if (url.startsWith("pglite:")) return createPglite(url);
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) return createPg(url);
  throw new Error("DATABASE_URL deve começar com postgres://, postgresql:// ou pglite://");
}
