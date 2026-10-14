import { createApp } from "./app.js";
import { buildContext } from "./bootstrap.js";
import { ConfigError } from "./config.js";
import { loadEnvFile } from "./env.js";

loadEnvFile();

try {
  const ctx = await buildContext(process.env);
  const app = createApp(ctx);
  const server = app.listen(ctx.cfg.PORT, ctx.cfg.HOST, () => {
    ctx.logger.info({ porta: ctx.cfg.PORT, banco: ctx.db.kind, servirWeb: ctx.cfg.SERVE_WEB }, "API FINC iniciada");
  });
  const encerrar = (sinal: string) => {
    ctx.logger.info({ sinal }, "encerrando");
    server.close(() => void ctx.db.close().finally(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGINT", () => encerrar("SIGINT"));
  process.on("SIGTERM", () => encerrar("SIGTERM"));
} catch (err) {
  if (err instanceof ConfigError) {
    console.error(err.message);
    process.exit(2);
  }
  throw err;
}
