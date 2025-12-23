import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Login.css";

function Login() {
  const navigate = useNavigate();

  // Estados controlados
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Função de login
  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch("http://localhost:3001/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login: usuario.replace(/\D/g, ""),
        senha
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error);
      return;
    }

    alert("Login realizado com sucesso!");
    navigate("/app");

  } catch (err) {
    alert("Erro de conexão");
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
              />
            </div>

            <div className="input-box">
              <div className="label">Senha: </div>
              <input
                type={mostrarSenha ? "text" : "password"}
                placeholder="Informe sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
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
              <a href="#">Esqueceu a senha?</a>
            </div>

            <div className="Interação">
            <button type="submit" className="btn">
              Entrar
            </button>

            <div className="divider">
              <p>ou</p>
            </div>

            <Link to="/TelaInicial/Login/Cadastro">
              <button type="button" className="btn2">
                Criar Conta
              </button>
            </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

export default Login;
