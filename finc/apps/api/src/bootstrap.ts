import pino from "pino";
import { databaseOptions, parseConfig, type Config } from "./config.js";
import type { AppContext } from "./context.js";
import { createDb } from "./db/index.js";
import { migrate } from "./db/migrate.js";
import { createMailer } from "./services/email.js";
import { createTelegram } from "./services/telegram.js";

export async function buildContext(
  env: Record<string, string | undefined>,
  overrides: Partial<AppContext> = {},
): Promise<AppContext> {
  const cfg: Config = parseConfig(env);
  const logger = pino({ level: cfg.LOG_LEVEL, redact: ["*.senha", "*.password", "*.token"] });
  const db = overrides.db ?? (await createDb(cfg.DATABASE_URL, databaseOptions(cfg)));
  await migrate(db);
  return {
    cfg,
    logger,
    db,
    mailer: overrides.mailer ?? createMailer(cfg),
    telegram: overrides.telegram ?? createTelegram(cfg),
    fetchImpl: overrides.fetchImpl ?? fetch,
  };
}
