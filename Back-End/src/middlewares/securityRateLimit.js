import rateLimit from "express-rate-limit";

const baseOptions = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
};

export const globalRateLimiter = rateLimit({
  ...baseOptions,
  max: 600,
  message: { error: "Muitas requisições. Tente novamente em alguns minutos." },
});

export const authMeRateLimiter = rateLimit({
  ...baseOptions,
  max: 120,
  message: { error: "Muitas verificações de sessão. Aguarde e tente novamente." },
});

export const publicPlanosRateLimiter = rateLimit({
  ...baseOptions,
  max: 200,
  message: { error: "Muitas consultas de planos. Tente novamente mais tarde." },
});

export const sensitiveWriteRateLimiter = rateLimit({
  ...baseOptions,
  max: 80,
  message: { error: "Muitas alterações em sequência. Aguarde alguns minutos." },
});
