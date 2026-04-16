// routes/planos.routes.js
import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  listarPlanosPublico,
  meuPlano,
  planosDisponiveis,
  atualizarMeuPlano,
} from "../controllers/planos.controller.js";
import {
  publicPlanosRateLimiter,
  sensitiveWriteRateLimiter,
} from "../middlewares/securityRateLimit.js";
import { csrfProtection } from "../middlewares/csrfProtection.js";

const router = Router();

// ✅ público
router.get("/", publicPlanosRateLimiter, listarPlanosPublico);

// ✅ privado
router.use(authMiddleware);
router.get("/meu", meuPlano);
router.get("/disponiveis", planosDisponiveis);
router.put("/meu", csrfProtection, sensitiveWriteRateLimiter, atualizarMeuPlano);

export default router;