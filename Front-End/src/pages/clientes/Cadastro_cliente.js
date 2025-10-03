import Layout from "../../components/Layout";
import icons from "../../components/Icons";
import { Link } from "react-router-dom";
import React, { useState } from "react";

function Cadastro_cliente() {
  return (
    <main className="content">
      <section className="titulo-secao">
        <h1>
          <i className={icons.clientesAdd}></i> Cadastro de um novo cliente
        </h1>
      </section>
      <div className="form-footer voltar">
        <Link to="/clientes" className="previous-step">
          Voltar <i className="bi bi-chevron-double-left"></i>
          <i className="bi bi-chevron-double-left"></i>
        </Link>
      </div>
      <section className="form-section">
        <p className="frase-campo-asterisco">
          Os campos que contêm um asterisco (
          <span className="campo-obrigatório">*</span>) são de preenchimento
          obrigatório.
        </p>
        <div className="section-header">
          <span className="icon">
            <i className={icons.relatorioAdd}></i>
          </span>
          <h3>Dados Pessoais</h3>
        </div>
        <hr className="divider" />
        <div className="form-row">
          <div className="form-group">
            <label>
              Nome Social <span className="campo-obrigatório">*</span>
            </label>
            <input
              type="text"
              placeholder="Digite o nome completo do cliente"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="label-radio">
              Selecione o tipo de Pessoa:{" "}
              <span className="campo-obrigatório">*</span>
            </label>
            <select defaultValue="">
              <option value="" disabled>
                Selecione o Tipo
              </option>
              <option value="PFisica">Pessoa Física</option>
              <option value="PJuridica">Pessoa Jurídica</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              CPF / CNPJ: <span className="campo-obrigatório">*</span>
            </label>
            <input type="text" placeholder="Informe o CPF/CNPJ do cliente" />
          </div>
        </div>
      </section>
      <section className="form-section">
        <div className="section-header">
          <span className="icon">
            <i className={icons.mapa}></i>
          </span>
          <h3>Endereço</h3>
        </div>
        <hr className="divider" />

        <div className="form-row">
          <div className="form-group">
            <label>
              CEP: <span className="campo-obrigatório">*</span>
            </label>
            <input type="text" placeholder="00-000.000" />
          </div>
          <div className="form-group">
            <label>
              UF: <span className="campo-obrigatório">*</span>
            </label>
            <input type="text" placeholder="Selecione" />
          </div>
          <div className="form-group">
            <label>
              Cidade: <span className="campo-obrigatório">*</span>
            </label>
            <input type="text" placeholder="Selecione" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>
              Logradouro: <span className="campo-obrigatório">*</span>
            </label>
            <input type="text" placeholder="Digite o nome da rua" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>
              Bairro: <span className="campo-obrigatório">*</span>
            </label>
            <input type="text" placeholder="Digite o nome do bairro" />
          </div>
          <div className="form-group">
            <label>
              Número: <span className="campo-obrigatório">*</span>
            </label>
            <input
              type="text"
              placeholder="Informe o número referente ao endereço"
            />
          </div>
          <div className="form-group">
            <label>Complemento:</label>
            <input
              type="text"
              placeholder="Informe o complemento referente ao endereço"
            />
          </div>
        </div>
      </section>
      <section className="section-form">
        <div className="section-header">
          <span className="icon">
            <i className={icons.feedbackTel}></i>
          </span>
          <h3>Contato</h3>
        </div>
        <hr className="divider" />

        <div className="form-row">
          <div className="form-group">
            <label>
              E-mail: <span className="campo-obrigatório">*</span>
            </label>
            <input type="text" placeholder="Informe o e-mail do cliente" />
          </div>
          <div className="form-group">
            <label>
              Telefone: <span className="campo-obrigatório">*</span>
            </label>
            <input
              type="text"
              placeholder="Informe o número de Telefone para ligações"
            />
          </div>
          <div className="form-group">
            <label>Whatssap:</label>
            <input
              type="text"
              placeholder="Informe o número de telefone de Whatssap"
            />
          </div>
        </div>
      </section>
      <div className="botao_geral">
        <button className="btn">Cadastrar </button>
      </div>
    </main>
  );
}

export default Cadastro_cliente;
