import { Router } from "express";
import {
  criarContador,
  listarContadores,
  editarContador,
  excluirContador,
} from "../controllers/contador.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { csrfProtection } from "../middlewares/csrfProtection.js";
import { sensitiveWriteRateLimiter } from "../middlewares/securityRateLimit.js";

const router = Router();

router.use(authMiddleware);

router.get("/", listarContadores);
router.post("/", csrfProtection, sensitiveWriteRateLimiter, criarContador);
router.put("/:id", csrfProtection, sensitiveWriteRateLimiter, editarContador);
router.delete("/:id", csrfProtection, sensitiveWriteRateLimiter, excluirContador);

export default router;
