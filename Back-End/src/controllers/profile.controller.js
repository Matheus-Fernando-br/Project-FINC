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
    const userId = req.user.id;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Perfil não encontrado." });

    return res.json(data); // ✅ retorna o perfil direto
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno ao buscar perfil." });
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
    } = req.body || {};

    // ✅ não envie "undefined" pro banco
    const payload = {
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
    };

    Object.keys(payload).forEach(
      (k) => payload[k] === undefined && delete payload[k],
    );

    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId)
      .select(
        "id, social_name, cpf_cnpj, inscricao, tipo_pessoa, telefone, cep, uf, cidade, logradouro, bairro, numero, complemento, id_plan",
      )
      .maybeSingle();

    if (error) return res.status(400).json({ error: error.message });
    if (!data)
      return res
        .status(404)
        .json({ error: "Perfil não encontrado para atualização." });

    return res.json({
      message: "Perfil atualizado com sucesso",
      profile: data,
    });
  } catch (e) {
    return res.status(500).json({ error: "Erro interno" });
  }
};
