import { Router } from "express";
import { getServicos,
  getServicoById,
  createServico,
  deleteServico,
  updateServico,
  importServico } from "./servico.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authMiddleware); // Protege todas as rotas de clientes

router.get("/", getServicos);
router.get("/:id", getServicoById);
router.post("/", createServico);
router.delete("/:id", deleteServico);
router.put("/:id", updateServico);
router.put("/", importServico);

export default router;