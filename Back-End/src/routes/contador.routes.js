import { Router } from "express";
import {
  criarContador,
  listarContadores,
  editarContador,
  excluirContador,
} from "../controllers/contador.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", listarContadores);
router.post("/", criarContador);
router.put("/:id", editarContador);
router.delete("/:id", excluirContador);

export default router;