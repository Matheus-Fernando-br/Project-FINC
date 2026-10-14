import type { CookieOptions, Request, RequestHandler, Response } from "express";
import type { AppContext } from "../context.js";
import { AppError } from "../http/errors.js";
import { hmac, randomToken, safeEqual, sha256 } from "../security/tokens.js";

export const SESSION_COOKIE = "finc_sessao";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function sessionCookieOptions(ctx: AppContext): CookieOptions {
  return {
    httpOnly: true,
    secure: ctx.cfg.COOKIE_SECURE || ctx.cfg.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ctx.cfg.SESSION_TTL_HORAS * 3600 * 1000,
  };
}

/** Token CSRF derivado da sessão (HMAC) — não precisa ser armazenado e muda a cada login. */
export const csrfTokenFor = (ctx: AppContext, sessionId: string) =>
  hmac(ctx.cfg.sessionSecret, `csrf:${sessionId}`);

export async function criarSessao(ctx: AppContext, req: Request, res: Response, userId: string) {
  const token = randomToken(32);
  const { rows } = await ctx.db.query<{ id: string }>(
    `INSERT INTO sessoes (usuario_id, token_hash, ip, user_agent, expira_em)
     VALUES ($1, $2, $3, $4, now() + make_interval(hours => $5)) RETURNING id`,
    [
      userId,
      sha256(token),
      req.ip ?? null,
      String(req.headers["user-agent"] ?? "").slice(0, 300),
      ctx.cfg.SESSION_TTL_HORAS,
    ],
  );
  const sessionId = rows[0]!.id;
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions(ctx));
  return { sessionId, csrfToken: csrfTokenFor(ctx, sessionId) };
}

export function limparCookieSessao(ctx: AppContext, res: Response) {
  const { maxAge: _maxAge, ...opts } = sessionCookieOptions(ctx);
  res.clearCookie(SESSION_COOKIE, opts);
}

interface SessaoRow {
  session_id: string;
  usuario_id: string;
  email: string;
  nome: string;
  papel: "usuario" | "admin";
  ultimo_uso_em: Date;
}

/** Autentica pela sessão opaca em cookie HttpOnly e exige o header X-CSRF-Token em métodos inseguros. */
export function requireAuth(ctx: AppContext): RequestHandler {
  return async (req, _res, next) => {
    const token = req.cookies?.[SESSION_COOKIE];
    if (typeof token !== "string" || token.length < 20) throw new AppError("NAO_AUTENTICADO");
    const { rows } = await ctx.db.query<SessaoRow>(
      `SELECT s.id AS session_id, s.ultimo_uso_em, u.id AS usuario_id, u.email, u.nome, u.papel
         FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id
        WHERE s.token_hash = $1 AND s.revogada_em IS NULL AND s.expira_em > now()`,
      [sha256(token)],
    );
    const s = rows[0];
    if (!s)
      throw new AppError("NAO_AUTENTICADO", "Sessão inválida ou expirada. Faça login novamente.");

    if (!SAFE_METHODS.has(req.method)) {
      const header = req.get("x-csrf-token") ?? "";
      if (!safeEqual(header, csrfTokenFor(ctx, s.session_id))) throw new AppError("CSRF");
    }

    if (Date.now() - new Date(s.ultimo_uso_em).getTime() > 5 * 60 * 1000) {
      await ctx.db.query("UPDATE sessoes SET ultimo_uso_em = now() WHERE id = $1", [s.session_id]);
    }
    req.auth = {
      userId: s.usuario_id,
      sessionId: s.session_id,
      email: s.email,
      nome: s.nome,
      papel: s.papel,
    };
    next();
  };
}

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.auth?.papel !== "admin") throw new AppError("PROIBIDO");
  next();
};

/** Helper para rotas autenticadas: devolve o id do usuário logado. */
export function uid(req: Request): string {
  if (!req.auth) throw new AppError("NAO_AUTENTICADO");
  return req.auth.userId;
}
