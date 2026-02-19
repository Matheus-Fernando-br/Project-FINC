import { Router } from "express";
import {
  criarContador,
  listarContadores,
  editarContador,
  excluirContador
} from "../controllers/contador.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", listarPlanos);
router.post("/", criarPlano);
router.put("/:id", atualizarPlano);
router.delete("/:id", deletarPlano);

export default router;
