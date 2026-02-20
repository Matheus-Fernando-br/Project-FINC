// routes/planos.routes.js
import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  listarPlanosPublico,
  meuPlano,
  planosDisponiveis,
  atualizarMeuPlano,
} from "../controllers/planos.controller.js";

const router = Router();

// ✅ público
router.get("/", listarPlanosPublico);

// ✅ privado
router.use(authMiddleware);
router.get("/meu", meuPlano);
router.get("/disponiveis", planosDisponiveis);
router.put("/meu", atualizarMeuPlano);

export default router;