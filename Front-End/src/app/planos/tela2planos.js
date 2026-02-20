import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PlanoPadrao from "../../components/planos/planoPadrao";
import icons from "../../components/Icons";
import { apiFetch } from "../../utils/api.js";

function Tela_2_planos() {
  const [ativo, setAtivo] = useState(null);     // plano escolhido nos disponíveis
  const [planos, setPlanos] = useState([]);
  const [meuPlano, setMeuPlano] = useState(null); // plano atual (visual)
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const formatBRL = (v) =>
    (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const jsonPlanos = await apiFetch("/planos", { method: "GET" });
        setPlanos(jsonPlanos.planos || []);

        const jsonMeu = await apiFetch("/planos/meu", { method: "GET" }).catch(() => null);        if (jsonMeu?.plano) setMeuPlano(jsonMeu.plano);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // disponíveis = todos EXCETO o atual (visual)
  const planosDisponiveis = useMemo(() => {
    if (!meuPlano?.id) return planos;
    return planos.filter((p) => p.id !== meuPlano.id);
  }, [planos, meuPlano]);

  const planoSelecionado = useMemo(
    () => planosDisponiveis.find((p) => p.id === ativo),
    [planosDisponiveis, ativo]
  );

  const trocarPlanoDemo = () => {
    setFeedback("");

    if (!meuPlano?.id) {
      setFeedback("Não foi possível identificar seu plano atual.");
      return;
    }
    if (!planoSelecionado?.id) {
      setFeedback("Selecione um plano disponível para trocar.");
      return;
    }

    // ✅ swap visual: selecionado vira atual, o atual volta pra disponíveis
    const planoAnterior = meuPlano;
    setMeuPlano(planoSelecionado);

    // opcional: deixa o anterior já selecionado nos disponíveis após a troca
    setAtivo(planoAnterior.id);

    setFeedback(`✅ Demonstração: seu plano foi trocado para "${planoSelecionado.nome}".`);
  };

  return (
    <main className="content">
      <section className="titulo-secao">
        <h1>
          <i className={icons.planos}></i> Trocar Plano
        </h1>
      </section>

      <div className="form-footer voltar">
        <Link to="/configuracao/planos" className="previous-step">
          Voltar <i className="bi bi-chevron-double-left"></i>
        </Link>
      </div>

      {loading && <p>Carregando planos...</p>}

      {/* Meu plano atual (visual) */}
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
            ativo={true}
            onClick={undefined}
          />
        ) : (
          <p>Não foi possível carregar seu plano atual.</p>
        )}
      </section>

      {/* Planos disponíveis */}
      <section className="form-section">
        <div className="section-header">
          <span className="icon">
            <i className={icons.relatorio}></i>
          </span>
          <h3>Planos Disponíveis</h3>
        </div>
        <hr className="divider" />

        {planosDisponiveis.map((p) => (
          <PlanoPadrao
            key={p.id}
            titulo={p.nome}
            preco={formatBRL(p.valor)}
            descricao={
              p.limites?.notas == null
                ? "emissões ilimitadas"
                : `até ${p.limites?.notas} notas/boletos mensais`
            }
            detalhes={p.detalhes || []}
            ativo={ativo === p.id}
            onClick={() => setAtivo(p.id)}
          />
        ))}

        {!loading && planosDisponiveis.length === 0 && (
          <p>Não existem outros planos disponíveis no momento.</p>
        )}
      </section>

      {feedback && <p className="feedback">{feedback}</p>}

      <div className="botao_geral">
        <button className="btn-cadastrar" onClick={trocarPlanoDemo} disabled={!ativo}>
          Trocar plano (demo)
        </button>
      </div>
    </main>
  );
}

export default Tela_2_planos;