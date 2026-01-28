import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/telaInicial.css";

function Login() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback("");

    if (!usuario || !senha) {
      setFeedback("Informe usuário e senha.");
      return;
    }

    setLoading(true);
    setFeedback("Entrando...");

    try {
      const response = await fetch(
        "https://project-finc.onrender.com/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            login: usuario.trim(),
            senha
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setFeedback(data.error || "Erro no login");
        return;
      }

      if (!data.session?.access_token) {
        setFeedback("Token não retornado pelo servidor");
        return;
      }

      localStorage.setItem("token", data.session.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("user_name", data.user.social_name);

      navigate("/app");

    } catch (err) {
      console.error("Erro no login:", err);
      setFeedback("Erro de conexão com o servidor");
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
                onChange={(e) => setUsuario(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="input-box">
              <div className="label">Senha: </div>
              <input
                type={mostrarSenha ? "text" : "password"}
                placeholder="Informe sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={loading}
              />
              <i
                className={`bi ${mostrarSenha ? "bi-eye-slash" : "bi-eye"}`}
                onClick={() => setMostrarSenha(!mostrarSenha)}
              ></i>
            </div>

            <div className="remember-forgot">
              <label>
                <input type="checkbox" /> Lembrar-me
              </label>
              <p>Esqueceu a senha?</p>
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
                  state: { direction: "right" }
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