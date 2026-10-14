import { randomBytes } from "node:crypto";
import { z } from "zod";

/**
 * Configuração validada na borda (padrão observado no REA: parseConfig + Zod).
 * Falha cedo, listando todas as variáveis inválidas de uma vez.
 */

const bool = (def: boolean) =>
  z
    .enum(["true", "false", "1", "0", ""])
    .optional()
    .transform((v) => (v === undefined || v === "" ? def : v === "true" || v === "1"));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3333),
  HOST: z.string().default("0.0.0.0"),
  APP_URL: z.string().url().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1).default("pglite://./.data/pglite"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET deve ter ao menos 32 caracteres").optional(),
  SESSION_TTL_HORAS: z.coerce.number().min(1).max(720).default(8),
  // Vazio = automático (Secure em produção). "false" permite testar em rede local sem TLS.
  COOKIE_SECURE: z.enum(["true", "false", ""]).optional(),
  CORS_ORIGINS: z.string().default(""),
  TRUST_PROXY: z.string().default("loopback"),
  SERVE_WEB: bool(false),
  WEB_DIST_DIR: z.string().optional(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  CERT_ENCRYPTION_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_SECURE: bool(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(),
  VIACEP_URL: z.string().url().default("https://viacep.com.br/ws"),
  RATE_LIMIT_DESATIVADO: bool(false),
});

export type Config = z.infer<typeof envSchema> & { sessionSecret: string };

export class ConfigError extends Error {
  constructor(public readonly problemas: string[]) {
    super(`Configuração inválida:\n - ${problemas.join("\n - ")}`);
    this.name = "ConfigError";
  }
}

export function parseConfig(env: NodeJS.ProcessEnv | Record<string, string | undefined>): Config {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    throw new ConfigError(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`));
  }
  const cfg = parsed.data;
  const problemas: string[] = [];
  if (cfg.NODE_ENV === "production") {
    if (!cfg.SESSION_SECRET) problemas.push("SESSION_SECRET é obrigatório em produção");
    if (cfg.RATE_LIMIT_DESATIVADO) {
      problemas.push(
        "RATE_LIMIT_DESATIVADO=true não é permitido em produção (use apenas em testes)",
      );
    }
    if (cfg.DATABASE_URL.startsWith("pglite:")) {
      problemas.push(
        "Em produção use PostgreSQL (DATABASE_URL=postgres://...); PGlite é apenas para desenvolvimento/testes",
      );
    }
  }
  if (cfg.CERT_ENCRYPTION_KEY && Buffer.from(cfg.CERT_ENCRYPTION_KEY, "base64").length !== 32) {
    problemas.push(
      "CERT_ENCRYPTION_KEY deve ser 32 bytes codificados em base64 (openssl rand -base64 32)",
    );
  }
  if (problemas.length) throw new ConfigError(problemas);
  // Em desenvolvimento/teste, um segredo efêmero é aceitável (sessões caem ao reiniciar).
  const sessionSecret = cfg.SESSION_SECRET ?? `dev-${cryptoRandom()}`;
  return { ...cfg, sessionSecret };
}

function cryptoRandom(): string {
  return randomBytes(32).toString("base64url");
}

/** Cookies Secure: explícito via COOKIE_SECURE ou, por padrão, ligado em produção. */
export function cookieSecure(cfg: Config): boolean {
  if (cfg.COOKIE_SECURE === "true") return true;
  if (cfg.COOKIE_SECURE === "false") return false;
  return cfg.NODE_ENV === "production";
}

export function integracoes(cfg: Config) {
  return {
    smtp: Boolean(cfg.SMTP_HOST && cfg.SMTP_FROM),
    telegram: Boolean(cfg.TELEGRAM_BOT_TOKEN && cfg.TELEGRAM_CHAT_ID),
    telegramWebhook: Boolean(cfg.TELEGRAM_BOT_TOKEN && cfg.TELEGRAM_WEBHOOK_SECRET),
    certificado: Boolean(cfg.CERT_ENCRYPTION_KEY),
  };
}
