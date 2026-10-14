import { databaseSsl, parseConfig } from "../config.js";
import { createDb } from "../db/index.js";
import { loadEnvFile } from "../env.js";

/** Concede o papel "admin" (painel de suporte) a um usuário já cadastrado: npm run admin:promover -- email@dominio */
loadEnvFile();
const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Uso: npm run admin:promover -- <email>");
  process.exit(1);
}
const cfg = parseConfig(process.env);
const db = await createDb(cfg.DATABASE_URL, databaseSsl(cfg));
try {
  const { rowCount } = await db.query("UPDATE usuarios SET papel = 'admin' WHERE email = $1", [
    email,
  ]);
  console.log(
    rowCount ? `Usuário ${email} agora é administrador.` : `Usuário ${email} não encontrado.`,
  );
  process.exitCode = rowCount ? 0 : 1;
} finally {
  await db.close();
}
