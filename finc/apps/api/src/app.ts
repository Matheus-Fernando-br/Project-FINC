import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { cookieSecure } from "./config.js";
import type { AppContext } from "./context.js";
import { errorHandler, notFoundHandler } from "./http/errors.js";
import { requireAdmin, requireAuth } from "./middleware/auth.js";
import { createLimiters } from "./middleware/rateLimit.js";
import { certificadoRoutes, importacaoRoutes } from "./modules/arquivos.js";
import { authRoutes } from "./modules/auth.js";
import { cadastrosRouters } from "./modules/cadastros.js";
import {
  assinaturaRoutes,
  configRoutes,
  healthRoutes,
  lgpdRoutes,
  notificacoesRoutes,
  perfilRoutes,
  planosPublicRoutes,
  utilRoutes,
} from "./modules/conta.js";
import { dashboardRoutes, financeiroRoutes } from "./modules/financeiro.js";
import { notasRoutes } from "./modules/notas.js";
import { pedidosRoutes } from "./modules/pedidos.js";
import { adminRoutes, suporteRoutes, telegramWebhookRoutes } from "./modules/suporte.js";

/** Composition root da API: monta middlewares de segurança e todos os módulos. */
export function createApp(ctx: AppContext) {
  const app = express();
  const { cfg } = ctx;
  app.disable("x-powered-by");
  app.set(
    "trust proxy",
    cfg.TRUST_PROXY === "true" ? true : cfg.TRUST_PROXY === "false" ? false : cfg.TRUST_PROXY,
  );

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "default-src": ["'self'"],
          "img-src": ["'self'", "data:", "blob:"],
          "connect-src": ["'self'"],
          "frame-src": ["'self'", "blob:", "https://www.youtube-nocookie.com"],
          "object-src": ["'none'"],
          "frame-ancestors": ["'self'"],
          // Só força HTTPS nos recursos quando os cookies são Secure (implantação com TLS).
          "upgrade-insecure-requests": cookieSecure(cfg) ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: cookieSecure(cfg),
      referrerPolicy: { policy: "same-origin" },
    }),
  );

  // CORS restrito a origens explícitas (só necessário quando web e API estão em domínios diferentes).
  const origens = new Set([
    cfg.APP_URL,
    ...cfg.CORS_ORIGINS.split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  ]);
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && origens.has(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Vary", "Origin");
      if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type,X-CSRF-Token");
        res.setHeader("Access-Control-Max-Age", "600");
        res.sendStatus(204);
        return;
      }
    }
    next();
  });

  if (cfg.LOG_LEVEL !== "silent") {
    app.use(
      pinoHttp({
        logger: ctx.logger,
        autoLogging: { ignore: (req) => req.url === "/api/health" },
        redact: ["req.headers.cookie", "req.headers['x-csrf-token']", "res.headers['set-cookie']"],
      }),
    );
  }
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));

  const limiters = createLimiters(ctx);
  const api = express.Router();
  api.use(limiters.global);
  api.use("/health", healthRoutes(ctx));
  api.use("/planos", planosPublicRoutes(ctx));
  api.use("/auth", authRoutes(ctx, limiters));
  api.use("/integracoes/telegram/webhook", telegramWebhookRoutes(ctx));

  const auth = requireAuth(ctx);
  const escrita: express.RequestHandler = (req, res, next) =>
    ["GET", "HEAD"].includes(req.method) ? next() : limiters.escrita(req, res, next);
  const cad = cadastrosRouters(ctx);
  const privados: [string, express.RequestHandler][] = [
    ["/clientes", cad.clientes],
    ["/produtos", cad.produtos],
    ["/servicos", cad.servicos],
    ["/contadores", cad.contadores],
    ["/estoque", cad.estoque],
    ["/notas", notasRoutes(ctx)],
    ["/pedidos", pedidosRoutes(ctx)],
    ["/financeiro", financeiroRoutes(ctx)],
    ["/dashboard", dashboardRoutes(ctx)],
    ["/perfil", perfilRoutes(ctx)],
    ["/assinatura", assinaturaRoutes(ctx)],
    ["/config", configRoutes(ctx)],
    ["/notificacoes", notificacoesRoutes(ctx)],
    ["/suporte", suporteRoutes(ctx)],
    ["/certificado", certificadoRoutes(ctx)],
    ["/importacao", importacaoRoutes(ctx)],
    ["/conta", lgpdRoutes(ctx)],
    ["/util", utilRoutes(ctx)],
  ];
  for (const [prefixo, router] of privados) api.use(prefixo, auth, escrita, router);
  api.use("/admin", auth, escrita, requireAdmin, adminRoutes(ctx));
  api.use(notFoundHandler);
  app.use("/api", api);

  // Em produção a própria API serve o front-end compilado (mesma origem → cookies SameSite=Lax e CSRF simples).
  if (cfg.SERVE_WEB) {
    const dist = cfg.WEB_DIST_DIR
      ? path.resolve(cfg.WEB_DIST_DIR)
      : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../web/dist");
    if (existsSync(dist)) {
      app.use(express.static(dist, { index: false, maxAge: "1h" }));
      app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(dist, "index.html")));
    } else {
      ctx.logger.warn({ dist }, "SERVE_WEB ativo, mas o build do front-end não foi encontrado");
    }
  }

  app.use(notFoundHandler);
  app.use(errorHandler(ctx.logger));
  return app;
}
