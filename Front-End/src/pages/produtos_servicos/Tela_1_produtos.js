import Layout from '../../components/Layout';
import React, { useState } from "react";
import { Link } from "react-router-dom";
import icons from "../../components/Icons";
import "./produtos.css";

function Tela_1_produtos() {
  
const listaCompleta = [
  { nome: "Limpeza Predial", categoria: "serviço", tipo: "Predial" },
  { nome: "Pregos 10mm", categoria: "produto", tipo: "Construção" },
  { nome: "Instalação de Ar-Condicionado", categoria: "serviço", tipo: "Climatização" },
  { nome: "Cabo de Rede CAT6", categoria: "produto", tipo: "Rede" },
  { nome: "Consultoria Financeira", categoria: "serviço", tipo: "Financeira" },
  { nome: "Serviço de Jardinagem", categoria: "serviço", tipo: "Jardinagem" },
  { nome: "Manutenção de Impressora", categoria: "serviço", tipo: "Informática" },
  { nome: "Serviço de Solda", categoria: "serviço", tipo: "Soldagem" },
  { nome: "Mangueira PVC 30m", categoria: "produto", tipo: "Hidráulica" },
  { nome: "Limpeza de Piscina", categoria: "serviço", tipo: "Piscinas" },
  { nome: "Suporte Técnico TI", categoria: "serviço", tipo: "TI" },
  { nome: "Cadeira Escritório Pro", categoria: "produto", tipo: "Mobília" },
  { nome: "Consultoria Contábil", categoria: "serviço", tipo: "Contábil" },
  { nome: "Câmera de Segurança HD", categoria: "produto", tipo: "Segurança" },
  { nome: "Monitor 27''", categoria: "produto", tipo: "Eletrônicos" },
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
    <main className="content">

      {/* TÍTULO */}
      <section className='titulo-secao'>
        <h1>
          <i className={icons.produtos}></i> Meus Produtos/Serviços
        </h1>
      </section>

      {/* CADASTRAR */}
      <section className="form-section">
        <div className="section-header">
          <span className="icon"><i className={icons.produtosAdd}></i></span>
          <h3>Cadastrar novo</h3>
        </div>

        <hr className="divider" />

        <div className="botao_geral">
          <Link to="/Produtos/cadastro">
            <button className="btn">Cadastrar</button>
          </Link>
        </div>
      </section>

      {/* LISTA */}
      <section className="form-section">

        {/* CABEÇALHO */}
        <div className="section-header">
          <span className="icon"><i className={icons.relatorio}></i></span>
          <h3>Meus Produtos/Serviços</h3>
        </div>

        <hr className="divider" />

        {/* ABAS */}
        <div className="abas-container">
          <button 
            className={abaAtual === "todos" ? "aba ativa" : "aba"}
            onClick={() => trocarAba("todos")}
          >
            Todos
          </button>

          <button 
            className={abaAtual === "produto" ? "aba ativa" : "aba"}
            onClick={() => trocarAba("produto")}
          >
            Produtos
          </button>

          <button 
            className={abaAtual === "serviço" ? "aba ativa" : "aba"}
            onClick={() => trocarAba("serviço")}
          >
            Serviços
          </button>
        </div>

        {/* PESQUISA */}
        <div className="form-row">
          <input
            type="text"
            value={pesquisa}
            onChange={handlePesquisa}
            placeholder="Pesquisar produto ou serviço"
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

export default Tela_1_produtos;
