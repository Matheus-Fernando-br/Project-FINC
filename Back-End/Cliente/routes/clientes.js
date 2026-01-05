import express from "express";
import { supabase } from "../supabaseClient.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  const {
    nome_social,
    tipo_pessoa,
    cpf_cnpj,
    cep,
    uf,
    cidade,
    logradouro,
    bairro,
    numero,
    complemento,
    email,
    telefone,
    whatsapp
  } = req.body;

  const { error } = await supabase.from("clientes").insert({
    user_id: req.userId,
    nome_social,
    tipo_pessoa,
    cpf_cnpj,
    cep,
    uf,
    cidade,
    logradouro,
    bairro,
    numero,
    complemento,
    email,
    telefone,
    whatsapp
  });

  if (error) {
    return res.status(400).json({ erro: error.message });
  }

  res.json({ sucesso: true });
});

router.get("/", authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nome_social, tipo_pessoa")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(400).json({ erro: error.message });
  }

  res.json(data);
});

export default router;
