import Layout from '../../components/Layout';
import icons from "../../components/Icons";
import { Link } from 'react-router-dom';
import React, { useState } from "react";

function Tela_1_produtos() {

  const [servicos, setServicos] = useState([
    { nome: "Bater um concreto", tipo: "Construção" },
    { nome: "Camisinha PP", tipo: "Gabriel" },
    { nome: "Tijolo", tipo: "Evandro MG" }
    // ...os dados reais virão do backend
  ]);

  return (
      <main className="content">
        <section className='titulo-secao'>
          <h1><i className={icons.produtos}></i> Meus Produtos/Serviços</h1>
        </section>
        <section className="form-section">
          <div className="section-header">
            <span className="icon"><i className={icons.produtosAdd}></i></span>
            <h3>Cadastrar um novo Produto/Serviço</h3>
          </div>
          <hr className="divider"/>
          <div className="botao_geral">
            <Link to="/Produtos/cadastro" >
              <button class="btn">Cadastrar </button>
            </Link>
          </div>
        </section>

        <section className="form-section">
          <div className="section-header">
            <span className="icon"><i className={icons.relatorio}></i></span>
            <h3>Meus Produtos/Serviços</h3>
          </div>
          <hr className="divider" />
          <div className="form-row">
            <input type="text" placeholder="Pesquisar produto/serviço..." />
          </div>
          <div className="cards">
            {servicos.map((servicos, idx) => (
              <React.Fragment key={idx}>
                <hr className="divider" />
                <div className='card-cliente'>
                  <div>
                    <h4>{servicos.nome}</h4>
                    <p>{servicos.tipo}</p>
                  </div>
                  <div className="editar-acao">
                    <i className={icons.edit}></i>
                    <p>Editar</p>
                  </div>
                </div>
              </React.Fragment>
            ))}
            <hr className="divider" />
          </div>
          
          <div className="form-footer">
            <Link to="#" >
              <a>Veja mais</a>
              <div>
                <i className="bi bi-chevron-double-down"></i>
              </div>
            </Link>
          </div>
        </section>
      </main>
  );
}

export default Tela_1_produtos;