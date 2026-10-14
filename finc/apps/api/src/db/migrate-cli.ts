import { databaseOptions, parseConfig } from "../config.js";
import { loadEnvFile } from "../env.js";
import { createDb } from "./index.js";
import { migrate } from "./migrate.js";

loadEnvFile();
const cfg = parseConfig(process.env);
const db = await createDb(cfg.DATABASE_URL, databaseOptions(cfg));
try {
  const novas = await migrate(db);
  console.log(
    novas.length ? `Migrações aplicadas: ${novas.join(", ")}` : "Banco já está atualizado.",
  );
} finally {
  await db.close();
}
