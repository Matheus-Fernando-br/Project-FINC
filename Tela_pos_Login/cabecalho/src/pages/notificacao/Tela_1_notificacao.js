import Layout from '../../components/Layout';
import './notificacao.css'
import { Link } from 'react-router-dom';
import { useState } from 'react';

function Tela_1_notificacao() {
  const [ativo, setAtivo] = useState({
    email: false,
    zap: false,
    sms: false
  });

  const toggle = (tipo) => {
    setAtivo((prev) => ({
      ...prev,
      [tipo]: !prev[tipo]  // inverte o valor
    }));
  };

  return (
      <main className="content">
        <section className="form-section">
          <div className="section-header">
            <span className="icon"><i className="bi bi-journal-text"></i></span>
            <h3>Notificações</h3>
          </div>
          <hr className="divider" />
          <h4>Selecione os meios pelos quais deseja receber as notificações de notas com validação de certificado digital
            pendente</h4>
        </section>

        <section className="botoes">
          <button
            className={`btn ${ativo.email ? "btn-verde" : "btn-vermelho"}`}
            onClick={() => toggle("email")}
          >
            E-mail
          </button>

          <button
            className={`btn ${ativo.zap ? "btn-verde" : "btn-vermelho"}`}
            onClick={() => toggle("zap")}
          >
            WhatsApp
          </button>

          <button
            className={`btn ${ativo.sms ? "btn-verde" : "btn-vermelho"}`}
            onClick={() => toggle("sms")}
          >
            SMS
          </button>
        </section>

        {/*
        <section class="botoes">
            <button class="btn btn-email">E-mail</button>  
            <button class="btn btn-zap">Whattsap</button>  
            <button class="btn btn-sms">SMS</button>  
        </section>
        */}
      </main>
  );
} 

export default Tela_1_notificacao;