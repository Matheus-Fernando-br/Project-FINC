import { createClient } from "@supabase/supabase-js";
import { supabase } from "../services/supabase.js";
import {
  setAccessTokenCookie,
  clearAccessTokenCookie,
  getAccessTokenCookieOptions,
} from "../utils/authCookies.js";
import { issueCsrfToken, clearCsrfToken } from "../utils/csrf.js";
import {
  isValidEmail,
  isStrongPassword,
  validarCPF,
  validarCNPJ,
  normalizeDigits,
} from "../utils/validators.js";

const LOGIN_FAIL = { error: "Usuário ou senha inválidos" };

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

function getEphemeralClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

export const me = (req, res) => {
  issueCsrfToken(res);
  if (process.env.DEBUG_AUTH === "1") {
    console.log("[auth/me] cookie presente:", Boolean(req.cookies?.access_token));
  }
  return res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
    },
  });
};

export const logout = (req, res) => {
  clearAccessTokenCookie(res);
  clearCsrfToken(res);
  return res.json({ ok: true });
};

export const register = async (req, res) => {
  const { email, senha, nome_social, tipoPessoa, cpfCnpj, telefone } =
    req.body || {};

  const emailNorm = typeof email === "string" ? email.trim().toLowerCase() : "";
  const nome = typeof nome_social === "string" ? nome_social.trim() : "";
  const tipo = tipoPessoa === "JURIDICA" ? "JURIDICA" : tipoPessoa === "FISICA" ? "FISICA" : "";
  const docDigits = normalizeDigits(cpfCnpj);
  const telDigits = normalizeDigits(telefone);

  if (!nome || nome.length < 2 || nome.length > 200) {
    return res.status(400).json({ error: "Nome social inválido" });
  }
  if (tipo !== "FISICA" && tipo !== "JURIDICA") {
    return res.status(400).json({ error: "Tipo de pessoa inválido" });
  }
  if (!isValidEmail(emailNorm)) {
    return res.status(400).json({ error: "E-mail inválido" });
  }
  if (!isStrongPassword(senha)) {
    return res.status(400).json({
      error:
        "Senha inválida: mínimo 8 caracteres, com pelo menos uma letra e um número",
    });
  }
  if (tipo === "FISICA") {
    if (docDigits.length !== 11 || !validarCPF(docDigits)) {
      return res.status(400).json({ error: "CPF inválido" });
    }
  } else if (docDigits.length !== 14 || !validarCNPJ(docDigits)) {
    return res.status(400).json({ error: "CNPJ inválido" });
  }
  if (telDigits.length < 10 || telDigits.length > 13) {
    return res.status(400).json({ error: "Telefone inválido" });
  }

  try {
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("cpf_cnpj", docDigits)
      .maybeSingle();

    if (existingProfile) {
      return res.status(400).json({ error: "CPF/CNPJ já cadastrado" });
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: emailNorm,
      password: senha,
      email_confirm: true,
    });

    if (error) {
      const msg = (error.message || "").toLowerCase();
      if (
        msg.includes("already") ||
        msg.includes("registered") ||
        msg.includes("duplicate")
      ) {
        return res.status(400).json({ error: "E-mail já cadastrado" });
      }
      return res.status(400).json({ error: error.message || "Falha no cadastro" });
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      social_name: nome,
      tipo_pessoa: tipo,
      cpf_cnpj: docDigits,
      telefone: telDigits,
    });

    if (profileError) {
      await supabase.auth.admin.deleteUser(data.user.id);
      if (profileError.code === "23505") {
        return res.status(400).json({ error: "CPF/CNPJ já cadastrado" });
      }
      return res.status(400).json({ error: profileError.message });
    }

    return res.status(201).json({ message: "Usuário criado com sucesso" });
  } catch (error) {
    console.error("Erro no registro:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};

export const login = async (req, res) => {
  const { login: loginField, senha } = req.body || {};

  if (
    !loginField ||
    typeof loginField !== "string" ||
    !senha ||
    typeof senha !== "string"
  ) {
    return res.status(401).json(LOGIN_FAIL);
  }

  const trimmed = loginField.trim();
  if (!trimmed || senha.length === 0) {
    return res.status(401).json(LOGIN_FAIL);
  }

  try {
    let email = trimmed;

    if (!trimmed.includes("@")) {
      const cpf = normalizeDigits(trimmed);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("cpf_cnpj", cpf)
        .maybeSingle();

      if (profileError || !profile) {
        return res.status(401).json(LOGIN_FAIL);
      }

      const { data: userData, error: userError } =
        await supabase.auth.admin.getUserById(profile.id);

      if (userError || !userData?.user?.email) {
        return res.status(401).json(LOGIN_FAIL);
      }

      email = userData.user.email;
    }

    const ephemeral = getEphemeralClient();
    const { data, error } = await ephemeral.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error || !data?.session?.access_token || !data?.user?.id) {
      return res.status(401).json(LOGIN_FAIL);
    }

    setAccessTokenCookie(res, data.session.access_token);
    const csrfRaw = issueCsrfToken(res);

    if (process.env.DEBUG_AUTH === "1") {
      const opts = getAccessTokenCookieOptions();
      console.log("[auth/login] Set-Cookie enviado", {
        origin: req.headers.origin || null,
        sameSite: opts.sameSite,
        secure: opts.secure,
        httpOnly: opts.httpOnly,
        path: opts.path,
        hasAccessToken: Boolean(data.session.access_token),
        hasCsrfCookie: Boolean(csrfRaw),
        userId: data.user.id,
      });
    }

    return res.json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(401).json(LOGIN_FAIL);
  }
};
