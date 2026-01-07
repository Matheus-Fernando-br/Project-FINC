import { Router } from "express";
import { getClientes, createCliente, deleteCliente, updateCliente } from "../controllers/cliente.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authMiddleware); // Protege todas as rotas de clientes

router.get("/", getClientes);
router.post("/", createCliente);
router.delete("/:id", deleteCliente);
router.put("/:id", updateCliente);


export default router;