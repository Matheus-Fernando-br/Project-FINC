import React, { useState } from "react";
import { Link } from 'react-router-dom';
import icons from "../../components/Icons";
import "./cliente.css";

function Tela_1_clientes() {

  const listaCompleta = [
    { nome: "Pedreira VMIX", tipo: "Insumos", categoria: "PJ" },
    { nome: "Marmoraria PS", tipo: "Insumos", categoria: "PJ" },
    { nome: "ProTransportes", tipo: "Logística", categoria: "PJ" },
    { nome: "Gabriel Torres", tipo: "Autônomo", categoria: "PF" },
    { nome: "Construtec Brasil", tipo: "Construção", categoria: "PJ" },
    { nome: "Alpha Motors", tipo: "Automotivo", categoria: "PJ" },
    { nome: "MegaLimp Service", tipo: "Serviços Gerais", categoria: "PJ" },
    { nome: "Bruna Oliveira", tipo: "Consumidor", categoria: "PF" },
    { nome: "SoftCode TI", tipo: "Tecnologia", categoria: "PJ" },
    { nome: "Doces da Serra", tipo: "Alimentos", categoria: "PJ" },
    { nome: "EcoVerde", tipo: "Ambiental", categoria: "PJ" },
    { nome: "HidroVale", tipo: "Hidráulica", categoria: "PJ" },
    { nome: "SolarMax", tipo: "Energia", categoria: "PJ" },
    { nome: "Prime Seguros", tipo: "Seguros", categoria: "PJ" },
    { nome: "Felipe Andrade", tipo: "Autônomo", categoria: "PF" }
  ];

  const [pesquisa, setPesquisa] = useState("");
  const [abaAtual, setAbaAtual] = useState("todos");
  const [paginaAtual, setPaginaAtual] = useState(1);

  const itensPorPagina = 5;

  // FILTRO DE ABA
  const filtradosPorAba = listaCompleta.filter(item =>
    abaAtual === "todos" ? true : item.categoria === abaAtual
  );

  // APLICAR PESQUISA
  const filtrados = filtradosPorAba.filter(item =>
    item.nome.toLowerCase().includes(pesquisa.toLowerCase())
  );

  // PAGINAÇÃO
  const totalPaginas = Math.ceil(filtrados.length / itensPorPagina);

  const itensExibidos = filtrados.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  // HANDLERS
  const handlePesquisa = (e) => {
    setPesquisa(e.target.value);
    setPaginaAtual(1);
  };

  const limparPesquisa = () => {
    setPesquisa("");
    setPaginaAtual(1);
  };

  const trocarAba = (novaAba) => {
    setAbaAtual(novaAba);
    setPaginaAtual(1);
  };

  return (
    <main className="content fade-in">

      <section className='titulo-secao'>
        <h1><i className={icons.clientes}></i> Meus Clientes</h1>
      </section>

      {/* CADASTRAR */}
      <section className="form-section fade-in">
        <div className="section-header">
          <span className="icon"><i className={icons.clientesAdd}></i></span>
          <h3>Cadastrar um novo Cliente</h3>
        </div>
        <hr className="divider"/>
        <div className="botao_geral">
          <Link to="/clientes/cadastro">
            <button className="btn">Cadastrar</button>
          </Link>
          <Link to="/import/clientes">
            <button className="btn">Importar de uma Planilha</button>
          </Link>
        </div>
      </section>

      {/* LISTA DE CLIENTES */}
      <section className="form-section fade-in">

        <div className="section-header">
          <span className="icon"><i className={icons.relatorio}></i></span>
          <h3>Meus Clientes</h3>
        </div>
        <hr className="divider"/>

         {/* ABAS */}
        <div className="abas-container">
          <button 
            className={abaAtual === "todos" ? "aba ativa" : "aba"}
            onClick={() => trocarAba("todos")}
          >
            Todos
          </button>

          <button 
            className={abaAtual === "PJ" ? "aba ativa" : "aba"}
            onClick={() => trocarAba("PJ")}
          >
            Pessoa Jurídica
          </button>

          <button 
            className={abaAtual === "PF" ? "aba ativa" : "aba"}
            onClick={() => trocarAba("PF")}
          >
            Pessoa Física
          </button>
        </div>

        {/* PESQUISA */}
        <div className="form-row">
          <input
            type="text"
            value={pesquisa}
            onChange={handlePesquisa}
            placeholder="Pesquisar cliente..."
          />
        
        {pesquisa !== "" && (
            <button onClick={limparPesquisa} className="btn-limpar">
              Limpar
            </button>
          )}
        </div>

        {/* CARDS */}
        <div className="cards animar-lista">
          {itensExibidos.map((item, idx) => (
            <React.Fragment key={idx}>
              <hr className="divider" />

              <div className="card-cliente animar-card">
                <div>
                  <h4>{item.nome}</h4>
                  <p>{item.tipo.toUpperCase()}</p>
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

        {/* PAGINAÇÃO */}
        <div className="paginacao">
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
            <button
              key={num}
              className={num === paginaAtual ? "pagina ativa" : "pagina"}
              onClick={() => setPaginaAtual(num)}
            >
              {num}
            </button>
          ))}
        </div>

        {/* QUANDO NÃO ENCONTRA */}
        {filtrados.length === 0 && (
          <p className="nenhum">Nenhum item encontrado.</p>
        )}
      </section>
    </main>
  );
}

export default Tela_1_clientes;
