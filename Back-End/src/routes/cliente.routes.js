import { Router } from "express";
import { getClientes,
  getClienteById,
  createCliente,
  deleteCliente,
  updateCliente,
  importClientes } from "../controllers/cliente.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authMiddleware); // Protege todas as rotas de clientes

router.get("/", getClientes);
router.get("/:id", getClienteById);
router.post("/", createCliente);
router.delete("/:id", deleteCliente);
router.put("/:id", updateCliente);
router.put("/", importClientes);

export default router;