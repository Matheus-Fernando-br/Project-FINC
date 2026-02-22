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

export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Não autenticado" });

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Perfil não encontrado" });

    return res.json({ profile: data });
  } catch (err) {
    console.error("getMyProfile:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Não autenticado" });

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
      bairro,
      numero,
      complemento,
    } = req.body;

    // ✅ select() devolve a linha atualizada (e prova que gravou no BD)
    const { data, error } = await supabase
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
        bairro,
        numero,
        complemento,
      })
      .eq("id", userId)
      .select("*")
      .maybeSingle();

    if (error) return res.status(400).json({ error: error.message });
    if (!data)
      return res
        .status(404)
        .json({ error: "Perfil não encontrado para atualizar" });

    return res.json({
      message: "Perfil atualizado com sucesso",
      profile: data,
    });
  } catch (err) {
    console.error("updateProfile:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
};
