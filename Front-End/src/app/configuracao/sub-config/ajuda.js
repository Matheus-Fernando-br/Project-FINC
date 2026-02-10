import "../config.css";
import icons from "../../../components/Icons";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function AjudaFeedback() {
    const navigate = useNavigate();
    const [feedback, setFeedback] = useState("");

    async function enviarFeedbackSistema() {

      if (!feedback.trim()) {
        alert("Digite uma mensagem");
        return;
      }

      await fetch("https://project-finc.onrender.com/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mensagem: feedback,
          
        })
      });

      alert("Feedback enviado!");
      setFeedback("");
    }

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
                <h3>Documentação</h3>
                <p>Acesse a documentação do sistema e todos seus detalhes</p>
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
              <i class="bi bi-info-circle-fill"></i>
              <div>
                <h3>Tutorial do sistema</h3>
                <p>Acesse o tutorial do sistema para aprender onde fica cada funcionalidade</p>
              </div>
            </div>

            <div className="menu-direita">
              <button className="select-config">
                Contatar
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

            <div className="menu-direita feedback">
            <input
              className="select-config"
              type="text"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Digite seu feedback..."
            />

            <button
              className="btn"
              onClick={enviarFeedbackSistema}
            >
              Enviar
            </button>

            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
