import rateLimit, { type Options } from "express-rate-limit";
import type { RequestHandler } from "express";
import type { AppContext } from "../context.js";

function limiter(ctx: AppContext, opts: Partial<Options>): RequestHandler {
  if (ctx.cfg.RATE_LIMIT_DESATIVADO) return (_req, _res, next) => next();
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: {
          code: "MUITAS_REQUISICOES",
          message: "Muitas requisições. Tente novamente em alguns minutos.",
        },
      });
    },
    ...opts,
  });
}

export const createLimiters = (ctx: AppContext) => ({
  global: limiter(ctx, { limit: 1000 }),
  login: limiter(ctx, { limit: 10, skipSuccessfulRequests: true }),
  cadastro: limiter(ctx, { limit: 10, windowMs: 60 * 60 * 1000 }),
  senha: limiter(ctx, { limit: 5, windowMs: 60 * 60 * 1000 }),
  escrita: limiter(ctx, { limit: 300 }),
});
