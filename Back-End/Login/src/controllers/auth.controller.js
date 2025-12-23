import { supabase } from "../services/supabase.js";

export const register = async (req, res) => {
  const { email, senha, socialName, tipoPessoa, cpfCnpj, telefone } = req.body;

  try {
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true
      });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // 🔒 evita duplicidade
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", authData.user.id)
      .single();

    if (!existingProfile) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          social_name: socialName,
          tipo_pessoa: tipoPessoa,
          cpf_cnpj: cpfCnpj,
          telefone
        });

      if (profileError) {
        return res.status(400).json({ error: profileError.message });
      }
    }

    return res.status(201).json({ message: "Usuário criado com sucesso" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
};

export const login = async (req, res) => {
  const { login, senha } = req.body;

  try {
    let email = login;

    if (!login.includes("@")) {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("cpf_cnpj", login)
        .single();

      if (error || !data) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }

      const { data: userData } =
        await supabase.auth.admin.getUserById(data.id);

      email = userData.user.email;
    }

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password: senha
      });

    if (error) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    return res.json(data);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
};
