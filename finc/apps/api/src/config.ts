import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import type { ConnectionOptions } from "node:tls";
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
  // Vazio = segue o sslmode da URL. "false" | "no-verify" (cifra sem validar o certificado) | "verify".
  DATABASE_SSL: z.enum(["", "false", "no-verify", "verify"]).default(""),
  // Schema do PostgreSQL onde ficam as tabelas da FINC (vazio = public). No Supabase use "finc".
  DATABASE_SCHEMA: z
    .string()
    .regex(/^([a-z_][a-z0-9_]{0,62})?$/, "DATABASE_SCHEMA: use letras minúsculas, números e _")
    .default(""),
  // CA para DATABASE_SSL=verify: conteúdo PEM ou caminho de arquivo (ex.: certificado do Supabase).
  DATABASE_SSL_CA: z.string().optional(),
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
  // E-mails (separados por vírgula) que recebem o papel de administrador do suporte.
  ADMIN_EMAILS: z
    .string()
    .default("")
    .transform((v) =>
      v
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ),
});

export type Config = z.infer<typeof envSchema> & { sessionSecret: string };

export class ConfigError extends Error {
  constructor(public readonly problemas: string[]) {
    super(`Configuração inválida:\n - ${problemas.join("\n - ")}`);
    this.name = "ConfigError";
  }
}

export function parseConfig(env: NodeJS.ProcessEnv | Record<string, string | undefined>): Config {
  // No Render, a URL pública do serviço vem pronta em RENDER_EXTERNAL_URL.
  const appUrl = env.APP_URL || env.RENDER_EXTERNAL_URL || undefined;
  const parsed = envSchema.safeParse({ ...env, APP_URL: appUrl });
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
  if (cfg.DATABASE_SSL === "verify" && cfg.DATABASE_SSL_CA !== undefined && !cfg.DATABASE_SSL_CA) {
    problemas.push("DATABASE_SSL_CA está vazio; remova-o ou informe o certificado PEM");
  }
  if (problemas.length) throw new ConfigError(problemas);
  // Em desenvolvimento/teste, um segredo efêmero é aceitável (sessões caem ao reiniciar).
  const sessionSecret = cfg.SESSION_SECRET ?? `dev-${randomBytes(32).toString("base64url")}`;
  return { ...cfg, sessionSecret };
}

/** Opções de conexão derivadas da configuração (SSL e schema). */
export function databaseOptions(cfg: Config) {
  return { ssl: databaseSsl(cfg), schema: cfg.DATABASE_SCHEMA || undefined };
}

/** Valor de "trust proxy" do Express: números viram contagem de saltos (ex.: "1" no Render). */
export function trustProxy(cfg: Config): boolean | number | string {
  const v = cfg.TRUST_PROXY.trim();
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^\d+$/.test(v)) return Number(v);
  return v;
}

/**
 * Opções de TLS do PostgreSQL. Quando DATABASE_SSL é definido, ele prevalece sobre o sslmode da URL
 * (no driver pg, sslmode=require passou a validar o certificado, o que falha com a CA do Supabase).
 */
export function databaseSsl(cfg: Config): false | ConnectionOptions | undefined {
  if (cfg.DATABASE_SSL === "false") return false;
  if (cfg.DATABASE_SSL === "no-verify") return { rejectUnauthorized: false };
  if (cfg.DATABASE_SSL === "verify") {
    const ca = cfg.DATABASE_SSL_CA;
    if (!ca) return { rejectUnauthorized: true };
    return {
      rejectUnauthorized: true,
      ca: ca.includes("-----BEGIN") ? ca : readFileSync(ca, "utf8"),
    };
  }
  return undefined;
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
