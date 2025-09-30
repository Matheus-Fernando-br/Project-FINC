import React from "react";
import { Link } from "react-router-dom";
import "../../styles/Cadastro.css";

function CadastroLogin() {
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
        <form id="loginForm">
          <h1>CRIE SUA CONTA</h1>

          <section className="formulario">
            <div className="input-box">
              <input type="text" id="usuario" placeholder="CPF/CNPJ" />
              <i className="bi bi-person"></i>
            </div>
            <div className="input-box">
              <input type="text" id="usuario" placeholder="Nome Social" />
              <i className="bi bi-person-badge"></i>
            </div>
            <div className="input-box">
              <input type="text" id="usuario" placeholder="E-mail" />
              <i className="bi bi-envelope"></i>
            </div>
            <div className="input-box">
              <input type="text" id="usuario" placeholder="Número de telefone" />
              <i className="bi bi-telephone"></i>
            </div>
            <div className="input-box">
              <input type="text" id="usuario" placeholder="Ramo de trabalho" />
              <i className="bi bi-houses"></i>
            </div>
            <div className="input-box">
              <input type="text" id="usuario" placeholder="Local de trabalho" />
              <i className="bi bi-cursor"></i>
            </div>
          </section>

          <div className="acept">
            <label>
              <input type="checkbox" /> Aceito os Termos e Serviços
            </label>
          </div>

          <hr className="divider" />
          <Link to="/TelaInicial/Login">
            <button type="button" className="btn">
              Criar Conta
            </button>
          </Link>
        </form>
      </div>
    </section>
  );
}

export default CadastroLogin;
