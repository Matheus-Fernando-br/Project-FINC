import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Importação das rotas
import authRoutes from "./routes/auth.routes.js";
import clienteRoutes from "./routes/cliente.routes.js";
import produtoRoutes from "./routes/produto.routes.js"; // Nova rota
import servicoRoutes from "./routes/servico.routes.js"; // Nova rota

dotenv.config();

const app = express();

/* ===== CORS ===== */
// Configurado para aceitar seu front-end na Vercel e localmente
app.use(
  cors({
    origin: [
      "https://finc-seven.vercel.app",
      "http://localhost:3000"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

/* ===== REGISTRO DE ROTAS ===== */
app.use("/auth", authRoutes);
app.use("/clientes", clienteRoutes);
app.use("/produtos", produtoRoutes); // Registrando produtos
app.use("/servicos", servicoRoutes); // Registrando serviços

/* ===== ROTA TESTE ===== */
app.get("/", (req, res) => {
  res.json({ status: "API FINC ONLINE 🚀" });
});

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`🚀 API rodando na porta ${PORT}`);
});

export default app;