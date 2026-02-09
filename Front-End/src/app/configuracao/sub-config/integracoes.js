import "../config.css";
import { useNavigate } from "react-router-dom";

export default function Integracoes() {
  const navigate = useNavigate();
  return (
    <main className="content configuracao">
      <section className="form-section">
        <h2 className="config-subtitulo">Integrações</h2>
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
            >
              <i className="bi bi-arrow-left"></i> Voltar
            </button>
          </div>
        </section>

        <div className="config-options-2">
          <div className="config-item">
            <div className="menu-esquerda">
              <i className="bi bi-shield-check"></i>
              <div>
                <h3>SEFAZ</h3>
                <p>Status da comunicação com a SEFAZ</p>
              </div>
            </div>
            <div className="menu-direita">
              <select className="select-config">
                <option>Ativa</option>
                <option>Inativa</option>
              </select>
            </div>
          </div>

          <div className="config-item">
            <div className="menu-esquerda">
              <i className="bi bi-file-earmark-lock"></i>
              <div>
                <h3>Certificado Digital</h3>
                <p>Configuração do certificado A1</p>
              </div>
            </div>
            <div className="menu-direita">
              <select className="select-config">
                <option>Configurado</option>
                <option>Não configurado</option>
              </select>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
