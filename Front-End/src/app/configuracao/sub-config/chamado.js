import "../config.css";
import { useNavigate } from "react-router-dom";
import icons from "../../../components/Icons";
import { useState, useEffect } from "react";

export default function AjudaFeedback() {

  const navigate = useNavigate();

  const [chamado, setChamado] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [mensagens, setMensagens] = useState([]);

  const user = JSON.parse(localStorage.getItem("user")) || {
    id: 1,
    nome: "Matheus",
    email: "teste@email.com"
  };

  /* ================= */
  /* ABRIR CHAMADO */
  /* ================= */
  async function abrirChamado() {

    try {

      const res = await fetch(
        "https://project-finc.onrender.com/chamados",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assunto: "Suporte",
            categoria: "Sistema",
            mensagem: "Chamado iniciado",
            user
          })
        }
      );

      if (!res.ok) throw new Error("Erro ao abrir chamado");

      const data = await res.json();
      setChamado(data);

    } catch (err) {
      console.error("Erro abrir chamado:", err);
    }
  }

  /* ================= */
  /* ENVIAR MENSAGEM */
  /* ================= */
  async function enviarMsg() {

    if (!chamado?.id) return;
    if (chamado.status === "fechado") return;
    if (!mensagem.trim()) return;

    try {

      const res = await fetch(
        "https://project-finc.onrender.com/mensagem",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chamado_id: chamado.id,
            mensagem
          })
        }
      );

      if (!res.ok) throw new Error("Erro ao enviar mensagem");

      setMensagem("");

    } catch (err) {
      console.error("Erro enviar mensagem:", err);
    }
  }

  /* ================= */
  /* POLLING WHATSAPP STYLE */
  /* ================= */
  useEffect(() => {

    if (!chamado?.id) return;

    let ativo = true;

    const buscar = async () => {

      try {

        /* mensagens */
        const resMsg = await fetch(
          `https://project-finc.onrender.com/mensagens/${chamado.id}`
        );

        if (!resMsg.ok) throw new Error("Erro buscar mensagens");

        const dataMsg = await resMsg.json();

        if (ativo) setMensagens(dataMsg || []);

        /* status chamado */
        const resChamado = await fetch(
          `https://project-finc.onrender.com/chamados/${chamado.id}`
        );

        if (!resChamado.ok) throw new Error("Erro buscar chamado");

        const dataChamado = await resChamado.json();

        if (ativo) setChamado(dataChamado);

      } catch (err) {
        console.error("Erro polling:", err);
      }
    };

    buscar();

    const interval = setInterval(buscar, 3000);

    return () => {
      ativo = false;
      clearInterval(interval);
    };

  }, [chamado?.id]);

  return (
    <main className="content configuracao">

      <section className='titulo-secao'>
        <h1><i className={icons.suporte}></i> Central de Ajuda e Suporte</h1>
      </section>

      <section className="form-section">

        <section className="form-section">
          <div className="search-bar">
            <input type="text" placeholder="Pesquisar configurações..." />
            <i className="bi bi-search"></i>
          </div>

          <hr />

          <div className="config-back">
            <button
              className="config-voltar"
              onClick={() => navigate("/configuracao/ajuda")}
            >
              <i className="bi bi-arrow-left"></i> Voltar
            </button>
          </div>
        </section>

        <div className="config-options-2">

          <section className="form-section">

            {!chamado && (
              <button className="btn" onClick={abrirChamado}>
                Abrir Chamado
              </button>
            )}

            {chamado && (
              <div className="chat-container">

                <div className="chat-messages">
                  {mensagens.map((m, i) => (
                    <div key={i} className={`bubble ${m.autor}`}>
                      {m.mensagem}
                    </div>
                  ))}
                </div>

                <div className="chat-input">
                  <input
                    value={mensagem}
                    onChange={e => setMensagem(e.target.value)}
                    placeholder={
                      chamado.status === "fechado"
                        ? "Chamado encerrado"
                        : "Digite sua mensagem..."
                    }
                    disabled={chamado.status === "fechado"}
                  />

                  <button
                    onClick={enviarMsg}
                    disabled={chamado.status === "fechado"}
                  >
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
  );
}
