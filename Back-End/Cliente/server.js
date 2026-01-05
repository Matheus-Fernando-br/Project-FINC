import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import clienteRoutes from "./cliente.routes.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: "https://finc-seven.vercel.app",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(clienteRoutes);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log("Cliente API rodando na porta", PORT);
});
