import { supabase } from "../services/supabase.js";

export const register = async (req, res) => {
  const { email, senha, socialName, tipoPessoa, cpfCnpj, telefone } = req.body;

  try {
    // 1. cria usuário no auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: senha,
      email_confirm: true
    });

    if (error) return res.status(400).json({ error: error.message });

    // 2. cria perfil
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: data.user.id,
        social_name: socialName,
        tipo_pessoa: tipoPessoa,
        cpf_cnpj: cpfCnpj,
        telefone
      });

    if (profileError) {
      return res.status(400).json({ error: profileError.message });
    }

    res.status(201).json({ message: "Usuário criado com sucesso" });

  } catch {
    res.status(500).json({ error: "Erro interno" });
  }
};

export const login = async (req, res) => {
  const { login, senha } = req.body;

  try {
    let email = login;

    // 🔁 SE NÃO FOR EMAIL, BUSCA CPF
    if (!login.includes("@")) {
      const cpf = login.replace(/\D/g, "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("cpf_cnpj", cpf)

      if (!profile) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }

      const { data: userData } =
        await supabase.auth.admin.getUserById(profile.id);

      email = userData.user.email;
    }

    // LOGIN FINAL
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password: senha
      });

    if (error) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    return res.json({
      session: data.session,
      user: data.user
    });

  } catch {
    res.status(500).json({ error: "Erro interno" });
  }
};
