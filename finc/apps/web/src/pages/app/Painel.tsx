import { Link } from "react-router-dom";
import type { LimitesPlano, Plano, Preferencias } from "@finc/shared";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Card, Empty, ErrorBox, Loading, PageHeader } from "../../components/ui";
import { dataBR, formatBRL, numeroNota } from "../../format";
import { useApi } from "../../hooks/useApi";
import { StatusNota } from "./Notas";
import type { Nota } from "../../api/types";

interface Dashboard {
  faturamentoMensal: { mes: string; total: number; quantidade: number }[];
  topClientes: { nome: string; total: number; quantidade: number }[];
  topItens: { nome: string; tipo: string; total: number; quantidade: number }[];
  notasPorTipo: { tipo: string; quantidade: number; total: number }[];
  financeiro: { a_receber: number; a_pagar: number; vencidas: number; vencendo_7_dias: number };
  estoqueBaixo: {
    id: string;
    nome: string;
    sku: string;
    estoque_atual: number;
    estoque_minimo: number;
  }[];
  plano: Plano;
  uso: Record<keyof LimitesPlano, number>;
  notasRecentes: (Pick<
    Nota,
    "id" | "tipo" | "numero" | "status" | "total" | "data_emissao" | "criado_em"
  > & { cliente_nome: string })[];
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const rotuloMes = (m: string) => `${MESES[Number(m.slice(5, 7)) - 1]}/${m.slice(2, 4)}`;

function Uso({ rotulo, uso, limite }: { rotulo: string; uso: number; limite: number | null }) {
  const pct = limite ? Math.min(100, Math.round((uso / limite) * 100)) : 0;
  return (
    <div className="stack" style={{ gap: 4 }}>
      <div className="row small" style={{ justifyContent: "space-between" }}>
        <span>{rotulo}</span>
        <span className="muted">
          {limite === null ? `${uso} · ilimitado` : `${uso} de ${limite}`}
        </span>
      </div>
      {limite !== null && (
        <div
          className={`progress ${pct >= 100 ? "full" : pct >= 80 ? "warn" : ""}`}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={rotulo}
        >
          <span style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

export function Painel() {
  const { usuario } = useAuth();
  const { data, error, loading, reload } = useApi(() => api.get<Dashboard>("/dashboard"));
  const prefs = useApi(() => api.get<Preferencias>("/config/preferencias"));

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!data) return null;
  const fat = data.faturamentoMensal.map((m) => ({ ...m, rotulo: rotuloMes(m.mes) }));
  const mesAtual = data.faturamentoMensal.at(-1);
  const anoTotal = data.faturamentoMensal.reduce((s, m) => s + m.total, 0);
  const vazio = data.notasRecentes.length === 0;

  return (
    <>
      <PageHeader
        title={`Olá, ${usuario?.nome.split(" ")[0] ?? ""}!`}
        icon="bi-speedometer2"
        sub="Indicadores calculados a partir dos seus documentos e lançamentos."
      />
      <Card
        title="Atalhos rápidos"
        icon="bi-lightning-charge"
        actions={
          <Link to="/configuracoes/preferencias" className="small">
            Personalizar
          </Link>
        }
      >
        <div className="row">
          {(prefs.data?.atalhos ?? []).map((a) => (
            <Link key={a.to + a.label} to={a.to} className="btn secondary">
              <i className={`bi ${a.icon}`} /> {a.label}
            </Link>
          ))}
          {prefs.data && prefs.data.atalhos.length === 0 && (
            <span className="muted small">Nenhum atalho configurado.</span>
          )}
        </div>
      </Card>
      <div className="grid grid-4 mt">
        <Card>
          <div className="kpi">
            <span className="label">
              <i className="bi bi-graph-up" /> Faturamento no mês
            </span>
            <span className="value">{formatBRL(mesAtual?.total ?? 0)}</span>
            <span className="muted small">{mesAtual?.quantidade ?? 0} documento(s)</span>
          </div>
        </Card>
        <Card>
          <div className="kpi">
            <span className="label">
              <i className="bi bi-calendar3" /> Últimos 12 meses
            </span>
            <span className="value">{formatBRL(anoTotal)}</span>
          </div>
        </Card>
        <Card>
          <div className="kpi">
            <span className="label">
              <i className="bi bi-arrow-down-circle" /> A receber
            </span>
            <span className="value">{formatBRL(data.financeiro.a_receber)}</span>
            <Link to="/financeiro?tipo=receber" className="small">
              Ver contas
            </Link>
          </div>
        </Card>
        <Card>
          <div className="kpi">
            <span className="label">
              <i className="bi bi-arrow-up-circle" /> A pagar
            </span>
            <span className="value">{formatBRL(data.financeiro.a_pagar)}</span>
            {data.financeiro.vencidas > 0 ? (
              <Link
                to="/financeiro?status=vencida"
                className="small"
                style={{ color: "var(--danger)" }}
              >
                {data.financeiro.vencidas} vencida(s)
              </Link>
            ) : (
              <span className="muted small">
                {data.financeiro.vencendo_7_dias} vencendo em 7 dias
              </span>
            )}
          </div>
        </Card>
      </div>
      {vazio && (
        <Card className="mt" title="Primeiros passos" icon="bi-flag">
          <ol style={{ margin: 0, paddingLeft: 18 }} className="stack">
            <li>
              <Link to="/meus-dados">Complete seus dados e endereço</Link> (necessários para
              emitir).
            </li>
            <li>
              Cadastre <Link to="/clientes/novo">clientes</Link> e{" "}
              <Link to="/produtos/novo">produtos</Link> ou <Link to="/servicos/novo">serviços</Link>{" "}
              — ou importe uma planilha.
            </li>
            <li>
              <Link to="/notas/nova">Emita seu primeiro documento</Link>.
            </li>
          </ol>
        </Card>
      )}
      <div className="grid grid-2 mt">
        <Card title="Faturamento mensal" icon="bi-bar-chart">
          {anoTotal === 0 ? (
            <Empty icon="bi-bar-chart">Sem documentos emitidos nos últimos 12 meses.</Empty>
          ) : (
            <div style={{ height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={fat}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="rotulo" tick={{ fontSize: 12, fill: "var(--muted)" }} />
                  <YAxis
                    tick={{ fontSize: 12, fill: "var(--muted)" }}
                    tickFormatter={(v: number) =>
                      new Intl.NumberFormat("pt-BR", {
                        notation: "compact",
                        maximumFractionDigits: 1,
                      }).format(v)
                    }
                  />
                  <Tooltip formatter={(v) => formatBRL(v)} labelStyle={{ color: "#0f172a" }} />
                  <Bar dataKey="total" name="Faturamento" fill="#12a150" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
        <Card
          title={`Uso do plano ${data.plano.nome}`}
          icon="bi-stars"
          actions={
            <Link to="/planos" className="small">
              Gerenciar
            </Link>
          }
        >
          <div className="stack">
            <Uso
              rotulo="Documentos neste mês"
              uso={data.uso.notas_mes}
              limite={data.plano.limites.notas_mes}
            />
            <Uso rotulo="Clientes" uso={data.uso.clientes} limite={data.plano.limites.clientes} />
            <Uso rotulo="Produtos" uso={data.uso.produtos} limite={data.plano.limites.produtos} />
            <Uso rotulo="Serviços" uso={data.uso.servicos} limite={data.plano.limites.servicos} />
            <Uso
              rotulo="Contadores"
              uso={data.uso.contadores}
              limite={data.plano.limites.contadores}
            />
          </div>
        </Card>
      </div>
      <div className="grid grid-3 mt">
        <Card title="Principais clientes" icon="bi-people">
          {data.topClientes.length === 0 ? (
            <p className="muted small">Sem dados ainda.</p>
          ) : (
            <table className="table">
              <tbody>
                {data.topClientes.map((c) => (
                  <tr key={c.nome}>
                    <td>
                      {c.nome}
                      <div className="muted small">{c.quantidade} doc.</div>
                    </td>
                    <td className="num">{formatBRL(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card title="Mais vendidos" icon="bi-trophy">
          {data.topItens.length === 0 ? (
            <p className="muted small">Sem dados ainda.</p>
          ) : (
            <table className="table">
              <tbody>
                {data.topItens.map((c) => (
                  <tr key={c.nome + c.tipo}>
                    <td>
                      {c.nome}
                      <div className="muted small">
                        {c.tipo === "produto" ? "Produto" : "Serviço"} · {c.quantidade}
                      </div>
                    </td>
                    <td className="num">{formatBRL(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card title="Estoque baixo" icon="bi-exclamation-triangle">
          {data.estoqueBaixo.length === 0 ? (
            <p className="muted small">Nenhum produto abaixo do mínimo.</p>
          ) : (
            <table className="table">
              <tbody>
                {data.estoqueBaixo.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/produtos/${p.id}`}>{p.nome}</Link>
                      <div className="muted small">{p.sku}</div>
                    </td>
                    <td className="num">
                      {p.estoque_atual} / mín. {p.estoque_minimo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
      <Card
        title="Documentos recentes"
        icon="bi-clock-history"
        className="mt"
        actions={
          <Link to="/notas" className="small">
            Ver todos
          </Link>
        }
      >
        {vazio ? (
          <p className="muted small">Nenhum documento ainda.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <tbody>
                {data.notasRecentes.map((n) => (
                  <tr key={n.id}>
                    <td>
                      <Link to={`/notas/${n.id}`}>
                        {n.tipo} {numeroNota(n.numero)}
                      </Link>
                    </td>
                    <td>{n.cliente_nome}</td>
                    <td>{dataBR(n.data_emissao ?? n.criado_em)}</td>
                    <td>
                      <StatusNota s={n.status} />
                    </td>
                    <td className="num">{formatBRL(n.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
