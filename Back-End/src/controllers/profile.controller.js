import { supabase } from "../services/supabase.js";

export const changePassword = async (req, res) => {
  const { senhaAtual, novaSenha } = req.body;

  if (!senhaAtual || !novaSenha) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  try {
    // 🔐 valida senha atual
    const { error: signError } = await supabase.auth.signInWithPassword({
      email: req.user.email,
      password: senhaAtual,
    });

    if (signError) {
      return res.status(401).json({ error: "Senha atual incorreta" });
    }

    // 🔁 atualiza senha
    const { error } = await supabase.auth.updateUser({
      password: novaSenha,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ message: "Senha alterada com sucesso" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
};

export const updateProfile = async (req, res) => {
  const userId = req.user.id;

  const {
    social_name,
    telefone,
    tipo_pessoa,
    cpf_cnpj,
    inscricao,
    cep,
    uf,
    cidade,
    logradouro,
    numero,
    complemento,
  } = req.body;

  const { error } = await supabase
    .from("profiles")
    .update({
      social_name,
      telefone,
      tipo_pessoa,
      cpf_cnpj,
      inscricao,
      cep,
      uf,
      cidade,
      logradouro,
      numero,
      complemento,
    })
    .eq("id", userId);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ message: "Perfil atualizado com sucesso" });
};
