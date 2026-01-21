import { Router } from "express";
import { getProdutos,
  getProdutoById,
  createProduto,
  deleteProduto,
  updateProduto,
  importProduto } from "../controllers/produto.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authMiddleware); // Protege todas as rotas de clientes

router.get("/", getProdutos);
router.get("/:id", getProdutoById);
router.post("/", createProduto);
router.delete("/:id", deleteProduto);
router.put("/:id", updateProduto);
router.put("/", importProduto);

export default router;