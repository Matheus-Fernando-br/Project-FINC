import express from "express";
import { listarPlanos, buscarPlanoPorTipo, meuPlanoAtual } from "../controllers/planos.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// público
router.get("/", listarPlanos);

// rotas fixas (privadas)
router.get("/meu", authMiddleware, meuPlanoAtual);
router.get("/meu/atual", authMiddleware, meuPlanoAtual);

// 🚫 NUNCA MAIS /meu cai no /:tipo
router.get("/:tipo(free|basico|premium|black)", buscarPlanoPorTipo);

export default router;