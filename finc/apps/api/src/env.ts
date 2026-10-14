import { existsSync } from "node:fs";
import path from "node:path";

/** Carrega o primeiro .env encontrado (diretório atual ou raiz do monorepo) sem sobrescrever variáveis já definidas. */
export function loadEnvFile(): void {
  const candidatos = [path.resolve(".env"), path.resolve("../../.env")];
  for (const arquivo of candidatos) {
    if (existsSync(arquivo)) {
      process.loadEnvFile(arquivo);
      return;
    }
  }
}
