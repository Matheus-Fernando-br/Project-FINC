// Configuracoes.jsx
import "../config.css";
import icons from "../../../components/Icons";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Configuracoes() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);

  const cancelarAlteracoes = () => {
    if (!window.confirm("Deseja cancelar todas as alterações?")) return;
    setLoadingCancel(true);
    setFeedback("Operação cancelada!");
    setTimeout(() => {
      setLoadingCancel(false);
      window.location.reload();
    }, 1000);
  };

async function handleSubmit() {
  setFeedback("");

  setLoading(true);
  setFeedback("Salvando alterações...");

  // Simula requisição
  await new Promise(resolve => setTimeout(resolve, 2500));

  setLoading(false);
  setFeedback("Configurações salvas com sucesso!");

  setTimeout(() => {
    navigate("/configuracao");
  }, 2000);
}


  return (
    <main className="content configuracao">
        <section className='titulo-secao'>
            <h1><i className={icons.configuracao}></i> Configurações Gerais</h1>
        </section>    

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


        <section className="form-section">
            <div className="config-options-2">

            {/* Idioma */}
            <div className="config-item-row">
                <div className="menu-esquerda">
                <i className="bi bi-globe"></i>
                <div>
                    <h3>Idioma</h3>
                    <p>Defina o idioma do sistema</p>
                </div>
                </div>

                <div className="menu-direita">
                <select className="select-config">
                    <option>Português (Brasil)</option>
                    <option>Inglês</option>
                    <option>Espanhol</option>
                </select>
                </div>
            </div>

            {/* Fuso horário */}
            <div className="config-item-row">
                <div className="menu-esquerda">
                <i className="bi bi-clock"></i>
                <div>
                    <h3>Fuso horário</h3>
                    <p>Define o horário padrão do sistema</p>
                </div>
                </div>

                <div className="menu-direita">
                <select className="select-config">
                    <option>(UTC-03:00) Brasília</option>
                    <option>(UTC-04:00) Manaus</option>
                    <option>(UTC-05:00) Acre</option>
                </select>
                </div>
            </div>

            {/* Formato de data */}
            <div className="config-item-row">
                <div className="menu-esquerda">
                <i className="bi bi-calendar-event"></i>
                <div>
                    <h3>Formato de data</h3>
                    <p>Como as datas serão exibidas</p>
                </div>
                </div>

                <div className="menu-direita">
                <select className="select-config">
                    <option>DD/MM/AAAA</option>
                    <option>MM/DD/AAAA</option>
                    <option>AAAA-MM-DD</option>
                </select>
                </div>
            </div>

            {/* Moeda padrão */}
            <div className="config-item-row">
                <div className="menu-esquerda">
                <i className="bi bi-currency-exchange"></i>
                <div>
                    <h3>Moeda padrão</h3>
                    <p>Utilizada em relatórios e notas fiscais</p>
                </div>
                </div>

                <div className="menu-direita">
                <select className="select-config">
                    <option>Real (BRL)</option>
                    <option>Dólar (USD)</option>
                    <option>Euro (EUR)</option>
                </select>
                </div>
            </div>

            {/* Página inicial */}
            <div className="config-item-row">
                <div className="menu-esquerda">
                <i className="bi bi-house"></i>
                <div>
                    <h3>Página inicial</h3>
                    <p>Tela exibida ao entrar no sistema</p>
                </div>
                </div>

                <div className="menu-direita">
                <select className="select-config">
                    <option>Dashboard</option>
                    <option>Notas Fiscais</option>
                    <option>Financeiro</option>
                    <option>Configurações</option>
                </select>
                </div>
            </div>

            {/* Modo compacto */}
            <div className="config-item-row">
                <div className="menu-esquerda">
                <i className="bi bi-arrows-collapse"></i>
                <div>
                    <h3>Modo compacto</h3>
                    <p>Reduz espaçamentos e tamanho dos elementos</p>
                </div>
                </div>

                <div className="menu-direita">
                <select className="select-config">
                    <option>Desativado</option>
                    <option>Ativado</option>
                </select>
                </div>
            </div>

            </div>

        </section >
        {feedback && <p className="feedback">{feedback}</p>}
        <div className="botao_geral">
            <button className="btn btn-cancelar" onClick={cancelarAlteracoes} disabled={loading}> 
            {loadingCancel && <span className="spinner"></span>}
            {loadingCancel ? "" : "Cancelar Alterações"}
            </button>

            <button className="btn" onClick={handleSubmit} disabled={loading}>
            {loading && <span className="spinner"></span>}
            {loading ? "" : "Salvar Alterações"}
            </button>
      </div>

      <hr />
    </main>
  );
}