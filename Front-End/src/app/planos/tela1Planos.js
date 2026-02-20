import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PlanoPadrao from "../../components/planos/planoPadrao";
import icons from "../../components/Icons";
import { apiFetch } from "../../utils/api.js";

function Tela_1_planos() {
  const [meuPlano, setMeuPlano] = useState(null);
  const [disponiveis, setDisponiveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const formatBRL = (v) =>
    (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  useEffect(() => {
    const load = async () => {
      try {
        setErro("");
        setLoading(true);

        const [meu, disp] = await Promise.all([
          apiFetch("/planos/meu", { method: "GET" }),
          apiFetch("/planos/disponiveis", { method: "GET" }),
        ]);

        setMeuPlano(meu.plano || null);
        setDisponiveis(disp.planos || []);
      } catch (e) {
        setErro(e.message || "Erro ao carregar planos.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <main className="content">
      <section className="titulo-secao">
        <h1><i className={icons.planos}></i> Planos</h1>
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

      {!loading && erro && <p className="feedback">{erro}</p>}

      {!loading && !erro && (
        <>
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

            {disponiveis.map((p) => (
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
              />
            ))}

            {disponiveis.length === 0 && <p>Não há planos disponíveis.</p>}
          </section>

          <div className="botao_geral">
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