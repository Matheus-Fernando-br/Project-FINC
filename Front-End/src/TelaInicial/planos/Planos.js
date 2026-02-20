import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/telaInicial.css";
import PlanoPadrao from "../../components/planos/planoPadrao";
import { apiFetch } from "../../utils/api.js";

function Planos() {
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const formatBRL = (v) =>
    (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  useEffect(() => {
    const load = async () => {
      try {
        setErro("");
        setLoading(true);
        const json = await apiFetch("/planos", { method: "GET" });
        setPlanos(json?.planos || []);
      } catch (e) {
        console.error(e);
        setErro(e.message || "Erro ao carregar planos.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const planosOrdenados = useMemo(() => {
    const order = { free: 0, basico: 1, premium: 2, black: 3 };
    return [...planos].sort((a, b) => (order[a.tipo] ?? 99) - (order[b.tipo] ?? 99));
  }, [planos]);

  return (
    <main className="tela-planos">
      <div className="titulo">
        <h1>Nossos Planos</h1>
      </div>

      {loading && (
        <div className="loading-box" style={{ maxWidth: 520, margin: "12px auto" }}>
          <span className="spinner"></span>
          <div className="loading-text">
            <h3>Carregando planos...</h3>
            <p>Aguarde um instante 👇</p>
          </div>
        </div>
      )}

      {!loading && erro && (
        <div className="erro-box" style={{ maxWidth: 520, margin: "12px auto" }}>
          <h3>Não foi possível carregar 😕</h3>
          <p>{erro}</p>
        </div>
      )}

      {!loading && !erro && (
        <section className="panel_planos">
          <div className="planos">
            {planosOrdenados.map((p) => (
              <PlanoPadrao
                key={p.id}
                titulo={p.nome}
                preco={formatBRL(p.valor)}
                descricao={
                  p.limites?.notas == null
                    ? "emissões ilimitadas"
                    : `até ${p.limites?.notas} notas/boletos mensais`
                }
                detalhes={Array.isArray(p.detalhes) ? p.detalhes : []}
                ativo={false}
              />
            ))}
          </div>

          <div className="lado-direito">
            <div className="text">
              <h2>Todos os planos contemplam:</h2>
              <ul>
                <li>Gestão financeira com relatórios;</li>
                <li>Controle de produtos e clientes;</li>
                <li>Interface gráfica otimizada.</li>
                <li>Suporte via e-mail.</li>
              </ul>
            </div>

            <div className="rodape form-footer voltar">
              <Link to="/">
                Voltar para Tela Inicial{" "}
                <i className="bi bi-chevron-double-left"></i>
                <i className="bi bi-chevron-double-left"></i>
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default Planos;