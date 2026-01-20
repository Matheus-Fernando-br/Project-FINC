import icons from "../../components/Icons";
import { Link, useNavigate } from 'react-router-dom';
import React, { useState } from "react";
import "./produtos.css";

function Cadastro_produtos() {
  const [tipo, setTipo] = useState("");
  const navigate = useNavigate();

  const redirecionar = () => {
    if (!tipo) {
      alert("Por favor, escolha uma opção!");
      return;
    }

    if (tipo === "produto") {
      navigate("/produtos/cadastro/produto"); // vai pra rota já registrada
    } else if (tipo === "servico") {
      navigate("/produtos/cadastro/servico"); // vai pra rota já registrada
    }
  };

  return (
      <main className="content">
        <section className='titulo-secao'>
          <h1><i className={icons.produtosAdd}></i> Cadastro de um novo Produto/Serviço</h1>
        </section>
        <div className="form-footer-voltar">
          <Link to="/produtos" className="previous-step">
            Voltar <i className="bi bi-chevron-double-left"></i>
            <i className="bi bi-chevron-double-left"></i>
          </Link>
        </div>

        <section className="form-section">
          <div className="section-header">
            <span className="icon"><i className={icons.relatorioAdd}></i></span>
            <h3>Cadastrar novo Produto/Serviço</h3>
          </div>
          <hr />

          <div className="escolha form group radio-group">
            <label className='label-radio'>Escolha um tipo:</label><br />

            <div className="radio-option">
              <input
                type="radio"
                id="produto"
                name="tipo"
                value="produto"
                checked={tipo === "produto"}
                onChange={(e) => setTipo(e.target.value)}
              />
              <label htmlFor="produto">Produto (NF-e/ NFC-e)</label>
            </div>

            <div className="radio-option">
              <input
                type="radio"
                id="servico"
                name="tipo"
                value="servico"
                checked={tipo === "servico"}
                onChange={(e) => setTipo(e.target.value)}
              />
              <label htmlFor="servico">Serviço (NFS-e)</label>
            </div>
          </div>

          <div className="botao_geral">
            <button className="btn" onClick={redirecionar}>Próximo</button>
          </div>
        </section>
      </main>
  );
}

export default Cadastro_produtos;
