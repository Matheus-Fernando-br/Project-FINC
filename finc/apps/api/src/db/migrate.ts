import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Db } from "./index.js";

/** Localiza db/migrations subindo a partir deste módulo (funciona em src/ e em dist/). */
function findMigrationsDir(): string {
  if (process.env.MIGRATIONS_DIR) return path.resolve(process.env.MIGRATIONS_DIR);
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i++) {
    const candidate = path.join(dir, "db", "migrations");
    if (existsSync(candidate)) return candidate;
    dir = path.dirname(dir);
  }
  throw new Error("Diretório db/migrations não encontrado (defina MIGRATIONS_DIR)");
}

export async function migrate(db: Db, dir = findMigrationsDir()): Promise<string[]> {
  await db.exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations (versao text PRIMARY KEY, aplicada_em timestamptz NOT NULL DEFAULT now())",
  );
  const { rows } = await db.query<{ versao: string }>("SELECT versao FROM schema_migrations");
  const aplicadas = new Set(rows.map((r) => r.versao));
  const arquivos = readdirSync(dir)
    .filter((f) => /^\d{3}_.+\.sql$/.test(f))
    .sort();
  const novas: string[] = [];
  for (const arquivo of arquivos) {
    if (aplicadas.has(arquivo)) continue;
    const sql = readFileSync(path.join(dir, arquivo), "utf8");
    await db.tx(async (q) => {
      await q.exec(sql);
      await q.query("INSERT INTO schema_migrations (versao) VALUES ($1)", [arquivo]);
    });
    novas.push(arquivo);
  }
  return novas;
}
