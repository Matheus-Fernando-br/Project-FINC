import { existsSync } from "node:fs";
import path from "node:path";

/** Carrega o primeiro .env encontrado (diretório atual ou raiz do monorepo) sem sobrescrever variáveis já definidas. */
export function loadEnvFile(): void {
  const candidatos = [path.resolve(".env"), path.resolve("../../.env")];
  for (const arquivo of candidatos) {
    if (existsSync(arquivo)) {
      process.loadEnvFile(arquivo);
      // Caminhos relativos (ex.: DATABASE_URL=pglite://./.data/pglite) passam a ser relativos ao .env.
      process.env.FINC_ROOT ??= path.dirname(arquivo);
      return;
    }
  }
}
