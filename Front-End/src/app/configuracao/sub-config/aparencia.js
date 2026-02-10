import "../config.css";
import { useNavigate } from "react-router-dom";
import { applyTheme, applyFontSize, applyBold } from "../../../utils/scripts";
import icons from "../../../components/Icons";

export default function Aparencia() {
    const navigate = useNavigate();
  
  return (
    <main className="content configuracao">
      <section className='titulo-secao'>
        <h1><i className={icons.aparencia}></i> Aparência</h1>
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

          <div className="config-item">
            <div className="menu-esquerda">
              <i className="bi bi-palette"></i>
              <div>
                <h3>Tema</h3>
                <p>Escolha o tema do sistema</p>
              </div>
            </div>
            <div className="menu-direita">
            <select
              className="select-config"
              defaultValue={localStorage.getItem("theme") || "auto"}
              onChange={(e) => applyTheme(e.target.value)}
            >
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
              <option value="auto">Automático</option>
            </select>
            </div>
          </div>
          <div className="config-item">
            <div className="menu-esquerda">
              <i className="bi bi-fonts"></i>
              <div>
                <h3>Fonte</h3>
                <p>Altere o tamanho da fonte do sistema</p>
              </div>
            </div>
            <div className="menu-direita">
            <select
              className="select-config"
              defaultValue={localStorage.getItem("fontSize") || "100"}
              onChange={(e) => applyFontSize(e.target.value)}
            >
              <option value="90">Pequena</option>
              <option value="100">Normal</option>
              <option value="110">Grande</option>
              <option value="120">Extra Grande</option>
            </select>
            </div>
          </div>
          <div className="config-item">
            <div className="menu-esquerda">
              <i className="bi bi-type-bold"></i>
              <div>
                <h3>Negrito</h3>
                <p>Deixe o texto do sistema em negrito para melhor vizualização</p>
              </div>
            </div>
            <div className="menu-direita">
            <select
              className="select-config"
              defaultValue={localStorage.getItem("bold") || "false"}
              onChange={(e) => applyBold(e.target.value)}
            >
              <option value="false">Desativado</option>
              <option value="true">Ativado</option>
            </select>
            </div>
          </div>

        </div>
      </section>

    </main>
  );
}
