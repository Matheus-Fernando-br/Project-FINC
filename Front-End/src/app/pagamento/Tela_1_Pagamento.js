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
          <h3>cartão de crédito atual</h3>
          <div className="cartao-visual">
            <div className="cartao-header">Cartão PJ</div>
            <div className="cartao-numero">*** 123-456-7890</div>
            <div className="cartao-footer">Fev 2025</div>
          </div>
        </div>

        {/* Selecionar novo cartão */}
        <div className="novo-cartao">
          <h3>selecionar novo cartão para pagamento</h3>
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
        <h3>cadastrar novo cartão de crédito</h3>
        <form>
          <input type="text" placeholder="Titular" />
          <input type="text" placeholder="nº do cartão" />
          <input type="text" placeholder="validade" />
          <input type="text" placeholder="agência" />
          <input type="text" placeholder="cód." />
        </form>
      </div>
    </div>
  );
}

export default Pagamento;
