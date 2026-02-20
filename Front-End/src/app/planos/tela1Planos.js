import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PlanoPadrao from "../../components/planos/planoPadrao";
import icons from "../../components/Icons";
import { apiFetch } from "../../utils/api.js";

function Tela_1_planos() {
  const [ativo, setAtivo] = useState(null);
  const [planos, setPlanos] = useState([]);
  const [meuPlano, setMeuPlano] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const formatBRL = (v) =>
    (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const togglePlano = (planoId) => {
    setAtivo((prev) => (prev === planoId ? null : planoId));
  };

  useEffect(() => {
    const load = async () => {
      try {
        setErro("");
        setLoading(true);

        // 1) planos disponíveis (público)
        const jsonPlanos = await apiFetch("/planos", { method: "GET" });
        const lista = jsonPlanos?.planos || [];
        setPlanos(lista);

        // 2) meu plano (privado) - se falhar, só ignora e segue
        try {
          const jsonMeu = await apiFetch("/planos/meu", { method: "GET" });
          if (jsonMeu?.plano) setMeuPlano(jsonMeu.plano);
        } catch (e) {
          // aqui pode ser 401 (sem token) ou 404 (sem plano definido)
          console.warn("Falha ao buscar meu plano:", e.message);
          setMeuPlano(null);
        }
      } catch (e) {
        console.error(e);
        setErro(e.message || "Erro ao carregar planos.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);
  
  const planosDisponiveis = useMemo(() => {
    if (!meuPlano?.id) return planos;
    return planos.filter((p) => String(p.id) !== String(meuPlano.id));
  }, [planos, meuPlano]);

  const planoFree = planosDisponiveis.find((p) => p.tipo === "free");
  const planosPagos = planosDisponiveis.filter((p) => p.tipo !== "free");

  return (
    <main className="content">
      <section className="titulo-secao">
        <h1>
          <i className={icons.planos}></i> Planos
        </h1>
      </section>

      {/* ✅ LOADING BONITO */}
      {loading && (
        <div className="loading-box">
          <span className="spinner"></span>
          <div className="loading-text">
            <h3>Carregando planos...</h3>
            <p>Aguarde um instante 👇</p>
          </div>
        </div>
      )}

      {/* ✅ ERRO VISÍVEL */}
      {!loading && erro && (
        <div className="erro-box">
          <h3>Não foi possível carregar 😕</h3>
          <p>{erro}</p>
          <p style={{ opacity: 0.8, marginTop: 8 }}>
            Dica: abra o console e veja “Erro ao carregar planos”.
          </p>
        </div>
      )}

      {!loading && !erro && (
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
                ativo={ativo === meuPlano.id}
                onClick={() => togglePlano(meuPlano.id)}
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

            {planosDisponiveis.length === 0 && (
              <p>Você já está no único plano disponível.</p>
            )}
          </section>

          <div className="botao_geral">
            {/* ✅ aqui depende da sua rota real */}
            <Link to="/planos/trocar">
              <button className="btn-cadastrar">Trocar plano</button>
            </Link>
          </div>
        </>
      )}
    </main>
  );
}

export default Tela_1_planos;