import { Router } from "express";
import {
  criarCliente,
  listarClientes,
  atualizarCliente,
  excluirCliente
} from "./cliente.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/clientes", authMiddleware, criarCliente);
router.get("/clientes", authMiddleware, listarClientes);
router.put("/clientes/:id", authMiddleware, atualizarCliente);
router.delete("/clientes/:id", authMiddleware, excluirCliente);

export default router;
