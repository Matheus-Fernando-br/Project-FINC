import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// rotas
import authRoutes from "./routes/auth.routes.js";
import clienteRoutes from "./routes/cliente.routes.js";

dotenv.config();

const app = express();

/* ===== CORS ===== */
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

/* ===== ROTAS ===== */
app.use("/auth", authRoutes);
app.use("/clientes", clienteRoutes);

/* ===== ROTA TESTE ===== */
app.get("/", (req, res) => {
  res.json({ status: "API FINC ONLINE 🚀" });
});

export default app;
