import "../config.css";
import { useNavigate } from "react-router-dom";

export default function Aparencia() {
    const navigate = useNavigate();
  return (
    <main className="content configuracao">

      <section className="form-section">
        <h2 className="config-subtitulo">Aparência</h2>
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

          <div className="config-item">
            <div className="menu-esquerda">
              <i className="bi bi-palette"></i>
              <div>
                <h3>Tema</h3>
                <p>Escolha o tema do sistema</p>
              </div>
            </div>
            <div className="menu-direita">
              <select className="select-config">
                <option>Claro</option>
                <option>Escuro</option>
                <option>Automático</option>
              </select>
            </div>
          </div>

        </div>
      </section>

    </main>
  );
}
