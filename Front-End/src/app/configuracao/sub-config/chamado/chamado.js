import "../../config.css";
import icons from "../../../../components/Icons";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Chamado() {

  const navigate = useNavigate();

  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const [categoria, setCategoria] = useState("");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  /* ===== BLOQUEAR SCROLL QUANDO MODAL ABRIR ===== */
  useEffect(() => {
    document.body.style.overflow = modal ? "hidden" : "auto";
  }, [modal]);

  /* ================= CRIAR CHAMADO ================= */

  async function criarChamado() {

    if (!user) {
      setFeedback("Usuário não identificado.");
      return;
    }

    if (!categoria || !assunto || !mensagem) {
      setFeedback("Preencha todos os campos.");
      return;
    }

    setLoading(true);
    setFeedback("Abrindo chamado...");

    try {

      const res = await fetch(
        "https://project-finc.onrender.com/chamados",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoria,
            assunto,
            mensagem,
            user
          })
        }
      );

      if (!res.ok) throw new Error();

      const data = await res.json();

      setModal(false);

      setCategoria("");
      setAssunto("");
      setMensagem("");

      navigate(`/configuracao/chat/${data.id}`);

    } catch (err) {
      console.error(err);
      setFeedback("Erro ao abrir chamado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="content configuracao">

      <section className="titulo-secao">
        <h1>
          <i className={icons.suporte}></i> Suporte Técnico
        </h1>
      </section>

      {/* BUSCA */}
      <section className="form-section">
        <div className="search-bar">
          <input type="text" placeholder="Pesquisar configurações..." />
          <i className="bi bi-search"></i>
        </div>

        <hr />

        <div className="config-back">
          <button
            className="config-voltar"
            onClick={() => navigate("/configuracao/ajuda")}
          >
            <i className="bi bi-arrow-left"></i> Voltar
          </button>
        </div>
      </section>

      {/* CARDS */}
      <div className="config-options-2">

        {/* ===== ABRIR CHAMADO ===== */}
        <div className="config-item">

          <div className="menu-esquerda">
            <i className={icons.suporte}></i>

            <div>
              <h3>Abrir Chamado</h3>
              <p>Faça contato com nossa equipe para solucionar seu problema.</p>
            </div>
          </div>

          <div className="menu-direita">
            {!modal && (
              <button className="btn" onClick={() => setModal(true)}>
                Abrir Chamado
              </button>
            )}
          </div>

        </div>

        {/* ===== OUTROS CARDS ===== */}

        <div className="config-item">
          <div className="menu-esquerda">
            <i className="bi bi-info-circle-fill"></i>
            <div>
              <h3>Esqueceu sua senha?</h3>
              <p>Tente relembrar com nossa ajuda sua senha</p>
            </div>
          </div>

          <div className="menu-direita">
            <button className="btn btn-clicar">Enviar</button>
          </div>
        </div>

        <div className="config-item">
          <div className="menu-esquerda">
            <i className={icons.clientePerson}></i>
            <div>
              <h3>Recuperar sua conta</h3>
              <p>Perdeu acesso de uma conta antiga, faça sua solicitação!</p>
            </div>
          </div>

          <div className="menu-direita">
            <button className="btn btn-clicar">Enviar</button>
          </div>
        </div>

        <div className="config-item">
          <div className="menu-esquerda">
            <i className="bi bi-info-circle-fill"></i>
            <div>
              <h3>Relatar um problema</h3>
              <p>Informe um problema para melhorarmos sua experiência.</p>
            </div>
          </div>

          <div className="menu-direita">
            <button className="btn btn-clicar">Enviar</button>
          </div>
        </div>

      </div>

      {/* ================= MODAL ================= */}

      {modal && (
        <div className="modal-overlay">

          <div className="modal-container chamado-modal">

            <button
              className="modal-close"
              onClick={() => setModal(false)}
            >
              ✕
            </button>

            <h2>Novo Chamado</h2>

            <hr className="divider" />

            <div className="inputs">

              <div className="input-solo">
                <label>Categoria:</label>

                <select
                  value={categoria}
                  onChange={e => setCategoria(e.target.value)}
                >
                  <option value="">Selecione categoria</option>
                  <option>Emitir Nota</option>
                  <option>Cadastro</option>
                  <option>Financeiro</option>
                  <option>Contador</option>
                  <option>Outro</option>
                </select>
              </div>

              <div className="input-solo">
                <label>Assunto:</label>

                <input
                  maxLength={30}
                  value={assunto}
                  onChange={e => setAssunto(e.target.value)}
                  placeholder="Informe o assunto"
                />
              </div>

              <div className="input-solo">
                <label>Mensagem:</label>

                <textarea
                  value={mensagem}
                  onChange={e => setMensagem(e.target.value)}
                  placeholder="Descreva o problema com detalhes"
                />
              </div>

            </div>

            <div className="botao_geral modal-actions">

              <button
                className="btn"
                disabled={loading}
                onClick={criarChamado}
              >
                {loading && <span className="spinner"></span>}
                {loading ? "Abrindo..." : "Abrir Chamado"}
              </button>

              <button
                className="btn btn-cancelar"
                disabled={loading}
                onClick={() => setModal(false)}
              >
                Cancelar
              </button>

            </div>

            {feedback && <p className="feedback">{feedback}</p>}

          </div>
        </div>
      )}

    </main>
  );
}
