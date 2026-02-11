    import "../../config.css";
    import { useParams } from "react-router-dom";
    import { useState, useEffect, useRef } from "react";

    export default function Chat() {

    const { id } = useParams();

    const [mensagens, setMensagens] = useState([]);
    const [mensagem, setMensagem] = useState("");
    const [chamado, setChamado] = useState(null);

    const chatRef = useRef(null);

    /* ================= ENVIAR MSG ================= */

    async function enviarMsg() {

        if (!mensagem.trim()) return;

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
    }

    /* ================= BUSCAR DADOS ================= */

    async function buscar() {

        const resMsg = await fetch(
        `https://project-finc.onrender.com/mensagens/${id}`
        );

        const dataMsg = await resMsg.json();
        setMensagens(dataMsg);

        const resChamado = await fetch(
        `https://project-finc.onrender.com/chamados/${id}`
        );

        const dataChamado = await resChamado.json();
        setChamado(dataChamado);
    }

    /* ================= AUTO REFRESH ================= */

    useEffect(() => {

        buscar();

        const interval = setInterval(buscar, 3000);
        return () => clearInterval(interval);

    }, [id]);

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

        await fetch(`https://project-finc.onrender.com/chamados/${id}/encerrar`, {
        method: "PUT"
        });

        buscar();
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
                <button className="btn btn-cancelar" onClick={encerrarChamado}>
                Encerrar Chamado
                </button>
            </div>

        </div>

        {/* ===== CHAT ===== */}

        <div className="chat-container">

            {/* PRIMEIRA MSG */}
            {chamado?.mensagem_inicial && (
            <div className="chat-first">
                <strong>Mensagem inicial:</strong>
                <p>{chamado.mensagem_inicial}</p>
                <span className="status">Aguardando atendente...</span>
            </div>
            )}

            {/* MENSAGENS */}
            <div className="chat-messages" ref={chatRef}>
            {mensagens.map((m, i) => (
                <div key={i} className={`bubble ${m.autor}`}>
                {m.mensagem}
                <span className="msg-status">✓ entregue</span>
                </div>
            ))}
            </div>

            {/* INPUT */}
            <div className="chat-input">

            <input
                placeholder="Digite sua mensagem..."
                value={mensagem}
                onChange={e => setMensagem(e.target.value)}
            />

            <button onClick={enviarMsg}>
                Enviar
            </button>

            </div>

        </div>

        </main>
    );
    }
