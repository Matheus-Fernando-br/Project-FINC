import { Router } from "express";
import { getServicos,
  getServicoById,
  createServico,
  deleteServico,
  updateServico,
  importServico } from "../controllers/servico.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { csrfProtection } from "../middlewares/csrfProtection.js";
import { sensitiveWriteRateLimiter } from "../middlewares/securityRateLimit.js";

const router = Router();

router.use(authMiddleware); // Protege todas as rotas de clientes

router.get("/", getServicos);
router.get("/:id", getServicoById);
router.post("/", csrfProtection, sensitiveWriteRateLimiter, createServico);
router.delete("/:id", csrfProtection, sensitiveWriteRateLimiter, deleteServico);
router.put("/:id", csrfProtection, sensitiveWriteRateLimiter, updateServico);
router.put("/", csrfProtection, sensitiveWriteRateLimiter, importServico);

export default router;