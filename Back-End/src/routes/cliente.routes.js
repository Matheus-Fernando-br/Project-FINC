import { Router } from "express";
import { getClientes,
  getClienteById,
  createCliente,
  deleteCliente,
  updateCliente,
  importClientes } from "../controllers/cliente.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { csrfProtection } from "../middlewares/csrfProtection.js";
import { sensitiveWriteRateLimiter } from "../middlewares/securityRateLimit.js";

const router = Router();

router.use(authMiddleware); // Protege todas as rotas de clientes

router.get("/", getClientes);
router.get("/:id", getClienteById);
router.post("/", csrfProtection, sensitiveWriteRateLimiter, createCliente);
router.delete("/:id", csrfProtection, sensitiveWriteRateLimiter, deleteCliente);
router.put("/:id", csrfProtection, sensitiveWriteRateLimiter, updateCliente);
router.put("/", csrfProtection, sensitiveWriteRateLimiter, importClientes);

export default router;