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
  const handleSubmit = (e) => {
    e.preventDefault();

    if (usuario.trim() === "" || senha.trim() === "") {
      alert("Preencha todos os campos!");
      return;
    }

    if (usuario === "admin" && senha === "1234") {
      alert("Login realizado com sucesso!");
      navigate("/app");
    } else {
      alert("Usuário ou senha inválidos!");
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
              <input
                type="text"
                placeholder="admin"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
              />
            </div>

            <div className="input-box">
              <input
                type={mostrarSenha ? "text" : "password"}
                placeholder="1234"
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
