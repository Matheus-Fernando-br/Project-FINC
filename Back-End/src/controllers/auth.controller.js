import { supabase } from "../services/supabase.js";

export const register = async (req, res) => {
  const { email, senha, nome_social, tipoPessoa, cpfCnpj, telefone } = req.body;

  try {
    // ✅ VALIDAR EMAIL ÚNICO
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const emailExists = existingUser.users.some(
      u => u.email.toLowerCase() === email.toLowerCase()
    );

    if (emailExists) {
      return res.status(400).json({ error: "Email já cadastrado" });
    }

    // ✅ VALIDAR CPF/CNPJ ÚNICO
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("cpf_cnpj", cpfCnpj.replace(/\D/g, ""))
      .single();

    if (existingProfile) {
      return res.status(400).json({ error: "CPF/CNPJ já cadastrado" });
    }

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
        social_name: nome_social,
        tipo_pessoa: tipoPessoa,
        cpf_cnpj: cpfCnpj.replace(/\D/g, ""),
        telefone
      });

    if (profileError) {
      await supabase.auth.admin.deleteUser(data.user.id);
      return res.status(400).json({ error: profileError.message });
    }

    res.status(201).json({ message: "Usuário criado com sucesso" });

  } catch (error) {
    console.error("Erro no registro:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
};

export const login = async (req, res) => {
  const { login, senha } = req.body;

  try {
    let email = login;

    // 🔁 SE NÃO FOR EMAIL, BUSCA CPF
    if (!login.includes("@")) {
      const cpf = login.replace(/\D/g, "");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("cpf_cnpj", cpf)
        .single();

      if (profileError || !profile) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }

      const { data: userData, error: userError } =
        await supabase.auth.admin.getUserById(profile.id);

      if (userError || !userData?.user) {
        return res.status(401).json({ error: "Erro ao buscar usuário" });
      }

      email = userData.user.email;
    }

    // LOGIN FINAL
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    });

    if (error) return res.status(401).json({ error: "Credenciais inválidas" });

    // 🔥 BUSCAR O NOME SOCIAL NO PERFIL
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(`
        social_name,
        cpf_cnpj,
        telefone,
        tipo_pessoa,
        cep,
        uf,
        cidade,
        logradouro,
        numero,
        complemento
      `)
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(500).json({ error: "Perfil do usuário não encontrado" });
    }

    return res.json({
      session: data.session,
      user: {
        ...data.user,
        social_name: profile.social_name || "Usuário",
        cpf_cnpj: profile.cpf_cnpj,
        telefone: profile.telefone,
        tipo_pessoa: profile.tipo_pessoa,
        cep: profile.cep,
        uf: profile.uf,
        cidade: profile.cidade,
        logradouro: profile.logradouro,
        numero: profile.numero,
        complemento: profile.complemento
      }
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
};