// Configuracoes.jsx
import "./config.css";
import icons from "../../components/Icons";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function Configuracoes() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const nomeCompleto = user.social_name || "Usuário";
  const navigate = useNavigate();

  return (
    <main className="content configuracao">
      <section className='titulo-secao'>
        <h1><i className={icons.configuracao}></i> Configurações</h1>
      </section>    

 
        <div className="search-wrapper">
          <div className="search-bar">
          <input type="text" placeholder="Pesquisar configurações..."/>
          <i className="bi bi-search"></i>
          </div>
        </div>


      <section className="form-section">
        <div className="meus-dados-header">

        <div className="profile">
          <Link to="/MeusDados">
            <i className="bi bi-person-circle"></i>
          </Link>
        </div>
        <Link to="/MeusDados">
          <span className="user-name">{nomeCompleto}</span>
        </Link>
        </div>
      </section>

      <section className="form-section">
        <div className="config-options">
          <button className="config-item" onClick={() => navigate("/Seguranca")}>
            <div className="config-header">
              <i className="bi bi-display"></i>
              <h3>Geral</h3>
            </div>
            <p>Iniciar e Fechar</p>
          </button>
          <hr />
          <button className="config-item" onClick={() => navigate("/meusdados")}>
            <div className="config-header">
              <i className="bi bi-key"></i>
              <h3>Conta</h3>
            </div>
            <p>Dados da conta, Endereço Fiscal</p>
          </button>
          <hr />
          <button className="config-item" onClick={() => navigate("/pagamento")}>
            <div className="config-header">
              <i className={icons.planos}></i>
              <h3>Plano mensal</h3>
            </div>
            <p>Gerencie suas formas de pagamento</p>
          </button>
          <hr />
          <button className="config-item" onClick={() => navigate("/pagamento")}>
            <div className="config-header">
              <i className="bi bi-credit-card"></i>
              <h3>Pagamento</h3>
            </div>
            <p>Gerencie suas formas de pagamento</p>
          </button>
          <hr />
          <button className="config-item" onClick={() => navigate("/pagamento")}>
            <div className="config-header">
              <i className={icons.emitirNota}></i>
              <h3>Notas Fiscais</h3>
            </div>
            <p>Gerencie suas notas fiscais, integrações, número de série</p>
          </button>
          <hr />
          <button className="config-item" onClick={() => navigate("/notificacao")}>
            <div className="config-header">
              <i className="bi bi-bell"></i>
              <h3>Notificações</h3>
            </div>
            <p>Gerencie suas notificações, por onde serão exibidas</p>
          </button>
          <hr />
          <button className="config-item" onClick={() => navigate("/Seguranca")}>
            <div className="config-header">
              <i className="bi bi-shield-lock"></i>
              <h3>Segurança</h3>
            </div>
            <p>Gerencie suas senhas, autenticação de dois fatores e outras opções de segurança.</p>
          </button>
          <hr />
          <button className="config-item" onClick={() => navigate("/Seguranca")}>
            <div className="config-header">
              <i className="bi bi-palette"></i>
              <h3>Aparência</h3>
            </div>
            <p>Personalize a aparência do seu perfil</p>
          </button>
          <hr />
          <button className="config-item" onClick={() => navigate("/ajuda")}>
            <div className="config-header">
              <i className={icons.ajuda}></i>
              <h3>Ajuda e Feedback</h3>
            </div>
            <p>Obtenha ajuda sobre o funcionamento do sistema</p>
          </button>
          <hr />
          <button className="config-item" onClick={() => navigate("/sair")}>
            <div className="config-header">
              <i className={icons.sair}></i>
              <h3>Desconectar</h3>
            </div>
            <p>Faça Loggout, Saia da plataforma com segurança</p>
          </button>
          
        </div>
      </section >

      <hr />
    </main>
  );
}