import "../config.css";
import { useNavigate } from "react-router-dom";
import icons from "../../../components/Icons";
import { useState, useEffect } from "react";

export default function AjudaFeedback() {

  const navigate = useNavigate();

  const [chamado, setChamado] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [mensagens, setMensagens] = useState([]);

  /* SIMULA USUARIO LOGADO */
  const user = JSON.parse(localStorage.getItem("user")) || {
    id: 1,
    nome: "Matheus",
    email: "teste@email.com"
  };

  /* ================= */
  /* ABRIR CHAMADO */
  /* ================= */
  async function abrirChamado() {

    const res = await fetch(
      "https://project-finc.onrender.com/chamados",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          assunto: "Suporte",
          categoria: "Sistema",
          mensagem: "Chamado iniciado",
          user
        })
      }
    );

    const data = await res.json();
    setChamado(data);
  }

  /* ================= */
  /* ENVIAR MENSAGEM */
  /* ================= */
  async function enviarMsg() {

    if (!chamado || chamado.status === "fechado") return;

    if (!mensagem.trim()) return;

    await fetch(
      "https://project-finc.onrender.com/mensagem",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chamado_id: chamado.id,
          mensagem
        })
      }
    );

    setMensagem("");
    buscarMensagens();
  }

  /* ================= */
  /* BUSCAR MENSAGENS */
  /* ================= */
  async function buscarMensagens() {

    if (!chamado) return;

    const res = await fetch(
      `https://project-finc.onrender.com/mensagens/${chamado.id}`
    );

    const data = await res.json();
    setMensagens(data || []);
  }

  async function atualizarChamado() {

    if (!chamado) return;

    const res = await fetch(
      `https://project-finc.onrender.com/chamados/${chamado.id}`
    );

    const data = await res.json();
    setChamado(data);
  }


  /* polling estilo whatsapp */
  useEffect(() => {

  if (!chamado) return;

  const buscar = async () => {
    const res = await fetch(
      `https://project-finc.onrender.com/mensagens/${chamado.id}`
    );
    const data = await res.json();
    setMensagens(data || []);
    await atualizarChamado();
  };

  buscar();

  const interval = setInterval(buscar, 3000);

  return () => clearInterval(interval);

}, [chamado]);


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
      <section className="form-section">

        {/* BOTÃO ABRIR */}
        {!chamado && (
          <button className="btn" onClick={abrirChamado}>
            Abrir Chamado
          </button>
        )}

        {/* CHAT */}
        {chamado && (
          <div className="chat-container">

            {mensagens.map((m, i) => (
              <div key={i} className={`bubble ${m.autor}`}>
                {m.mensagem}
              </div>
            ))}

            <div className="chat-input">
              <input
                value={mensagem}
                onChange={e => setMensagem(e.target.value)}
                placeholder="Digite sua mensagem..."
              />

              <button onClick={enviarMsg}>
                Enviar
              </button>
            </div>

          </div>
        )}

      </section>

          <div className="config-item">
            <div className="menu-esquerda">
              <i className="bi bi-book"></i>
              <div>
                <h3>Histórico de chamados</h3>
                <p>Acesse todos os chamados já realizados no sistema</p>
              </div>
            </div>

            <div className="menu-direita">
              <button className="btn">
                Acessar chamados anteriores
              </button>
            </div>
          </div>
        </div>
        </section>
    </main>
   )
}
