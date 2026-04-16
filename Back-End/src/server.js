import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import cookieParser from "cookie-parser";

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

app.set("trust proxy", 1);

/** Origens permitidas: lista fixa + CORS_ORIGINS (separado por vírgula), ex.: preview Vercel */
const DEFAULT_ORIGINS = [
  "https://finc-seven.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
];

const EXTRA = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = [...new Set([...DEFAULT_ORIGINS, ...EXTRA])];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    if (process.env.DEBUG_AUTH === "1") {
      console.warn("[CORS] origem rejeitada:", origin);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

/* ===== Segurança (headers) ===== */
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts:
      process.env.NODE_ENV === "production"
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
  }),
);

/* ===== CORS (cookies HttpOnly; origin nunca pode ser *) ===== */
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));

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
  console.log(
    `[CORS] origens permitidas (${ALLOWED_ORIGINS.length}):`,
    ALLOWED_ORIGINS.join(", "),
  );
});

export default app;
