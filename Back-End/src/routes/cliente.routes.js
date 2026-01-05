import { Router } from "express";
import { criarCliente, listarClientes } from "../controllers/cliente.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/", authMiddleware, criarCliente);
router.get("/", authMiddleware, listarClientes);

export default router;
