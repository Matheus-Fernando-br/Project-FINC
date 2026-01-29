import { supabase } from "../services/supabase.js";

export const updateProfile = async (req, res) => {
  const userId = req.user.id; // vem do token
  const {
    social_name,
    telefone,
    cep,
    uf,
    cidade,
    logradouro,
    numero,
    complemento
  } = req.body;

  const { error } = await supabase
    .from("profiles")
    .update({
      social_name,
      telefone,
      cep,
      uf,
      cidade,
      logradouro,
      numero,
      complemento
    })
    .eq("id", userId);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ message: "Perfil atualizado com sucesso" });
};
