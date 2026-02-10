import "../config.css";
import { useNavigate } from "react-router-dom";
import icons from "../../../components/Icons";

export default function Financeiro() {
  const navigate = useNavigate();

  return (
    <main className="content configuracao">
      <section className='titulo-secao'>
        <h1><i className={icons.cash}></i> Financeiro</h1>
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
              <i className="bi bi-currency-dollar"></i>
              <div>
                <h3>Regime tributário</h3>
                <p>Defina o regime fiscal da empresa</p>
              </div>
            </div>
            <div className="menu-direita">
              <select className="select-config">
                <option>Simples Nacional</option>
                <option>Lucro Presumido</option>
                <option>Lucro Real</option>
              </select>
            </div>
          </div>

          <div className="config-item">
            <div className="menu-esquerda">
              <i className="bi bi-percent"></i>
              <div>
                <h3>Calcular impostos</h3>
                <p>Cálculo automático nos documentos</p>
              </div>
            </div>
            <div className="menu-direita">
              <select className="select-config">
                <option>Ativado</option>
                <option>Desativado</option>
              </select>
            </div>
          </div>

        </div>
      </section>

    </main>
  );
}
