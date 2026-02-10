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

    const [fuso, setFuso] = useState("America/Sao_Paulo");

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
                    <select className="select-config" value={fuso} onChange={(e) => setFuso(e.target.value)}>
                        <option value="Pacific/Midway">(UTC-11:00) Midway</option>
                        <option value="Pacific/Honolulu">(UTC-10:00) Havaí</option>
                        <option value="America/Anchorage">(UTC-09:00) Alasca</option>
                        <option value="America/Los_Angeles">(UTC-08:00) Los Angeles</option>
                        <option value="America/Denver">(UTC-07:00) Denver</option>
                        <option value="America/Chicago">(UTC-06:00) Chicago</option>
                        <option value="America/New_York">(UTC-05:00) Nova York</option>
                        <option value="America/Caracas">(UTC-04:00) Caracas</option>
                        <option value="America/Santiago">(UTC-04:00) Santiago</option>
                        <option value="America/Sao_Paulo" >(UTC-03:00) Brasília</option>
                        <option value="America/Argentina/Buenos_Aires">(UTC-03:00) Buenos Aires</option>
                        <option value="Atlantic/South_Georgia">(UTC-02:00) Ilhas Geórgia do Sul</option>
                        <option value="Atlantic/Azores">(UTC-01:00) Açores</option>
                        <option value="UTC">(UTC+00:00) UTC / Londres</option>
                        <option value="Europe/Berlin">(UTC+01:00) Berlim</option>
                        <option value="Europe/Paris">(UTC+01:00) Paris</option>
                        <option value="Europe/Athens">(UTC+02:00) Atenas</option>
                        <option value="Africa/Cairo">(UTC+02:00) Cairo</option>
                        <option value="Europe/Moscow">(UTC+03:00) Moscou</option>
                        <option value="Asia/Dubai">(UTC+04:00) Dubai</option>
                        <option value="Asia/Karachi">(UTC+05:00) Karachi</option>
                        <option value="Asia/Dhaka">(UTC+06:00) Bangladesh</option>
                        <option value="Asia/Bangkok">(UTC+07:00) Bangkok</option>
                        <option value="Asia/Shanghai">(UTC+08:00) Pequim</option>
                        <option value="Asia/Tokyo">(UTC+09:00) Tóquio</option>
                        <option value="Australia/Sydney">(UTC+10:00) Sydney</option>
                        <option value="Pacific/Noumea">(UTC+11:00) Nova Caledônia</option>
                        <option value="Pacific/Auckland">(UTC+12:00) Auckland</option>
                        <option value="Pacific/Tongatapu">(UTC+13:00) Tonga</option>
                        <option value="Pacific/Kiritimati">(UTC+14:00) Ilha Kiritimati</option>
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