import { useEffect, useState } from "react";
import icons from "../../components/Icons";
import { apiFetch } from "../../utils/api";
import "./contador.css";

const estadoInicial = {
  nome: "",
  email: "",
  cpf: "",
  telefone: "",
};

function Tela_1_Contador() {
  const [loading, setLoading] = useState(true);
  const [loadingCriar, setLoadingCriar] = useState(false);
  const [loadingSalvar, setLoadingSalvar] = useState(false);
  const [contadores, setContadores] = useState([]);
  const [mostrarCriacao, setMostrarCriacao] = useState(false);
  const [contadorEditando, setContadorEditando] = useState(null);
  const [dropdownAberto, setDropdownAberto] = useState(null);
  const [form, setForm] = useState(estadoInicial);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    buscarContadores();
  }, []);

  async function buscarContadores() {
    try {
      setLoading(true);
      setFeedback("");

      const resposta = await apiFetch("/contadores");
      setContadores(Array.isArray(resposta) ? resposta : []);
    } catch (error) {
      console.error(error);
      setFeedback(error.message || "Erro ao carregar contadores.");
      setContadores([]);
    } finally {
      setLoading(false);
    }
  }

  function abrirCriacao() {
    setContadorEditando(null);
    setForm(estadoInicial);
    setMostrarCriacao(true);
    setDropdownAberto(null);
  }

  function abrirEdicao(contador) {
    setContadorEditando(contador.id);
    setForm({
      nome: contador.nome || "",
      email: contador.email || "",
      cpf: contador.cpf || "",
      telefone: contador.telefone || "",
    });
    setMostrarCriacao(true);
    setDropdownAberto(null);
  }

  function fecharFormulario() {
    setMostrarCriacao(false);
    setContadorEditando(null);
    setForm(estadoInicial);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function salvarContador() {
    try {
      setLoadingSalvar(true);
      setFeedback("");

      if (!form.nome.trim() || !form.email.trim()) {
        setFeedback("Nome e e-mail são obrigatórios.");
        return;
      }

      if (contadorEditando) {
        const atualizado = await apiFetch(`/contadores/${contadorEditando}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });

        setContadores((prev) =>
          prev.map((item) => (item.id === contadorEditando ? atualizado : item))
        );

        setFeedback("Contador atualizado com sucesso.");
      } else {
        const novo = await apiFetch("/contadores", {
          method: "POST",
          body: JSON.stringify(form),
        });

        setContadores((prev) => [novo, ...prev]);
        setFeedback("Contador criado com sucesso.");
      }

      fecharFormulario();
    } catch (error) {
      console.error(error);
      setFeedback(error.message || "Erro ao salvar contador.");
    } finally {
      setLoadingSalvar(false);
      setLoadingCriar(false);
    }
  }

  async function excluirContador(id) {
    try {
      const confirmar = window.confirm("Deseja realmente excluir este contador?");
      if (!confirmar) return;

      await apiFetch(`/contadores/${id}`, {
        method: "DELETE",
      });

      setContadores((prev) => prev.filter((item) => item.id !== id));
      setFeedback("Contador excluído com sucesso.");
      setDropdownAberto(null);
    } catch (error) {
      console.error(error);
      setFeedback(error.message || "Erro ao excluir contador.");
    }
  }

  return (
    <main className="content TelaContador">
      <section className="titulo-secao">
        <h1>
          <i className={icons.clientePerson}></i> Área do Contador
        </h1>
      </section>

      {loading && (
        <div className="loading-box" style={{ maxWidth: 520, margin: "12px auto" }}>
          <span className="spinner"></span>
          <div className="loading-text">
            <h3>Carregando contadores...</h3>
            <p>Aguarde um instante 👇</p>
          </div>
        </div>
      )}

      {!loading && feedback && <div className="feedback-box">{feedback}</div>}

      {!loading && contadores.length > 0 && (
        <section className="form-section">
          <div className="section-header contador-header">
            <span className="icon">
              <i className={icons.clientePerson}></i>
            </span>
            <h3>Contadores cadastrados</h3>
          </div>

          <hr className="divider" />

          <div className="cards-contadores">
            {contadores.map((contador) => (
              <div className="contador-card" key={contador.id}>
                <div className="contador-card-topo">
                  <div>
                    <h4>{contador.nome}</h4>
                    <p>{contador.email}</p>
                  </div>

                  <div className="dropdown-wrapper">
                    <button
                      className="btn-menu"
                      onClick={() =>
                        setDropdownAberto(dropdownAberto === contador.id ? null : contador.id)
                      }
                    >
                      ⋮
                    </button>

                    {dropdownAberto === contador.id && (
                      <div className="dropdown-card">
                        <button onClick={() => abrirEdicao(contador)}>
                          Editar contador
                        </button>
                        <button
                          className="btn-excluir"
                          onClick={() => excluirContador(contador.id)}
                        >
                          Excluir perfil
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="contador-detalhes">
                  <p><strong>CPF:</strong> {contador.cpf || "Não informado"}</p>
                  <p><strong>Telefone:</strong> {contador.telefone || "Não informado"}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="botao_geral" style={{ marginTop: "16px" }}>
            <button className="btn" onClick={abrirCriacao}>
              Novo contador
            </button>
          </div>
        </section>
      )}

      {!loading && contadores.length === 0 && (
        <div className="botao_geral">
          <button
            className="btn"
            onClick={() => {
              setLoadingCriar(true);
              setTimeout(() => {
                setLoadingCriar(false);
                abrirCriacao();
              }, 400);
            }}
          >
            {loadingCriar && <span className="spinner"></span>}
            {loadingCriar ? "" : "Criar Contador"}
          </button>
        </div>
      )}

      {!loading && mostrarCriacao && (
        <section className="form-section">
          <div className="section-header">
            <span className="icon">
              <i className={icons.clientePerson}></i>
            </span>
            <h3>{contadorEditando ? "Editar Contador" : "Criar Contador"}</h3>
          </div>

          <hr className="divider" />

          <div className="form-row">
            <div className="form-group">
              <label>Nome do Contador:</label>
              <input
                type="text"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                placeholder="Informe o nome completo do contador"
              />
            </div>

            <div className="form-group">
              <label>E-mail:</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Informe o e-mail profissional"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>CPF:</label>
              <input
                type="text"
                name="cpf"
                value={form.cpf}
                onChange={handleChange}
                placeholder="Informe o CPF do contador"
              />
            </div>

            <div className="form-group">
              <label>Telefone:</label>
              <input
                type="text"
                name="telefone"
                value={form.telefone}
                onChange={handleChange}
                placeholder="Informe o telefone do contador"
              />
            </div>
          </div>

          <div className="acoes-form">
            <button type="button" className="btn btn-secundario" onClick={fecharFormulario}>
              Cancelar
            </button>

            <button
              type="button"
              className="btn"
              onClick={salvarContador}
              disabled={loadingSalvar}
            >
              {loadingSalvar && <span className="spinner"></span>}
              {loadingSalvar
                ? ""
                : contadorEditando
                ? "Salvar Alterações"
                : "Salvar Contador"}
            </button>
          </div>
        </section>
      )}

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

export default Tela_1_Contador;