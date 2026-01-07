import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import icons from "../../components/Icons";
import "./cliente.css";

function Tela_1_clientes() {
  const [clientes, setClientes] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [abaAtual, setAbaAtual] = useState("todos");
  const [paginaAtual, setPaginaAtual] = useState(1);

  const itensPorPagina = 5;
  const [listaCompleta, setListaCompleta] = useState([]);


  /* ===============================
     BUSCAR CLIENTES DO BACK-END
  =============================== */
  useEffect(() => {
    async function buscarClientes() {
        const token = localStorage.getItem("token");

        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/clientes`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          console.error("Erro ao buscar clientes");
          return;
        }

        const data = await response.json();

      // Dentro do useEffect buscarClientes:
        const formatados = data.map(c => ({
          id: c.id, // Não esqueça do ID para deletar/editar
          nome: c.social_name, // Use o nome vindo do banco
          categoria: c.tipo_pessoa === "PJuridica" ? "PJ" : "PF"
        }));
        setClientes(formatados); // Use setClientes e não setListaCompleta para a exibição inicial
      }

      buscarClientes();
    }, []);


  /* ===============================
     FILTROS
  =============================== */
  const filtradosPorAba = clientes.filter((item) =>
    abaAtual === "todos" ? true : item.categoria === abaAtual
  );

  const filtrados = filtradosPorAba.filter((item) =>
    item.nome.toLowerCase().includes(pesquisa.toLowerCase())
  );

  const totalPaginas = Math.ceil(filtrados.length / itensPorPagina);

  const itensExibidos = filtrados.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  /* ===============================
     HANDLERS
  =============================== */
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

  const excluirCliente = async (id) => {
    if (!window.confirm("Deseja realmente excluir este cliente?")) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `https://project-finc.onrender.com/clientes/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao excluir cliente");
      }


      setClientes(clientes.filter((c) => c.id !== id));
      alert("Cliente excluído com sucesso!");
      
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Erro ao excluir cliente");
    }
  };

  return (
    <main className="content fade-in">
      <section className="titulo-secao">
        <h1>
          <i className={icons.clientes}></i> Meus Clientes
        </h1>
      </section>

      {/* CADASTRAR */}
      <section className="form-section fade-in">
        <div className="section-header">
          <span className="icon">
            <i className={icons.clientesAdd}></i>
          </span>
          <h3>Cadastrar um novo Cliente</h3>
        </div>
        <hr className="divider" />
        <div className="botao_geral">
          <Link to="/clientes/cadastro">
            <button className="btn">Cadastrar</button>
          </Link>
          <Link to="/import/clientes">
            <button className="btn btn-importSheet">
              Importar de uma Planilha
            </button>
          </Link>
        </div>
      </section>

      {/* LISTA */}
      <section className="form-section fade-in">
        <div className="section-header">
          <span className="icon">
            <i className={icons.relatorio}></i>
          </span>
          <h3>Meus Clientes</h3>
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
          {itensExibidos.map((item) => (
            <React.Fragment key={item.id}>
              <hr className="divider" />

              <div className="card-cliente animar-card">
                <div>
                  <h4>{item.nome}</h4>
                  <p>{item.categoria}</p>
                </div>

                <div className="editar-acao">
                  <i
                    className={icons.edit}
                    onClick={() => excluirCliente(item.id)}
                  ></i>
                  <p>Excluir</p>
                </div>
              </div>
            </React.Fragment>
          ))}

          <hr className="divider" />
        </div>

        {/* PAGINAÇÃO */}
        <div className="paginacao">
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              className={num === paginaAtual ? "pagina ativa" : "pagina"}
              onClick={() => setPaginaAtual(num)}
            >
              {num}
            </button>
          ))}
        </div>

        {filtrados.length === 0 && (
          <p className="nenhum">Nenhum item encontrado.</p>
        )}
      </section>
    </main>
  );
}

export default Tela_1_clientes;
