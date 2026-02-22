import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/telaInicial.css";
import { apiFetch } from "../../utils/api.js";

function Login() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrarMe, setLembrarMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  // ✅ carrega preferências
  useEffect(() => {
    const savedUser = localStorage.getItem("remember_user_login");
    const savedRemember = localStorage.getItem("remember_me") === "1";
    if (savedUser) setUsuario(savedUser);
    setLembrarMe(savedRemember);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback("");

    if (!usuario || !senha) {
      setFeedback("Informe usuário e senha!");
      return;
    }

    setLoading(true);
    setFeedback("Entrando...");

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          login: usuario.trim(),
          senha,
        }),
      });

      if (!data.session?.access_token) {
        setFeedback("Token não retornado pelo servidor");
        return;
      }

      // ✅ lembrar usuário (somente o login)
      if (lembrarMe) {
        localStorage.setItem("remember_me", "1");
        localStorage.setItem("remember_user_login", usuario.trim());
      } else {
        localStorage.removeItem("remember_me");
        localStorage.removeItem("remember_user_login");
      }

      // ✅ onde salvar o token
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");

      const storage = lembrarMe ? localStorage : sessionStorage;
      storage.setItem("token", data.session.access_token);

      // user pode ficar no localStorage mesmo
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("user_name", data.user.social_name || "");

      navigate("/app");
    } catch (err) {
      console.error("Erro no login:", err);
      setFeedback(err.message || "Erro de conexão com o servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <section className="Login">
        <div className="Fundo">
          <img src="/Images/Fundo-Login-teste.png" alt="Fundo" />
        </div>

        <div className="rodape form-footer voltar">
          <Link to="/">
            Voltar para Tela Inicial{" "}
            <i className="bi bi-chevron-double-left"></i>
            <i className="bi bi-chevron-double-left"></i>
          </Link>
        </div>

        <div className="wrapper">
          <form onSubmit={handleSubmit}>
            <h1>Login</h1>

            <div className="input-box">
              <div className="label">Usuário: </div>
              <input
                type="text"
                placeholder="E-mail ou CPF"
                value={usuario}
                onChange={(e) => {setUsuario(e.target.value); setFeedback("");}}
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div className="input-box">
              <div className="label">Senha: </div>
              <input
                type={mostrarSenha ? "text" : "password"}
                placeholder="Informe sua senha"
                value={senha}
                onChange={(e) => {setSenha(e.target.value); setFeedback("");}}
                disabled={loading}
                autoComplete="current-password"
              />
              <i
                className={`bi ${mostrarSenha ? "bi-eye-slash" : "bi-eye"}`}
                onClick={() => setMostrarSenha(!mostrarSenha)}
              ></i>
            </div>

            <div className="remember-forgot">
              <label>
                <input
                  type="checkbox"
                  checked={lembrarMe}
                  onChange={(e) => setLembrarMe(e.target.checked)}
                  disabled={loading}
                />{" "}
                Lembrar-me
              </label>

              {/* ✅ vira link */}
              <Link to="/TelaInicial/Login/EsqueciSenha">
                Esqueceu a senha?
              </Link>
            </div>

            <div className="Interação">
              <button type="submit" className="btn" disabled={loading}>
                {loading && <span className="spinner"></span>}
                {loading ? "" : "Entrar"}
              </button>

              {feedback && <p className="feedback">{feedback}</p>}

              <div className="divider">
                <p>ou</p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/TelaInicial/Login/Cadastro", {
                    state: { direction: "right" },
                  })
                }
              >
                Criar Conta
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

export default Login;
