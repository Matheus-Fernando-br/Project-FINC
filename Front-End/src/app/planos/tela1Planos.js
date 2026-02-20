import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PlanoPadrao from "../../components/planos/planoPadrao";
import icons from "../../components/Icons";
import { apiFetch } from "../../utils/api.js";

function Tela_1_planos() {
  const [ativo, setAtivo] = useState(null);
  const [planos, setPlanos] = useState([]);
  const [meuPlano, setMeuPlano] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatBRL = (v) =>
    (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const togglePlano = (planoId) => {
    setAtivo((prev) => (prev === planoId ? null : planoId));
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // 1) planos disponíveis
        const jsonPlanos = await apiFetch("/planos", { method: "GET" });
        setPlanos(jsonPlanos.planos || []);

        // 2) meu plano atual (se não tiver token, apiFetch deve falhar/401 -> ignora)
        const jsonMeu = await apiFetch("/planos/meu/atual", { method: "GET" }).catch(() => null);
        if (jsonMeu?.plano) setMeuPlano(jsonMeu.plano);

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const planoFree = planos.find((p) => p.tipo === "free");
  const planosPagos = planos.filter((p) => p.tipo !== "free");

  return (
    <main className="content">
      <section className="titulo-secao">
        <h1><i className={icons.planos}></i> Planos</h1>
      </section>

      {loading && <p>Carregando planos...</p>}

      <section className="form-section">
        <div className="section-header">
          <span className="icon"><i className={icons.relatorioOk}></i></span>
          <h3>Meu plano atual</h3>
        </div>
        <hr className="divider" />

        {meuPlano ? (
          <PlanoPadrao
            titulo={meuPlano.nome}
            preco={formatBRL(meuPlano.valor)}
            descricao={meuPlano.descricao}
            detalhes={meuPlano.detalhes || []}
            ativo={ativo === meuPlano.id}
            onClick={() => togglePlano(meuPlano.id)}
          />
        ) : (
          <p>Não foi possível carregar seu plano atual.</p>
        )}
      </section>

      <section className="form-section">
        <div className="section-header">
          <span className="icon"><i className={icons.relatorio}></i></span>
          <h3>Planos Disponíveis</h3>
        </div>
        <hr className="divider" />

        {planoFree && (
          <PlanoPadrao
            titulo={planoFree.nome}
            preco={formatBRL(planoFree.valor)}
            descricao={
              planoFree.limites?.notas == null
                ? "emissões ilimitadas"
                : `até ${planoFree.limites?.notas} notas/boletos mensais`
            }
            detalhes={planoFree.detalhes || []}
            ativo={ativo === planoFree.id}
            onClick={() => togglePlano(planoFree.id)}
          />
        )}

        {planosPagos.map((p) => (
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
            onClick={() => togglePlano(p.id)}
          />
        ))}
      </section>

      <div className="botao_geral">
        <Link to="/configuracao/pagamento">
          <button className="btn-cadastrar">Alterar plano</button>
        </Link>
      </div>
    </main>
  );
}

export default Tela_1_planos;