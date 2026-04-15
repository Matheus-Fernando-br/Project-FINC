import rateLimit from "express-rate-limit";

/** Login: máximo 5 tentativas por IP a cada 15 minutos */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Usuário ou senha inválidos" },
  skipSuccessfulRequests: false,
});
