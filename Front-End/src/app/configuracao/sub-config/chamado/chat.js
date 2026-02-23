import "../../config.css";
import { useParams, useNavigate  } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";

export default function Chat() {

  const { id } = useParams();

  const [mensagens, setMensagens] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [chamado, setChamado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const navigate = useNavigate();

  const chatRef = useRef(null);

  /* ================= BUSCAR DADOS ================= */

  const buscar = useCallback(async () => {
    try {

      const resMsg = await fetch(
        `https://project-finc.onrender.com/mensagens/${id}`
      );

      const dataMsg = await resMsg.json();
      setMensagens(dataMsg || []);

      const resChamado = await fetch(
        `https://project-finc.onrender.com/chamados/${id}`
      );

      const dataChamado = await resChamado.json();
      setChamado(dataChamado);

    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    }
  }, [id]);

  /* ================= ENVIAR MSG ================= */

  async function enviarMsg() {
    setLoading(true);

    if (!mensagem.trim()) return;

    if (chamado?.status === "fechado") return;

    try {

      await fetch("https://project-finc.onrender.com/mensagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chamado_id: id,
          mensagem
        })
      });

      setMensagem("");
      buscar();
      setLoading(false);

    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    }
  }

  /* ================= AUTO REFRESH ================= */

  useEffect(() => {

    buscar();

    const interval = setInterval(buscar, 3000);
    return () => clearInterval(interval);

  }, [buscar]);

  /* ================= AUTO SCROLL ================= */

  useEffect(() => {

    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }

  }, [mensagens]);

  /* ================= TRAVAR SAÍDA ================= */

  useEffect(() => {

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };

  }, []);

  /* ================= ENCERRAR CHAMADO ================= */

  async function encerrarChamado() {
    setLoadingCancel(true)
    try {

      await fetch(
        `https://project-finc.onrender.com/chamados/${id}/encerrar`,
        { method: "PUT" }
      );

      buscar();
      setTimeout(() => {
        navigate("/configuracao/chamado");
      }, 4000);

    } catch (err) {
      console.error("Erro ao encerrar chamado:", err);
    }
  }

  return (
    <main className="content configuracao">

      {/* ===== HEADER ===== */}

      <div className="chat-header">

        <div>
          <h1>Chat do Chamado #{chamado?.protocolo}</h1>

          <p className="chat-info">
            {chamado?.categoria} • {chamado?.assunto}
          </p>
        </div>

        <div className="botao_geral">
          {chamado?.status !== "fechado" && (
            <button
              className="btn btn-cancelar"
              onClick={encerrarChamado}
            >
              {loadingCancel && <span className="spinner"></span>}
              {loadingCancel ? "" : "Encerrar chamado"}
            </button>
          )}
        </div>

      </div>

      {/* ===== ALERTAS STATUS ===== */}

      {chamado?.status === "aceito" && (
        <div className="status-alert aceito">
          ✅ Seu chamado foi aceito por um atendente
        </div>
      )}

      {chamado?.status === "fechado" && (
        <div className="status-alert fechado">
          🔒 Este chamado foi encerrado
        </div>
      )}

      {/* ===== CHAT ===== */}

      <div className="chat-container">

        {/* MENSAGENS */}
        <div className="chat-messages" ref={chatRef}>
          {mensagens.map((m) => (
            <div key={m.id} className={`bubble ${m.autor}`}>
              {m.mensagem}
              <span className="msg-status">✓ entregue</span>
            </div>
          ))}
        </div>

        {/* INPUT */}
        {chamado?.status !== "fechado" && (
          <div className="chat-input">

            <input
              placeholder="Digite sua mensagem..."
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
            />

            <button onClick={enviarMsg}>
              {loading && <span className="spinner"></span>}
              {loading ? "" : "Enviar"}
            </button>

          </div>
        )}

      </div>

    </main>
  );
}
