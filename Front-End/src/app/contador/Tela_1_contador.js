import icons from "../..//components/Icons";
import './contador.css'
import { useState } from 'react';

function Tela_1_feedback() {

  return (
      <main className="content TelaContador">

      {/* HEADER */}
      <section className="titulo-secao">
        <h1><i className={icons.clientePerson}></i> Área do Contador</h1>
      </section>

      {/* SECTION: CRIAR CONTADOR */}
      <section className="form-section">
        <div className="section-header">
          <span className="icon"><i className={icons.clientePerson}></i></span>
          <h3>Criar Contador</h3>
        </div>

        <hr className="divider" />

        <div className="form-row">
          <div className="form-group">
            <label>Nome do Contador: </label>
            <input type="text" placeholder="Informe o nome completo do contador" />
          </div>

          <div className="form-group">
            <label>E-mail: </label>
            <input type="email" placeholder="Informe o e-mail profissional" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>CPF / CNPJ: </label>
            <input type="text" placeholder="Informe o CPF ou CNPJ" />
          </div>
          <div className="form-group">
            <label>Telefone: </label>
            <input type="text" placeholder="Informe o telefone do contador" />
          </div>
        </div>

        <div className="botao_geral">
          <button className="btn">Criar Contador</button>
        </div>
      </section>

      {/* SECTION: PERMISSÕES */}
      <section className="form-section">
        <div className="section-header">
          <span className="icon"><i className={icons.feedback}></i></span>
          <h3>Gerenciar Permissões & Acessos</h3>
        </div>

        <hr className="divider" />

        <div className="permissoes-container">

          <div className="card-permissao">
            <h4>Acesso às Notas Fiscais</h4>
            <p>Permite visualizar, emitir e editar documentos fiscais.</p>
            <button className="btn2">Configurar</button>
          </div>

          <div className="card-permissao">
            <h4>Acesso ao Financeiro</h4>
            <p>Controle de cobranças, impostos e movimentações.</p>
            <button className="btn2">Configurar</button>
          </div>

          <div className="card-permissao">
            <h4>Acesso aos Clientes</h4>
            <p>Gerenciar dados cadastrais de empresas clientes.</p>
            <button className="btn2">Configurar</button>
          </div>

        </div>
      </section>
    </main>
  );
} 

export default Tela_1_feedback;