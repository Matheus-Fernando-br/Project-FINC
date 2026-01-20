import icons from "../../components/Icons";
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

  const [texto, setTexto] = useState("");

  const enviar = (e) => {
    e.preventDefault();

    if (texto.trim() === "") {
      alert("Preencha o campo antes de enviar!");
      return;
    }

    alert("Mensagem enviada com sucesso!");
    setTexto(""); // limpa o input
  };

  return (
      <main className="content">
        <section className="form-section">
          <div className="section-header">
            <span className="icon"><i className={icons.notificacoes}></i></span>
            <h3>Notificações</h3>
          </div>
          <hr className="divider" />
          <label>Selecione os meios pelos quais deseja receber as notificações de notas com validação de certificado digital
            pendente</label>
        

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
        </section>

        <section className="form-section">
          <div className="section-header">
            <span className="icon"><i className={icons.feedback}></i></span>
            <h3>Fale Conosco</h3>
          </div>

          <hr className="divider" />

           <label>Digite aqui sua dúvida ou mensagem para enviarmos ao suporte</label>
          <div className="form-row">
            <input
              type="text"
              placeholder="Comentários, dúvidas e reclamações."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
          </div>

          <div className="botao_geral">
            <button className="btn" onClick={enviar}>
              Enviar
            </button>
          </div>
        </section>

      </main>
  );
} 

export default Tela_1_notificacao;