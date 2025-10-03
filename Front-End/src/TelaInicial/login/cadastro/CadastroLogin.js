import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/Cadastro.css";

function CadastroLogin() {
  const navigate = useNavigate();

  // Array local (só para simular antes de enviar ao backend)
  const [usuarios, setUsuarios] = useState([]);

  // Estado dos campos
  const [formData, setFormData] = useState({
    cpf: "",
    socialName: "",
    email: "",
    telefone: "",
    ramoTrabalho: "",
    localTrabalho: "",
    termos: false,
  });

  // Atualiza os campos dinamicamente
  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  // Validações antes de enviar
  const validarFormulario = () => {
    const {
      cpf,
      socialName,
      email,
      telefone,
      ramoTrabalho,
      localTrabalho,
      termos,
    } = formData;

    if (
      !cpf ||
      !socialName ||
      !email ||
      !telefone ||
      !ramoTrabalho ||
      !localTrabalho
    ) {
      alert("Preencha todos os campos!");
      return false;
    }

    // Confere se CPF tem só números e 11 dígitos
    const cpfRegex = /^[0-9]{11}$/;
    if (!cpfRegex.test(cpf)) {
      alert("O CPF deve conter apenas números e ter 11 dígitos.");
      return false;
    }

    if (!termos) {
      alert("Você precisa aceitar os Termos e Serviços.");
      return false;
    }

    return true;
  };

  // Enviar ao backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      // Atualiza o array local
      setUsuarios((prev) => [...prev, formData]);

      // Envia ao backend (Spring Boot em localhost:8080)
      const response = await fetch(
        "https://rolf-aquarial-nontelegraphically.ngrok-free.dev/finc/criaUsuario",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        alert("Conta criada com sucesso!");
        navigate("/TelaInicial/Login");
      } else {
        alert("Erro ao criar conta no servidor.");
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
      alert("Falha de conexão com o servidor.");
    }
  };

  return (
    <section className="CadastroLogin">
      <div className="Fundo">
        <img src="/Images/Fundo-Login-teste.png" alt="Fundo" />
      </div>

      {/* Botão Voltar */}
      <div className="rodape form-footer voltar">
        <Link to="/TelaInicial/Login">
          Voltar para Tela de Login{" "}
          <i className="bi bi-chevron-double-left"></i>
          <i className="bi bi-chevron-double-left"></i>
        </Link>
      </div>

      <div className="wrapper">
        <form id="loginForm" onSubmit={handleSubmit}>
          <h1>CRIE SUA CONTA</h1>

          <section className="formulario">
            <div className="input-box">
              <input
                type="text"
                id="cpf"
                value={formData.cpf}
                onChange={handleChange}
                placeholder="CPF (somente números)"
              />
              <i className="bi bi-person"></i>
            </div>
            <div className="input-box">
              <input
                type="text"
                id="socialName"
                value={formData.socialName}
                onChange={handleChange}
                placeholder="Nome Social"
              />
              <i className="bi bi-person-badge"></i>
            </div>
            <div className="input-box">
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="E-mail"
              />
              <i className="bi bi-envelope"></i>
            </div>
            <div className="input-box">
              <input
                type="text"
                id="telefone"
                value={formData.telefone}
                onChange={handleChange}
                placeholder="Número de telefone"
              />
              <i className="bi bi-telephone"></i>
            </div>
            <div className="input-box">
              <input
                type="text"
                id="ramoTrabalho"
                value={formData.ramoTrabalho}
                onChange={handleChange}
                placeholder="Ramo de trabalho"
              />
              <i className="bi bi-houses"></i>
            </div>
            <div className="input-box">
              <input
                type="text"
                id="localTrabalho"
                value={formData.localTrabalho}
                onChange={handleChange}
                placeholder="Local de trabalho"
              />
              <i className="bi bi-cursor"></i>
            </div>
          </section>

          <div className="acept">
            <label>
              <input
                type="checkbox"
                id="termos"
                checked={formData.termos}
                onChange={handleChange}
              />{" "}
              Aceito os Termos e Serviços
            </label>
          </div>

          <hr className="divider" />
          <button type="submit" className="btn">
            Criar Conta
          </button>
        </form>
      </div>
    </section>
  );
}

export default CadastroLogin;
