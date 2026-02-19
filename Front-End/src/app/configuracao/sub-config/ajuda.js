import "../config.css";
import icons from "../../../components/Icons";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function AjudaFeedback() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const [abrirStatus, setAbrirStatus] = useState(false);
  const [statusSistema, setStatusSistema] = useState(null);
  const [checandoStatus, setChecandoStatus] = useState(false);

  async function verificarStatusSistema() {
    setAbrirStatus(true);
    setChecandoStatus(true);

    const resultado = {
      frontend: true,
      backend: false,
      banco: false,
      internet: navigator.onLine,
    };

    try {
      const response = await fetch(
        "https://project-finc.onrender.com/"
      );

      if (response.ok) {
        resultado.backend = true;
        resultado.banco = true; // assume que se backend respondeu, banco também
      }
    } catch (error) {
      console.error("Erro ao verificar backend:", error);
    }

    setStatusSistema(resultado);
    setChecandoStatus(false);
  }


  async function enviarFeedbackSistema() {
    if (!feedback.trim()) {
      alert("Digite uma mensagem");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://project-finc.onrender.com/feedback",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mensagem: feedback,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Erro no servidor");
      }

      alert("Feedback enviado!");
      setFeedback("");
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar feedback. Verifique o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="content configuracao ajudafeed">
      <section className="titulo-secao">
        <h1>
          <i className={icons.ajuda}></i> Ajuda e Feedback
        </h1>
      </section>
      <section className="form-section">
        <section className="form-section">
          <div className="search-bar">
            <input type="text" placeholder="Pesquisar configurações..." />
            <i className="bi bi-search"></i>
          </div>
          <hr />
          <div className="config-back">
            <button
              className="config-voltar"
              onClick={() => navigate("/configuracao")}
              disabled={loading}
            >
              <i className="bi bi-arrow-left"></i> Voltar
            </button>
          </div>
        </section>

        <div className="config-options-2">
          {/* Central de ajuda */}
          <div className="config-item documentacao">
            <div className="menu-esquerda">
              <i className={icons.relatorio}></i>
              <div>
                <h3>Documentação</h3>
                <p>Acesse a documentação do sistema e todos seus detalhes</p>
              </div>
            </div>

            <div className="menu-direita">
              <button
                className="btn"
                onClick={() =>
                  window.open(
                    "https://docs.google.com/document/d/1LvHCiI3aFqa4oMXx1HV6ZG6sc_cHrqM-/edit",
                    "_blank",
                  )
                }
                disabled={loading}
              >
                Abrir Documentação
              </button>
            </div>
          </div>

          {/* Abrir chamado */}
          <div className="config-item">
            <div className="menu-esquerda">
              <i className={icons.suporte}></i>
              <div>
                <h3>Suporte técnico</h3>
                <p>Abra um chamado com nossa equipe</p>
              </div>
            </div>

            <div className="menu-direita">
              <button
                className="btn"
                onClick={() => navigate("/configuracao/chamado")}
                disabled={loading}
              >
                Solicitar suporte
              </button>
            </div>
          </div>

          {/* Contato */}
          <div className="config-item">
            <div className="menu-esquerda">
              <i className="bi bi-info-circle-fill"></i>
              <div>
                <h3>Tutorial do sistema</h3>
                <p>
                  Acesse o tutorial do sistema para aprender onde fica cada
                  funcionalidade
                </p>
              </div>
            </div>

            <div className="menu-direita">
              <a href="https://youtu.be/l5bRmxChJC8" target="_blank" rel="noreferrer">
                <button className="btn" disabled={loading}>
                  Assistir
                </button>
              </a>
            </div>
          </div>

          {/* Status sistema */}
          <div className="config-item">
            <div className="menu-esquerda">
              <i className="bi bi-activity"></i>
              <div>
                <h3>Status do sistema</h3>
                <p>Verifique disponibilidade dos serviços</p>
              </div>
            </div>

            <div className="menu-direita">
              <button
                className="btn"
                onClick={verificarStatusSistema}
                disabled={loading || checandoStatus}
              >
                {checandoStatus && <span className="spinner"></span>}
                {checandoStatus ? "" : "Ver status"}
              </button>
            </div>
          </div>

          {abrirStatus && (
            <div className="dropdown-status">
              {checandoStatus && <p>Checando serviços...</p>}

              {statusSistema && !checandoStatus && (
                <>
                  <p>
                    Frontend: {statusSistema.frontend ? "✅ Online" : "❌ Offline"}
                  </p>
                  <p>
                    Backend: {statusSistema.backend ? "✅ Online" : "❌ Offline"}
                  </p>
                  <p>
                    Banco de Dados: {statusSistema.banco ? "✅ Online" : "❌ Offline"}
                  </p>
                  <p>
                    Internet: {statusSistema.internet ? "✅ Conectado" : "❌ Sem conexão"}
                  </p>
                </>
              )}
            </div>
          )}


          {/* Feedback */}
          <div className="config-item">
            <div className="menu-esquerda">
              <i className={icons.feedback}></i>
              <div>
                <h3>Enviar feedback</h3>
                <p>Conte para nós como podemos melhorar</p>
              </div>
            </div>

            <div className="menu-direita feedback">
              <input
                className="select-config"
                type="text"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Digite seu feedback..."
                disabled={loading}
              />

              <button
                className="btn"
                onClick={enviarFeedbackSistema}
                disabled={loading}
              >
                {loading && <span className="spinner"></span>}
                {loading ? "" : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
