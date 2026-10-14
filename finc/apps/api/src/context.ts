import type { Logger } from "pino";
import type { Config } from "./config.js";
import type { Db } from "./db/index.js";
import type { Mailer } from "./services/email.js";
import type { Telegram } from "./services/telegram.js";

export interface AppContext {
  cfg: Config;
  db: Db;
  logger: Logger;
  mailer: Mailer;
  telegram: Telegram;
  /** Consulta de CEP injetável (ViaCEP em produção, fake nos testes). */
  fetchImpl: typeof fetch;
}
