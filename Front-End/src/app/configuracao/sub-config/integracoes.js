import "../config.css";
import { useNavigate } from "react-router-dom";
import icons from "../../../components/Icons";

export default function Integracoes() {
  const navigate = useNavigate();

  const certificadoConfigurado = false;
  const sefazConectada = true;

  const totalIntegracoes = 2;
  const concluidas =
    (certificadoConfigurado ? 1 : 0) + (sefazConectada ? 1 : 0);

  const porcentagem = Math.round((concluidas / totalIntegracoes) * 100);

  return (
    <main className="content configuracao">
      <section className="titulo-secao">
        <h1>
          <i className={icons.planos}></i> Central de Integrações
        </h1>
      </section>

      <section className="form-section">
        {/* PESQUISA */}
        <section className="form-section">
          <div className="search-bar">
            <input type="text" placeholder="Pesquisar integrações..." />
            <i className="bi bi-search"></i>
          </div>

          <hr />

          <div className="config-back">
            <button
              className="config-voltar"
              onClick={() => navigate("/configuracao")}
            >
              <i className="bi bi-arrow-left"></i> Voltar
            </button>
          </div>
        </section>

        {/* PROGRESSO */}
        <section
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <strong>Progresso das Integrações</strong>
            <span>{porcentagem}%</span>
          </div>

          <div
            style={{
              width: "100%",
              height: "10px",
              background: "#e5e7eb",
              borderRadius: "999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${porcentagem}%`,
                height: "100%",
                background: "#16a34a",
              }}
            />
          </div>

          <p
            style={{
              marginTop: "10px",
              color: "#6b7280",
            }}
          >
            {concluidas} de {totalIntegracoes} integrações configuradas
          </p>
        </section>

        {/* CARDS */}
        <div className="config-options-2">
          {/* SEFAZ */}
          <div className="config-item">
            <div className="menu-esquerda">
              <i className="bi bi-shield-check"></i>

              <div>
                <h3>SEFAZ</h3>

                <p
                  style={{
                    color: sefazConectada ? "#16a34a" : "#dc2626",
                    fontWeight: "600",
                  }}
                >
                  ● {sefazConectada ? "Conectado" : "Desconectado"}
                </p>

                <small style={{ color: "#6b7280" }}>
                  Comunicação com a SEFAZ habilitada
                </small>
              </div>
            </div>

            <div className="menu-direita">
              <button className="btn btn-verde">Validar conexão</button>
            </div>
          </div>

          {/* CERTIFICADO */}
          <div className="config-item">
            <div className="menu-esquerda">
              <i className="bi bi-file-earmark-lock"></i>

              <div>
                <h3>Certificado Digital</h3>

                <p
                  style={{
                    color: certificadoConfigurado ? "#16a34a" : "#d97706",
                    fontWeight: "600",
                  }}
                >
                  ● {certificadoConfigurado ? "Configurado" : "Pendente"}
                </p>

                <small style={{ color: "#6b7280" }}>
                  Necessário para emissão fiscal
                </small>
              </div>
            </div>

            <div className="menu-direita">
              <button
                className="btn btn-verde"
                onClick={() => navigate("/certificado")}
              >
                {certificadoConfigurado ? "Atualizar" : "Configurar"}
              </button>
            </div>
          </div>
        </div>

        {/* CHECKLIST */}
        <section
          style={{
            marginTop: "25px",
            background: "#fff",
            borderRadius: "12px",
            padding: "20px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3 style={{ marginBottom: "15px" }}>Checklist de Ativação</h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <span>
              {certificadoConfigurado ? "✔" : "⚠"} Certificado digital
            </span>

            <span>{sefazConectada ? "✔" : "⚠"} Comunicação SEFAZ</span>

            <span>⚠ Primeira emissão pendente</span>
          </div>
        </section>
      </section>
    </main>
  );
}
