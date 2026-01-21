import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import icons from "../../components/Icons";
import "./produtos.css";
import axios from "axios";

function Tela_1_produtos() {
  const [itens, setItens] = useState([]); // Lista unificada
  const [pesquisa, setPesquisa] = useState("");
  const [abaAtual, setAbaAtual] = useState("todos");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const navigate = useNavigate();

  const itensPorPagina = 5;

  const buscarDados = async () => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // Busca simultânea de Produtos e Serviços
      const [resProd, resServ] = await Promise.all([
        axios.get("https://project-finc.onrender.com/produtos", { headers }),
        axios.get("https://project-finc.onrender.com/servicos", { headers })
      ]);

      const produtos = resProd.data.map(p => ({ ...p, tipo: "produto" }));
      const servicos = resServ.data.map(s => ({ ...s, tipo: "serviço" }));

      setItens([...produtos, ...servicos]);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  };

  useEffect(() => {
    buscarDados();
  }, []);

  // FILTROS
  const filtrados = itens.filter(item => {
    const correspondeAba = abaAtual === "todos" || item.tipo === abaAtual;
    const correspondePesquisa = (item.nome || item.name || "").toLowerCase().includes(pesquisa.toLowerCase());
    return correspondeAba && correspondePesquisa;
  });

  // PAGINAÇÃO
  const totalPaginas = Math.ceil(filtrados.length / itensPorPagina);
  const itensExibidos = filtrados.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina);

  const excluirItem = async (id, tipo) => {
    if (!window.confirm(`Deseja excluir este ${tipo}?`)) return;
    try {
      const token = localStorage.getItem("token");
      const rota = tipo === "produto" ? "produtos" : "servicos";
      await axios.delete(`https://project-finc.onrender.com/${rota}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Excluído com sucesso!");
      buscarDados();
    } catch (error) {
      alert("Erro ao excluir item.");
    }
  };

  return (
    <main className="content">
      <section className='titulo-secao'>
        <h1><i className={icons.produtos}></i> Meus Produtos/Serviços</h1>
      </section>

      <section className="form-section">
        <div className="section-header">
          <span className="icon"><i className={icons.produtosAdd}></i></span>
          <h3>Cadastrar novo</h3>
        </div>
        <hr className="divider" />
        <div className="botao_geral">
          <Link to="/produtos/cadastro"><button className="btn">Cadastrar</button></Link>
          <Link to="/produtos/cadastro/planilha"><button className="btn">Importar Planilha</button></Link>
        </div>
      </section>

      <section className="form-section">
        <div className="abas-container">
          {["todos", "produto", "serviço"].map(aba => (
            <button key={aba} className={abaAtual === aba ? "aba ativa" : "aba"} onClick={() => {setAbaAtual(aba); setPaginaAtual(1);}}>
              {aba.charAt(0).toUpperCase() + aba.slice(1)}s
            </button>
          ))}
        </div>

        <div className="form-row">
          <input type="text" value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} placeholder="Pesquisar por nome..." />
        </div>

        <div className="cards animar-lista">
          {itensExibidos.map((item) => (
            <div key={`${item.tipo}-${item.id}`} className="card-cliente animar-card">
              <div onClick={() => navigate(`/${item.tipo}s/editar/${item.id}`)} style={{cursor:'pointer'}}>
                <h4>{item.nome || item.name}</h4>
                <small>SKU: {item.sku || 'N/A'}</small>
              </div>
              <div className="editar-acao">
                <div className="editar-cliente-item" onClick={() => navigate(`/${item.tipo}s/editar/${item.id}`)}>
                  <i className={icons.edit}></i>
                  <p>Editar</p>
                </div>
                <div className="excluir-cliente-item" onClick={() => excluirItem(item.id, item.tipo)}>
                  <i className="bi bi-trash"></i>
                  <p>Excluir</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalPaginas > 1 && (
          <div className="paginacao">
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
              <button key={num} className={num === paginaAtual ? "pagina ativa" : "pagina"} onClick={() => setPaginaAtual(num)}>{num}</button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
export default Tela_1_produtos;