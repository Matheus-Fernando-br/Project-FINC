import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Rotas Telegram
import {
  criarChamado,
  enviarMensagem,
  listarMensagens,
  buscarChamado,
  encerrarChamado,
} from "./telegram/chamados.js";
import { telegramWebhook } from "./telegram/webhook.js";
import { enviarFeedback } from "./telegram/feedback.js";

// Importação das rotas
import authRoutes from "./routes/auth.routes.js";
import clienteRoutes from "./routes/cliente.routes.js";
import produtoRoutes from "./routes/produto.routes.js";
import servicoRoutes from "./routes/servico.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import planosRoutes from "./routes/planos.routes.js";
import contadorRoutes from "./routes/contador.routes.js";

dotenv.config();

const app = express();

/* ===== CORS ===== */
// Configurado para aceitar seu front-end na Vercel e localmente
app.use(
  cors({
    origin: [
      "https://finc-seven.vercel.app",
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.options("*", cors());
app.use(express.json());

/* ============================= */
/* ROTAS CHAMADOS */
/* ============================= */
app.post("/chamados", criarChamado);
app.post("/mensagem", enviarMensagem);
app.get("/mensagens/:chamado_id", listarMensagens);
app.post("/feedback", enviarFeedback);
app.get("/chamados/:id", buscarChamado);
app.put("/chamados/:id/encerrar", encerrarChamado);

/* ============================= */
/* WEBHOOK TELEGRAM */
/* ============================= */
app.post("/telegram-webhook", telegramWebhook);

/* ===== REGISTRO DE ROTAS ===== */
app.use("/auth", authRoutes);
app.use("/clientes", clienteRoutes);
app.use("/produtos", produtoRoutes); // Registrando produtos
app.use("/servicos", servicoRoutes); // Registrando serviços
app.use("/api/profile", profileRoutes);
app.use("/contadores", contadorRoutes);
app.use("/planos", planosRoutes);

/* ===== ROTA TESTE ===== */
app.get("/", (req, res) => {
  res.json({ status: "API FINC ONLINE 🚀" });
});

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`🚀 API rodando na porta ${PORT}`);
});

export default app;
