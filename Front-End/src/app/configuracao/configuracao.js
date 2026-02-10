// Configuracoes.jsx
import "./config.css";
import icons from "../../components/Icons";
import { useNavigate } from "react-router-dom";

export default function ConfiguracoesGeral() {
  const navigate = useNavigate();

  return (
    <main className="content configuracao">
      <section className='titulo-secao'>
        <h1><i className={icons.configuracao}></i> Configurações</h1>
      </section>    

      <section className="form-section">
        <div className="search-bar">
        <input type="text" placeholder="Pesquisar configurações..."/>
        <i className="bi bi-search"></i>
        </div>
         <hr />
      </section>


      <section className="form-section">
        <div className="config-options">
          <button className="config-item" onClick={() => navigate("/Configuracao/geral")}>
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
              <h3>Conta / Empresa</h3>
            </div>
            <p>Dados da conta, Endereço Fiscal</p>
          </button>
          <hr />
          <button className="config-item" onClick={() => navigate("/configuracao/notas")}>
            <div className="config-header">
              <i className={icons.emitirNota}></i>
              <h3>Notas Fiscais</h3>
            </div>
            <p>Gerencie suas notas fiscais, número de série</p>
          </button>
          <hr />
          <button className="config-item" onClick={() => navigate("/configuracao/financeiro")}>
            <div className="config-header">
              <i className={icons.cash}></i>
              <h3>Financeiro</h3>
            </div>
            <p>Relatórios, Tributações e Impostos</p>
          </button>
          <hr />
          <button className="config-item" onClick={() => navigate("/configuracao/integracoes")}>
            <div className="config-header">
              <i className={icons.planos}></i>
              <h3>Integrações</h3>
            </div>
            <p>Integrações SEFAZ, Certificado Digital</p>
          </button>
          <hr />
          <button className="config-item" onClick={() => navigate("/configuracao/seguranca")}>
            <div className="config-header">
              <i className={icons.seguranca}></i>
              <h3>Segurança</h3>
            </div>
            <p>Gerencie suas senhas, autenticação de dois fatores e outras opções de segurança.</p>
          </button>
          <hr />
          <button className="config-item" onClick={() => navigate("/configuracao/pagamento")}>
            <div className="config-header">
              <i className={icons.cartao}></i>
              <h3>Pagamento</h3>
            </div>
            <p>Gerencie suas formas de pagamento</p>
          </button>
          <hr />
          <button className="config-item" onClick={() => navigate("/notificacao")}>
            <div className="config-header">
              <i className={icons.notificacoes}></i>
              <h3>Notificações</h3>
            </div>
            <p>Gerencie suas notificações, por onde serão exibidas</p>
          </button>
          <hr />
          <button className="config-item" onClick={() => navigate("/configuracao/aparencia")}>
            <div className="config-header">
              <i className={icons.aparencia}></i>
              <h3>Aparência</h3>
            </div>
            <p>Personalize a aparência do seu perfil</p>
          </button>
          <hr />
          <button className="config-item" onClick={() => navigate("/configuracao/ajuda")}>
            <div className="config-header">
              <i className={icons.ajuda}></i>
              <h3>Ajuda e Feedback</h3>
            </div>
            <p>Obtenha ajuda sobre o funcionamento do sistema</p>
          </button>
          <hr />
          <button className="config-item" onClick={() => navigate("/sair")}>
            <div className="config-header">
              <i className={icons.sair} style={{color:"red"}}></i>
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