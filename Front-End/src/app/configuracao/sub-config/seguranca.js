import "../config.css";
import { useNavigate } from "react-router-dom";

export default function Seguranca() {
  const navigate = useNavigate();
  return (
    <main className="content configuracao">
      <section className="form-section">
        <h2 className="config-subtitulo">Segurança</h2>
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
              <i className="bi bi-key"></i>
              <div>
                <h3>Alterar senha</h3>
                <p>Atualize sua senha de acesso</p>
              </div>
            </div>
            <div className="menu-direita">
              <button className="select-config">Alterar</button>
            </div>
          </div>

          <div className="config-item">
            <div className="menu-esquerda">
              <i className="bi bi-shield-lock"></i>
              <div>
                <h3>Autenticação em 2 fatores</h3>
                <p>Segurança adicional na conta</p>
              </div>
            </div>
            <div className="menu-direita">
              <select className="select-config">
                <option>Ativada</option>
                <option>Desativada</option>
              </select>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
