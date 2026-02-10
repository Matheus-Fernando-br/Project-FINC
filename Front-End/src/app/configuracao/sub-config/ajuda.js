import "../config.css";
import icons from "../../../components/Icons";
import { useNavigate } from "react-router-dom";

export default function AjudaFeedback() {
    const navigate = useNavigate();

  return (
    <main className="content configuracao">
      <section className='titulo-secao'>
        <h1><i className={icons.ajuda}></i> Ajuda e Feedback</h1>
      </section>  
      <section className="form-section">
         <section className="form-section">
            <div className="search-bar">
            <input type="text" placeholder="Pesquisar configurações..."/>
            <i className="bi bi-search"></i>
            </div>
            <hr />
            <div className="config-back">
                <button className="config-voltar" onClick={() => navigate("/configuracao")}>
                    <i className="bi bi-arrow-left"></i> Voltar
                </button>
            </div>
        </section>

        <div className="config-options-2">

          {/* Central de ajuda */}
          <div className="config-item">
            <div className="menu-esquerda">
              <i className={icons.relatorio}></i>
              <div>
                <h3>Central de ajuda</h3>
                <p>Acesse tutoriais e documentação do sistema</p>
              </div>
            </div>

            <div className="menu-direita">
              <button className="btn" onClick={() => window.open("https://docs.google.com/document/d/1LvHCiI3aFqa4oMXx1HV6ZG6sc_cHrqM-/edit", "_blank")}>
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
              <button className="btn" onClick={() => navigate("/configuracao/ajuda/suporte")}>
                Solicitar suporte
              </button>
            </div>
          </div>

          {/* Feedback */}
          <div className="config-item">
            <div className="menu-esquerda">
              <i className={icons.feedback}></i>
              <div>
                <h3>Enviar feedback</h3>
                <p>Conte para nós como podemos melhorar</p>
              </div>
            </div>

            <div className="menu-direita">
              <button className="select-config">
                Enviar
              </button>
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
              <button className="select-config">
                Ver status
              </button>
            </div>
          </div>

          {/* Contato */}
          <div className="config-item">
            <div className="menu-esquerda">
              <i className="bi bi-envelope"></i>
              <div>
                <h3>Contato direto</h3>
                <p>Entre em contato via email ou WhatsApp</p>
              </div>
            </div>

            <div className="menu-direita">
              <button className="select-config">
                Contatar
              </button>
            </div>
          </div>

        </div>
      </section>

    </main>
  );
}
