import icons from "../../components/Icons";
import { useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/global.css";

function Tela_1_certificado() {
  const [arquivo, setArquivo] = useState(null);
  const [senha, setSenha] = useState("");
  const [status, setStatus] = useState("");
  const [mostrarTutorial, setMostrarTutorial] = useState(false);

  const handleUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setArquivo(file);

    setStatus("Certificado carregado com sucesso.");
  };

  const validarCertificado = () => {
    if (!arquivo) {
      setStatus("Selecione um certificado.");
      return;
    }

    if (!senha) {
      setStatus("Digite a senha do certificado.");
      return;
    }

    setStatus("Certificado validado com sucesso.");
  };

  return (
    <main className="content">
      {/* TÍTULO */}
      <section className="titulo-secao">
        <h1>
          <i className={icons.clientes}></i>
          Certificado Digital
        </h1>
      </section>

      {/* CONTEÚDO */}
      <section className="form-section">
        {/* VOLTAR */}
        <div className="form-footer-voltar">
          <Link to="/configuracao/integracoes" className="previous-step">
            Voltar
            <i className="bi bi-chevron-double-left"></i>
          </Link>
        </div>

        {/* HEADER */}
        <div className="section-header">
          <span className="icon">
            <i className={icons.certificado}></i>
          </span>

          <h3>Configuração do Certificado</h3>
        </div>

        <hr className="divider" />

        {/* EXPLICAÇÃO */}
        <div style={{ marginBottom: "25px" }}>
          <p style={{ color: "#6b7280" }}>
            O certificado digital é utilizado para comunicação com a SEFAZ e
            emissão de notas fiscais.
          </p>
        </div>

        {/* PASSOS */}
        <section
          style={{
            background: "#f9fafb",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "25px",
          }}
        >
          <h3 style={{ marginBottom: "15px" }}>Passo a Passo</h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <span>1. Faça upload do certificado</span>
            <span>2. Informe a senha</span>
            <span>3. Clique em validar</span>
            <span>4. Aguarde a confirmação</span>
          </div>
        </section>

        {/* UPLOAD */}
        <section
          style={{
            border: "2px dashed #d1d5db",
            borderRadius: "12px",
            padding: "30px",
            textAlign: "center",
            marginBottom: "25px",
            background: "#fff",
          }}
        >
          <i
            className="bi bi-cloud-upload"
            style={{
              fontSize: "40px",
              color: "#16a34a",
            }}
          ></i>

          <h3 style={{ marginTop: "15px" }}>Envie seu certificado</h3>

          <p
            style={{
              color: "#6b7280",
              marginBottom: "20px",
            }}
          >
            Formatos aceitos: .pfx e .p12
          </p>

          <input type="file" accept=".pfx,.p12" onChange={handleUpload} />
        </section>

        {/* SENHA */}
        <div style={{ marginBottom: "25px" }}>
          <label>Senha do Certificado</label>

          <input
            type="password"
            placeholder="Digite a senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "10px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
            }}
          />
        </div>

        {/* BOTÃO */}
        <button className="btn btn-verde" onClick={validarCertificado}>
          Validar Certificado
        </button>

        {/* STATUS */}
        {status && (
          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              borderRadius: "10px",
              background: "#f0fdf4",
              color: "#166534",
              border: "1px solid #bbf7d0",
            }}
          >
            {status}
          </div>
        )}

        {/* FAQ */}
        <section
          style={{
            marginTop: "35px",
            background: "#fff",
            borderRadius: "12px",
            padding: "20px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3 style={{ marginBottom: "15px" }}>Dúvidas Frequentes</h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <span>• Não sei emitir meu certificado</span>

            <span>• Onde encontro meu arquivo .pfx?</span>

            <span>• Esqueci minha senha</span>

            <span>• Meu certificado venceu</span>
          </div>
        </section>

        {/* TUTORIAL */}
        <section
          style={{
            marginTop: "25px",
            background: "#fff",
            borderRadius: "12px",
            padding: "20px",
            border: "1px solid #e5e7eb",
          }}
        >
          <button
            onClick={() => setMostrarTutorial(!mostrarTutorial)}
            style={{
              background: "none",
              border: "none",
              fontSize: "18px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            {mostrarTutorial ? "▼" : "▶"} Como emitir seu certificado
          </button>

          {mostrarTutorial && (
            <div style={{ marginTop: "20px" }}>
              <iframe
                width="100%"
                height="400"
                src="https://www.youtube.com/embed/GYc1f9QV1zo?si=KmG7Z0e-Hi2kIg7r"
                title="Tutorial Certificado"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  borderRadius: "12px",
                }}
              ></iframe>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default Tela_1_certificado;
