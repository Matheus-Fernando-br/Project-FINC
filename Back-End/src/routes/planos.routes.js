import { Router } from "express";
import { listarPlanos, buscarPlanoPorTipo, meuPlano } from "../controllers/planos.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js"; 
// ajuste o caminho conforme seu projeto (você disse que já tem)

const router = Router();
// Privado: plano atual do usuário logado
router.get("/meu/atual", authMiddleware, meuPlano);

// Público: listar planos disponíveis
router.get("/", listarPlanos);

// Público: buscar por tipo (basico/premium/black)
router.get("/:tipo", buscarPlanoPorTipo);


export default router;