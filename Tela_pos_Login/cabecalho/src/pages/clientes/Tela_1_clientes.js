import Layout from '../../components/Layout';
import icons from "../../components/Icons";
import { Link } from 'react-router-dom';
import React, { useState } from "react";

function Tela_1_clientes() {

  const [clientes, setClientes] = useState([
    { nome: "Pedreira VMIX", tipo: "Insumos" },
    { nome: "Marmoraria PS", tipo: "Insumos" },
    { nome: "ProTransportes", tipo: "Logística" }
    // ...os dados reais virão do backend
  ]);

  return (
      <main className="content">
              <section className='titulo-secao'>
               <h1><i className={icons.clientes}></i> Meus Clientes</h1>
             </section>
        <section className="form-section">
          <div className="section-header">
            <span className="icon"><i className={icons.clientesAdd}></i></span>
            <h3>Cadastrar um novo Cliente</h3>
          </div>
          <hr className="divider"/>
          <div className="botao_geral">
            <Link to="/clientes/cadastro" >
              <button class="btn">Cadastrar </button>
            </Link>
          </div>
        </section>

        <section className="form-section">
          <div className="section-header">
            <span className="icon"><i className={icons.relatorio}></i></span>
            <h3>Meus Clientes</h3>
          </div>
          <hr className="divider" />
          <div className="form-row">
            <input type="text" placeholder="Pesquisar cliente..." />
          </div>
          <div className="cards">
            {clientes.map((cliente, idx) => (
              <React.Fragment key={idx}>
                <hr className="divider" />
                <h4>{cliente.nome}</h4>
                <p>{cliente.tipo}</p>
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

export default Tela_1_clientes;