import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts", "src/db/migrate-cli.ts", "src/scripts/promover-admin.ts"],
  format: ["esm"],
  platform: "node",
  target: "node20",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  splitting: true,
  // O pacote compartilhado do monorepo é embutido no bundle; as demais dependências ficam externas.
  noExternal: ["@finc/shared"],
});
