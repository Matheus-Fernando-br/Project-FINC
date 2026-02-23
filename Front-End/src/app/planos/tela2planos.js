import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PlanoPadrao from "../../components/planos/planoPadrao";
import icons from "../../components/Icons";
import { apiFetch } from "../../utils/api.js";

function Tela_2_planos() {
  const [meuPlano, setMeuPlano] = useState(null);
  const [disponiveis, setDisponiveis] = useState([]);
  const [ativo, setAtivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingTroca, setLoadingTroca] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [feedback, setFeedback] = useState("");
  const navigate = useNavigate();

  const formatBRL = (v) =>
    (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const carregar = async () => {
    const [meu, disp] = await Promise.all([
      apiFetch("/planos/meu", { method: "GET" }),
      apiFetch("/planos/disponiveis", { method: "GET" }),
    ]);
    setMeuPlano(meu.plano || null);
    setDisponiveis(disp.planos || []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setFeedback("");
        await carregar();
      } catch (e) {
        console.error(e);
        setFeedback(e.message || "Erro ao carregar planos.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const planoSelecionado = useMemo(
    () => disponiveis.find((p) => p.id === ativo),
    [disponiveis, ativo]
  );

  const trocarPlano = async () => {
    setFeedback("");

    if (!planoSelecionado?.id) {
      window.confirm("Selecione um plano disponível.");
      return;
    }

    try {
      setLoadingTroca(true);

      // ✅ update real no banco
      await apiFetch("/planos/meu", {
        method: "PUT",
        body: JSON.stringify({ id_plan: planoSelecionado.id }),
      });

      // ✅ recarrega do backend (fonte da verdade)
      await carregar();
      setAtivo(null);

      setFeedback("✅ Plano alterado com sucesso!");
      setTimeout(() => {
      navigate("/planos");
    }, 2000);
    } catch (e) {
      console.error(e);
      setFeedback(e.message || "Erro ao trocar plano.");
    } finally {
      setLoadingTroca(false);
    }
  };

    const cancelarAlteracoes = () => {
      setLoadingCancel(true);
    if (!window.confirm("Deseja cancelar a troca de Plano?")) return;
    setFeedback("Operação cancelada!");
    setTimeout(() => {
      setLoadingCancel(false);
      navigate("/planos");
    }, 2000);
  };

  return (
    <main className="content">
      <section className="titulo-secao">
        <h1>
          <i className={icons.planos}></i> Trocar Plano
        </h1>
      </section>

      <div className="form-footer voltar">
        <Link to="/planos" className="previous-step">
          Voltar <i className="bi bi-chevron-double-left"></i>
        </Link>
      </div>

      {loading && (
        <div className="loading-box">
          <span className="spinner"></span>
          <div className="loading-text">
            <h3>Carregando planos...</h3>
            <p>Aguarde um instante 👇</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* Meu plano atual */}
          <section className="form-section">
            <div className="section-header">
              <span className="icon">
                <i className={icons.relatorioOk}></i>
              </span>
              <h3>Meu plano atual</h3>
            </div>
            <hr className="divider" />

            {meuPlano ? (
              <PlanoPadrao
                titulo={meuPlano.nome}
                preco={formatBRL(meuPlano.valor)}
                descricao={meuPlano.descricao}
                detalhes={meuPlano.detalhes || []}
              />
            ) : (
              <p>Não foi possível carregar seu plano atual.</p>
            )}
          </section>

          {/* Disponíveis */}
          <section className="form-section">
            <div className="section-header">
              <span className="icon">
                <i className={icons.relatorio}></i>
              </span>
              <h3>Planos Disponíveis</h3>
            </div>
            <hr className="divider" />

            <div className="planos-list">
              {disponiveis.map((p) => {
                const checked = ativo === p.id;

                return (
                  <div key={p.id} className={`plano-row ${checked ? "selecionado" : ""}`}>
                    {/* ESQUERDA: card intacto */}
                    <div className="plano-row-card">
                      <PlanoPadrao
                        titulo={p.nome}
                        preco={formatBRL(p.valor)}
                        descricao={
                          p.limites?.notas == null
                            ? "emissões ilimitadas"
                            : `até ${p.limites?.notas} notas/boletos mensais`
                        }
                        detalhes={p.detalhes || []}
                      />
                    </div>

                    {/* DIREITA: seletor */}
                    <div className="plano-row-select">
                      <label className="radio-pill">
                        <input
                          type="radio"
                          name="plano"
                          checked={checked}
                          onChange={() => setAtivo(p.id)}
                        />
                        <span className="radio-ui" />
                        <span className="radio-text">{checked ? "Selecionado" : "Selecionar"}</span>
                      </label>
                    </div>
                  </div>
                );
              })}

              {disponiveis.length === 0 && <p>Não há outros planos disponíveis.</p>}
            </div>
          </section>

          {feedback && <p className="feedback">{feedback}</p>}

          <div className="botao_geral">
            <button className="btn btn-cancelar" onClick={cancelarAlteracoes}>
              {loadingCancel && <span className="spinner"></span>}
              {loadingCancel ? "" : "Cancelar troca"}
            </button>
          <button
            className="btn btn-cadastrar"
            onClick={trocarPlano}
            disabled={!ativo || loadingTroca || loadingCancel}
          >
            {loadingTroca && <span className="spinner"></span>}
            {loadingTroca ? "" : "Confirmar troca"}
          </button>
          </div>
        </>
      )}
    </main>
  );
}

export default Tela_2_planos;