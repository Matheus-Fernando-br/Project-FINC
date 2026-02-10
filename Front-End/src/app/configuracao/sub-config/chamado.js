import "../config.css";
import { useNavigate } from "react-router-dom";
import icons from "../../../components/Icons";

export default function AjudaFeedback() {
    const navigate = useNavigate();

  return (
    <main className="content configuracao">
        <section className='titulo-secao'>
            <h1><i className={icons.suporte}></i> Central de Ajuda e Suporte</h1>
        </section>  
      <section className="form-section">
         <section className="form-section">
            <div className="search-bar">
            <input type="text" placeholder="Pesquisar configurações..."/>
            <i className="bi bi-search"></i>
            </div>
            <hr />
            <div className="config-back">
                <button className="config-voltar" onClick={() => navigate("/configuracao/ajuda")}>
                    <i className="bi bi-arrow-left"></i> Voltar
                </button>
            </div>
        </section>

        <div className="config-options-2">

          {/* Central de ajuda */}
          <div className="config-item">
            <div className="menu-esquerda">
              <i className="bi bi-book"></i>
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
        </div>
        </section>
    </main>
   )
}
