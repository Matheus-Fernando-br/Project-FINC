import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  forgotPasswordSchema,
  normalizarCampo,
  registerSchema,
  resetPasswordSchema,
} from "@finc/shared";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Alert, BotaoVoltar, Button, Card, Field } from "../../components/ui";
import { useForm } from "../../hooks/useForm";

/** Login por e-mail (minúsculas) ou por CPF/CNPJ (só dígitos, com ou sem pontuação). */
const normalizarLogin = (v: string) =>
  v.includes("@") ? normalizarCampo("email", v) : normalizarCampo("cpfCnpj", v) || v.trim();

function lerLembrado() {
  try {
    return localStorage.getItem("finc.lembrar_login") ?? "";
  } catch {
    return "";
  }
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const lembrado = lerLembrado();
  const f = useForm({ login: lembrado, senha: "", lembrar: Boolean(lembrado) });

  const entrar = (e: React.FormEvent) => {
    e.preventDefault();
    void f.enviar(async () => {
      await login(normalizarLogin(f.values.login), f.values.senha);
      try {
        if (f.values.lembrar) localStorage.setItem("finc.lembrar_login", f.values.login.trim());
        else localStorage.removeItem("finc.lembrar_login");
      } catch {
        /* sem armazenamento local */
      }
      const voltar = params.get("voltar");
      if (voltar && voltar.startsWith("/") && !voltar.startsWith("//"))
        return navigate(voltar, { replace: true });
      const prefs = await api
        .get<{ pagina_inicial?: string }>("/config/preferencias")
        .catch(() => null);
      navigate(prefs?.pagina_inicial ?? "/app", { replace: true });
    });
  };

  return (
    <main className="auth-page">
      <div className="auth-voltar">
        <BotaoVoltar />
      </div>
      <Card className="auth-card">
        <form className="stack" onSubmit={entrar} noValidate>
          <span className="orb" aria-hidden />
          <h1>Entrar na FINC</h1>
          {params.get("cadastro") === "ok" && (
            <Alert tone="success">Conta criada! Faça login para continuar.</Alert>
          )}
          {params.get("senha") === "ok" && (
            <Alert tone="success">Senha redefinida. Entre com a nova senha.</Alert>
          )}
          {f.erroGeral && <Alert tone="danger">{f.erroGeral}</Alert>}
          <Field label="E-mail ou CPF/CNPJ" required htmlFor="login">
            <input {...f.bind("login")} autoComplete="username" autoFocus required />
          </Field>
          <Field label="Senha" required htmlFor="senha">
            <input {...f.bind("senha")} type="password" autoComplete="current-password" required />
          </Field>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <label className="check">
              <input
                type="checkbox"
                checked={f.values.lembrar}
                onChange={(e) => f.set("lembrar", e.target.checked)}
              />{" "}
              Lembrar meu login
            </label>
            <Link to="/esqueci-senha" className="small">
              Esqueci minha senha
            </Link>
          </div>
          <Button type="submit" loading={f.enviando}>
            Entrar
          </Button>
          <p className="small muted" style={{ textAlign: "center" }}>
            Ainda não tem conta? <Link to="/cadastro">Cadastre-se</Link>
          </p>
        </form>
      </Card>
    </main>
  );
}

export function Cadastro() {
  const { cadastrar } = useAuth();
  const navigate = useNavigate();
  const f = useForm({
    nome: "",
    tipo_pessoa: "FISICA",
    cpf_cnpj: "",
    email: "",
    telefone: "",
    senha: "",
    confirmar: "",
    aceite_termos: false,
  });

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.validar(registerSchema)) return;
    if (f.values.senha !== f.values.confirmar) {
      f.setErrors({ confirmar: "As senhas não conferem" });
      return;
    }
    void f.enviar(async () => {
      const { confirmar: _c, ...dados } = f.dados();
      await cadastrar(dados);
      navigate("/app", { replace: true });
    });
  };

  const pf = f.values.tipo_pessoa === "FISICA";
  return (
    <main className="auth-page">
      <div className="auth-voltar">
        <BotaoVoltar />
      </div>
      <Card className="auth-card">
        <form className="stack" onSubmit={enviar} noValidate>
          <span className="orb" aria-hidden />
          <h1>Criar conta</h1>
          <p className="muted small">
            Você começa no plano BÁSICO e pode mudar para o BLACK quando quiser.
          </p>
          {f.erroGeral && <Alert tone="danger">{f.erroGeral}</Alert>}
          <Field label="Nome social / razão social" required error={f.errors.nome} htmlFor="nome">
            <input {...f.bind("nome")} autoComplete="organization" />
          </Field>
          <div className="row" role="radiogroup" aria-label="Tipo de pessoa">
            <label className="check">
              <input
                type="radio"
                checked={pf}
                onChange={() => {
                  f.set("tipo_pessoa", "FISICA");
                  f.set("cpf_cnpj", "");
                }}
              />{" "}
              Pessoa física
            </label>
            <label className="check">
              <input
                type="radio"
                checked={!pf}
                onChange={() => {
                  f.set("tipo_pessoa", "JURIDICA");
                  f.set("cpf_cnpj", "");
                }}
              />{" "}
              Pessoa jurídica (CNPJ / MEI)
            </label>
          </div>
          <Field label={pf ? "CPF" : "CNPJ"} required error={f.errors.cpf_cnpj} htmlFor="cpf_cnpj">
            <input
              {...f.bind("cpf_cnpj", pf ? "cpf" : "cnpj")}
              placeholder={pf ? "000.000.000-00" : "00.000.000/0000-00"}
            />
          </Field>
          <Field label="E-mail" required error={f.errors.email} htmlFor="email">
            <input {...f.bind("email", "email")} type="email" autoComplete="email" />
          </Field>
          <Field label="Telefone" required error={f.errors.telefone} htmlFor="telefone">
            <input
              {...f.bind("telefone", "telefone")}
              type="tel"
              autoComplete="tel"
              placeholder="(31) 99999-9999"
            />
          </Field>
          <Field
            label="Senha"
            required
            error={f.errors.senha}
            hint="Mínimo 8 caracteres, com letras e números."
            htmlFor="senha"
          >
            <input {...f.bind("senha")} type="password" autoComplete="new-password" />
          </Field>
          <Field label="Confirmar senha" required error={f.errors.confirmar} htmlFor="confirmar">
            <input {...f.bind("confirmar")} type="password" autoComplete="new-password" />
          </Field>
          <label className="check">
            <input
              type="checkbox"
              checked={f.values.aceite_termos}
              onChange={(e) => f.set("aceite_termos", e.target.checked)}
            />
            <span>
              Li e aceito os{" "}
              <Link to="/termos" target="_blank">
                termos de uso e a política de privacidade
              </Link>
            </span>
          </label>
          {f.errors.aceite_termos && (
            <span className="small" style={{ color: "var(--danger)" }}>
              {f.errors.aceite_termos}
            </span>
          )}
          <Button type="submit" loading={f.enviando}>
            Criar conta
          </Button>
          <p className="small muted" style={{ textAlign: "center" }}>
            Já tem conta? <Link to="/login">Entrar</Link>
          </p>
        </form>
      </Card>
    </main>
  );
}

export function EsqueciSenha() {
  const f = useForm({ email: "" });
  const [msg, setMsg] = useState("");
  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.validar(forgotPasswordSchema)) return;
    void f.enviar(async () => {
      const r = await api.post<{ message: string }>("/auth/esqueci-senha", f.dados());
      setMsg(r.message);
    });
  };
  return (
    <main className="auth-page">
      <div className="auth-voltar">
        <BotaoVoltar />
      </div>
      <Card className="auth-card">
        <form className="stack" onSubmit={enviar} noValidate>
          <span className="orb" aria-hidden />
          <h1>Recuperar senha</h1>
          <p className="muted small">
            Informe o e-mail da sua conta. Enviaremos um link válido por 1 hora.
          </p>
          {msg && <Alert tone="success">{msg}</Alert>}
          {f.erroGeral && <Alert tone="danger">{f.erroGeral}</Alert>}
          <Field label="E-mail" required error={f.errors.email} htmlFor="email">
            <input {...f.bind("email", "email")} type="email" autoComplete="email" />
          </Field>
          <Button type="submit" loading={f.enviando}>
            Enviar link
          </Button>
          <Link to="/login" className="small" style={{ textAlign: "center" }}>
            Voltar ao login
          </Link>
        </form>
      </Card>
    </main>
  );
}

export function RedefinirSenha() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const f = useForm({ senha: "", confirmar: "" });
  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordSchema.safeParse({ token, senha: f.values.senha }).success) {
      f.setErrors({ senha: "Mínimo 8 caracteres, com letras e números." });
      return;
    }
    if (f.values.senha !== f.values.confirmar) {
      f.setErrors({ confirmar: "As senhas não conferem" });
      return;
    }
    void f.enviar(async () => {
      await api.post("/auth/redefinir-senha", { token, senha: f.values.senha });
      navigate("/login?senha=ok", { replace: true });
    });
  };
  return (
    <main className="auth-page">
      <div className="auth-voltar">
        <BotaoVoltar />
      </div>
      <Card className="auth-card">
        <form className="stack" onSubmit={enviar} noValidate>
          <span className="orb" aria-hidden />
          <h1>Definir nova senha</h1>
          {!token && <Alert tone="danger">Link inválido. Solicite uma nova redefinição.</Alert>}
          {f.erroGeral && <Alert tone="danger">{f.erroGeral}</Alert>}
          <Field label="Nova senha" required error={f.errors.senha} htmlFor="senha">
            <input {...f.bind("senha")} type="password" autoComplete="new-password" />
          </Field>
          <Field
            label="Confirmar nova senha"
            required
            error={f.errors.confirmar}
            htmlFor="confirmar"
          >
            <input {...f.bind("confirmar")} type="password" autoComplete="new-password" />
          </Field>
          <Button type="submit" loading={f.enviando} disabled={!token}>
            Salvar nova senha
          </Button>
        </form>
      </Card>
    </main>
  );
}
