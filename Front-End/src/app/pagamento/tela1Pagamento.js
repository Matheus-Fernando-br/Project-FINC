import { Link } from "react-router-dom";
import icons from "../../components/Icons";
import React from "react";
import "./Pagamento.css";

function Pagamento() {
  return (
    <div className="content">
      <section className='titulo-secao'>
        <h1><i className={icons.pagamento}></i> Pagamento</h1>
      </section>        
      <div className="pagamento-container">
        {/* Cartão atual */}
        <div className="cartao-atual">
          <h3>Cartão de crédito atual</h3>
          <div className="cartao-visual">
            <div className="cartao-header">Cartão PJ</div>
            <div className="cartao-numero">*** 123-456-7890</div>
            <div className="cartao-footer">Fev 2025</div>
          </div>
        </div>

        {/* Selecionar novo cartão */}
        <div className="novo-cartao">
          <h3>Selecionar novo cartão para pagamento</h3>
          <label>
            <input type="checkbox" /> (nº do cartão)
          </label>
          <label>
            <input type="checkbox" /> (nº do cartão)
          </label>
          <label>
            <input type="checkbox" /> (nº do cartão)
          </label>
        </div>
      </div>

      {/* Cadastrar novo cartão */}
      <div className="cadastro-cartao">
          <h3>Cadastrar novo cartão de crédito</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Titular do cartão </label>
                <input type="text" placeholder="Informe o nome completo do titular" />
            </div>
            <div className="form-group">
              <label>Número do cartão </label>
                <input type="text" placeholder="Informe o número do cartão" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Validade </label>
                <input type="text" placeholder="MM/AA" />
            </div>
            <div className="form-group">
              <label>Agência </label>
                <input type="text" placeholder="Informe a agência" />
            </div>
            <div className="form-group">
              <label>Código de segurança </label>
                <input type="text" placeholder="CVV" />
            </div>
          </div>
          <div className="botao_geral">
          <button className="btn-cadastrar">Cadastrar Cartão</button>
          </div>
      </div>


      </div>
  );
}

export default Pagamento;
