import { Router } from "express";
import { getProdutos,
  getProdutoById,
  createProduto,
  deleteProduto,
  updateProduto,
  importProduto } from "../controllers/produto.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { csrfProtection } from "../middlewares/csrfProtection.js";
import { sensitiveWriteRateLimiter } from "../middlewares/securityRateLimit.js";

const router = Router();

router.use(authMiddleware); // Protege todas as rotas de clientes

router.get("/", getProdutos);
router.get("/:id", getProdutoById);
router.post("/", csrfProtection, sensitiveWriteRateLimiter, createProduto);
router.delete("/:id", csrfProtection, sensitiveWriteRateLimiter, deleteProduto);
router.put("/:id", csrfProtection, sensitiveWriteRateLimiter, updateProduto);
router.put("/", csrfProtection, sensitiveWriteRateLimiter, importProduto);

export default router;