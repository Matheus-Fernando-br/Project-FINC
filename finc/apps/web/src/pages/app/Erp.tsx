import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FORMAS_PAGAMENTO, calcularTotais } from "@finc/shared";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ApiError, api, qs } from "../../api/client";
import type { Nota, Pagina, Registro } from "../../api/types";
import {
  Alert,
  Badge,
  Button,
  Card,
  Empty,
  ErrorBox,
  Field,
  Loading,
  PageHeader,
  useConfirm,
  useToast,
} from "../../components/ui";
import { dataBR, formatBRL, hojeISO, numeroNota } from "../../format";
import { useApi } from "../../hooks/useApi";

const num = (v: string) => Number(String(v).replace(",", ".")) || 0;

/* ======================= Editor de itens (compras e orçamentos) ======================= */

interface LinhaItem {
  ref: string;
  quantidade: string;
  valor: string;
}

interface OpcaoItem {
  ref: string;
  nome: string;
  preco: number;
}

function EditorItens({
  linhas,
  setLinhas,
  opcoes,
  rotuloValor,
  editavel,
}: {
  linhas: LinhaItem[];
  setLinhas: (l: LinhaItem[]) => void;
  opcoes: OpcaoItem[];
  rotuloValor: string;
  editavel: boolean;
}) {
  const set = (i: number, patch: Partial<LinhaItem>) =>
    setLinhas(linhas.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  return (
    <div className="stack">
      {linhas.map((l, i) => {
        const o = opcoes.find((x) => x.ref === l.ref);
        const sub = num(l.quantidade) * (l.valor === "" ? (o?.preco ?? 0) : num(l.valor));
        return (
          <div
            key={i}
            className="item-row"
            style={{ gridTemplateColumns: "2.4fr 0.8fr 1fr 1fr auto" }}
          >
            <Field label={`Item ${i + 1}`} htmlFor={`it-${i}`}>
              <select
                id={`it-${i}`}
                disabled={!editavel}
                value={l.ref}
                onChange={(e) => set(i, { ref: e.target.value })}
              >
                <option value="">Selecione</option>
                {opcoes.map((x) => (
                  <option key={x.ref} value={x.ref}>
                    {x.nome}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Qtd." htmlFor={`qt-${i}`}>
              <input
                id={`qt-${i}`}
                inputMode="decimal"
                disabled={!editavel}
                value={l.quantidade}
                onChange={(e) => set(i, { quantidade: e.target.value })}
              />
            </Field>
            <Field label={rotuloValor} htmlFor={`vl-${i}`}>
              <input
                id={`vl-${i}`}
                inputMode="decimal"
                disabled={!editavel}
                placeholder={o ? String(o.preco) : ""}
                value={l.valor}
                onChange={(e) => set(i, { valor: e.target.value })}
              />
            </Field>
            <Field label="Subtotal">
              <input value={formatBRL(sub)} readOnly tabIndex={-1} />
            </Field>
            <Button
              variant="ghost"
              icon="bi-trash"
              aria-label={`Remover item ${i + 1}`}
              disabled={!editavel || linhas.length === 1}
              onClick={() => setLinhas(linhas.filter((_, j) => j !== i))}
            />
          </div>
        );
      })}
      {editavel && (
        <div>
          <Button
            size="sm"
            variant="secondary"
            icon="bi-plus"
            onClick={() => setLinhas([...linhas, { ref: "", quantidade: "1", valor: "" }])}
          >
            Adicionar item
          </Button>
        </div>
      )}
    </div>
  );
}

function somaLinhas(linhas: LinhaItem[], opcoes: OpcaoItem[]) {
  return linhas.reduce((s, l) => {
    const o = opcoes.find((x) => x.ref === l.ref);
    return s + num(l.quantidade) * (l.valor === "" ? (o?.preco ?? 0) : num(l.valor));
  }, 0);
}

/* ======================= Pedidos de compra ======================= */

interface Compra {
  id: string;
  numero: number;
  status: "aberta" | "recebida" | "cancelada";
  data_compra: string;
  previsao: string | null;
  total: number;
  frete: number;
  desconto: number;
  fornecedor_id: string | null;
  fornecedor_nome: string | null;
  observacoes: string | null;
  itens?: {
    produto_id: string | null;
    quantidade: number;
    custo_unitario: number;
    descricao: string;
  }[];
}

const StatusCompra = ({ s }: { s: Compra["status"] }) =>
  s === "aberta" ? (
    <Badge tone="info">Aberta</Badge>
  ) : s === "recebida" ? (
    <Badge tone="success">Recebida</Badge>
  ) : (
    <Badge>Cancelada</Badge>
  );

export function ComprasLista() {
  const [status, setStatus] = useState("");
  const navigate = useNavigate();
  const { data, error, loading, reload } = useApi(
    () => api.get<Compra[]>(`/compras${qs({ status })}`),
    [status],
  );
  return (
    <>
      <PageHeader
        title="Pedidos de compra"
        sub="Registre compras de fornecedores. No recebimento, o estoque é atualizado e a conta a pagar é lançada."
        actions={
          <Link to="/compras/nova" className="btn">
            <i className="bi bi-plus-lg" /> Nova compra
          </Link>
        }
      />
      <div className="toolbar">
        <div className="segmented" role="group" aria-label="Filtrar por status">
          {[
            ["", "Todas"],
            ["aberta", "Abertas"],
            ["recebida", "Recebidas"],
            ["cancelada", "Canceladas"],
          ].map(([v, l]) => (
            <button key={v} className={status === v ? "active" : ""} onClick={() => setStatus(v!)}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <ErrorBox error={error} onRetry={reload} />
      {loading && !data ? (
        <Loading />
      ) : data?.length === 0 ? (
        <Card>
          <Empty icon="bi-bag-check">Nenhum pedido de compra.</Empty>
        </Card>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Fornecedor</th>
                <th>Data</th>
                <th>Previsão</th>
                <th className="num">Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((c) => (
                <tr key={c.id} className="clickable" onClick={() => navigate(`/compras/${c.id}`)}>
                  <td>
                    <strong>{c.numero}</strong>
                  </td>
                  <td>{c.fornecedor_nome ?? "—"}</td>
                  <td>{dataBR(c.data_compra)}</td>
                  <td>{dataBR(c.previsao)}</td>
                  <td className="num">{formatBRL(c.total)}</td>
                  <td>
                    <StatusCompra s={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function CompraForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { confirmar, dialog } = useConfirm();
  const cat = useApi(async () => {
    const [f, p] = await Promise.all([
      api.get<Pagina<Registro>>("/fornecedores?pageSize=200"),
      api.get<Pagina<Registro>>("/produtos?pageSize=200"),
    ]);
    const compra = id ? await api.get<Compra>(`/compras/${id}`) : null;
    return { fornecedores: f.items, produtos: p.items, compra };
  }, [id]);
  const [form, setForm] = useState<{
    fornecedor_id: string;
    previsao: string;
    frete: string;
    desconto: string;
    observacoes: string;
    itens: LinhaItem[];
  } | null>(null);
  const [erro, setErro] = useState<Error | null>(null);
  const [ocupado, setOcupado] = useState("");
  const [vencimento, setVencimento] = useState("");

  if (cat.loading && !cat.data) return <Loading />;
  if (cat.error) return <ErrorBox error={cat.error} onRetry={cat.reload} />;
  if (!cat.data) return null;
  const c = cat.data.compra;
  const editavel = !c || c.status === "aberta";
  const atual = form ?? {
    fornecedor_id: c?.fornecedor_id ?? "",
    previsao: c?.previsao ?? "",
    frete: c ? String(c.frete || "") : "",
    desconto: c ? String(c.desconto || "") : "",
    observacoes: c?.observacoes ?? "",
    itens: c?.itens?.map((i) => ({
      ref: i.produto_id ?? "",
      quantidade: String(i.quantidade),
      valor: String(i.custo_unitario),
    })) ?? [{ ref: "", quantidade: "1", valor: "" }],
  };
  const opcoes = cat.data.produtos.map((p) => ({
    ref: String(p.id),
    nome: `${p.nome} (${p.sku})`,
    preco: 0,
  }));
  const total = Math.max(
    0,
    somaLinhas(atual.itens, opcoes) + num(atual.frete) - num(atual.desconto),
  );
  const set = (patch: Partial<typeof atual>) => setForm({ ...atual, ...patch });

  const exec = async (nome: string, fn: () => Promise<void>) => {
    setOcupado(nome);
    setErro(null);
    try {
      await fn();
    } catch (e) {
      setErro(e as Error);
    } finally {
      setOcupado("");
    }
  };
  const salvar = () =>
    exec("salvar", async () => {
      const body = {
        fornecedor_id: atual.fornecedor_id,
        previsao: atual.previsao,
        frete: atual.frete,
        desconto: atual.desconto,
        observacoes: atual.observacoes,
        itens: atual.itens
          .filter((i) => i.ref)
          .map((i) => ({
            produto_id: i.ref,
            quantidade: i.quantidade,
            custo_unitario: i.valor || "0",
          })),
      };
      const r = id
        ? await api.put<Compra>(`/compras/${id}`, body)
        : await api.post<Compra>("/compras", body);
      toast.sucesso("Pedido de compra salvo.");
      setForm(null);
      navigate(`/compras/${r.id}`, { replace: true });
      void cat.reload();
    });
  const receber = async () => {
    if (
      !(await confirmar(
        "Receber compra",
        "O estoque dos produtos será atualizado e a conta a pagar será lançada no financeiro.",
        false,
      ))
    )
      return;
    await exec("receber", async () => {
      await api.post(`/compras/${id}/receber`, { vencimento });
      toast.sucesso("Compra recebida: estoque e financeiro atualizados.");
      void cat.reload();
    });
  };
  const cancelar = async () => {
    if (!(await confirmar("Cancelar compra", "O pedido de compra será cancelado."))) return;
    await exec("cancelar", async () => {
      await api.post(`/compras/${id}/cancelar`);
      toast.sucesso("Compra cancelada.");
      void cat.reload();
    });
  };

  return (
    <>
      <PageHeader
        title={c ? `Compra nº ${c.numero}` : "Nova compra"}
        sub={c && <StatusCompra s={c.status} />}
        actions={
          <Link to="/compras" className="btn secondary">
            <i className="bi bi-arrow-left" /> Voltar
          </Link>
        }
      />
      <ErrorBox error={erro} />
      {cat.data.fornecedores.length === 0 && (
        <Alert tone="warning">
          Cadastre um <Link to="/fornecedores/novo">fornecedor</Link> antes de lançar compras.
        </Alert>
      )}
      <Card title="Fornecedor e itens" icon="bi-bag-check" className="mt">
        <div className="form-grid">
          <Field label="Fornecedor" required className="c8" htmlFor="fornecedor_id">
            <select
              id="fornecedor_id"
              disabled={!editavel}
              value={atual.fornecedor_id}
              onChange={(e) => set({ fornecedor_id: e.target.value })}
            >
              <option value="">Selecione</option>
              {cat.data.fornecedores.map((f) => (
                <option key={f.id} value={f.id}>
                  {String(f.nome_social)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Previsão de entrega" className="c4" htmlFor="previsao">
            <input
              id="previsao"
              type="date"
              disabled={!editavel}
              value={atual.previsao}
              onChange={(e) => set({ previsao: e.target.value })}
            />
          </Field>
        </div>
        <div className="mt">
          <EditorItens
            linhas={atual.itens}
            setLinhas={(itens) => set({ itens })}
            opcoes={opcoes}
            rotuloValor="Custo unit."
            editavel={editavel}
          />
        </div>
        <div className="form-grid mt">
          <Field label="Frete (R$)" className="c3" htmlFor="frete">
            <input
              id="frete"
              inputMode="decimal"
              disabled={!editavel}
              value={atual.frete}
              onChange={(e) => set({ frete: e.target.value })}
            />
          </Field>
          <Field label="Desconto (R$)" className="c3" htmlFor="desconto">
            <input
              id="desconto"
              inputMode="decimal"
              disabled={!editavel}
              value={atual.desconto}
              onChange={(e) => set({ desconto: e.target.value })}
            />
          </Field>
          <Field label="Observações" className="c6" htmlFor="obs">
            <input
              id="obs"
              disabled={!editavel}
              value={atual.observacoes}
              onChange={(e) => set({ observacoes: e.target.value })}
            />
          </Field>
        </div>
        <div className="totais mt">
          <span className="total">Total</span>
          <span className="total right">{formatBRL(total)}</span>
        </div>
      </Card>
      {c?.status === "aberta" && (
        <Card title="Recebimento" icon="bi-box-arrow-in-down">
          <div className="form-grid">
            <Field
              label="Vencimento da conta a pagar"
              className="c4"
              hint="Padrão: 30 dias."
              htmlFor="venc"
            >
              <input
                id="venc"
                type="date"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
              />
            </Field>
          </div>
        </Card>
      )}
      <div className="form-actions">
        {c?.status === "aberta" && (
          <>
            <Button
              variant="danger"
              icon="bi-x-circle"
              loading={ocupado === "cancelar"}
              onClick={cancelar}
            >
              Cancelar
            </Button>
            <Button
              variant="secondary"
              icon="bi-box-arrow-in-down"
              loading={ocupado === "receber"}
              onClick={receber}
            >
              Receber compra
            </Button>
          </>
        )}
        {editavel && (
          <Button icon="bi-check-lg" loading={ocupado === "salvar"} onClick={salvar}>
            Salvar compra
          </Button>
        )}
      </div>
      {dialog}
    </>
  );
}

/* ======================= Orçamentos ======================= */

interface Orcamento {
  id: string;
  numero: number;
  status: "aberto" | "aprovado" | "recusado" | "convertido";
  data_orcamento: string;
  validade: string | null;
  total: number;
  desconto: number;
  cliente_id: string | null;
  cliente_nome: string | null;
  condicoes: string | null;
  observacoes: string | null;
  pedido_id: string | null;
  vencido?: boolean;
  itens?: {
    tipo: string;
    produto_id: string | null;
    servico_id: string | null;
    quantidade: number;
    valor_unitario: number;
  }[];
}

const StatusOrcamento = ({ o }: { o: Pick<Orcamento, "status" | "vencido"> }) =>
  o.status === "aberto" ? (
    o.vencido ? (
      <Badge tone="warning">Vencido</Badge>
    ) : (
      <Badge tone="info">Em aberto</Badge>
    )
  ) : o.status === "aprovado" ? (
    <Badge tone="success">Aprovado</Badge>
  ) : o.status === "convertido" ? (
    <Badge tone="success">Virou pedido</Badge>
  ) : (
    <Badge tone="danger">Recusado</Badge>
  );

export function OrcamentosLista() {
  const [status, setStatus] = useState("");
  const navigate = useNavigate();
  const { data, error, loading, reload } = useApi(
    () => api.get<Orcamento[]>(`/orcamentos${qs({ status })}`),
    [status],
  );
  return (
    <>
      <PageHeader
        title="Orçamentos"
        sub="Propostas comerciais. Aprovados viram pedido de venda com um clique."
        actions={
          <Link to="/orcamentos/novo" className="btn">
            <i className="bi bi-plus-lg" /> Novo orçamento
          </Link>
        }
      />
      <div className="toolbar">
        <div className="segmented" role="group" aria-label="Filtrar por status">
          {[
            ["", "Todos"],
            ["aberto", "Em aberto"],
            ["aprovado", "Aprovados"],
            ["convertido", "Convertidos"],
            ["recusado", "Recusados"],
          ].map(([v, l]) => (
            <button key={v} className={status === v ? "active" : ""} onClick={() => setStatus(v!)}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <ErrorBox error={error} onRetry={reload} />
      {loading && !data ? (
        <Loading />
      ) : data?.length === 0 ? (
        <Card>
          <Empty icon="bi-file-earmark-text">Nenhum orçamento.</Empty>
        </Card>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Cliente</th>
                <th>Data</th>
                <th>Validade</th>
                <th className="num">Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((o) => (
                <tr
                  key={o.id}
                  className="clickable"
                  onClick={() => navigate(`/orcamentos/${o.id}`)}
                >
                  <td>
                    <strong>{o.numero}</strong>
                  </td>
                  <td>{o.cliente_nome ?? "—"}</td>
                  <td>{dataBR(o.data_orcamento)}</td>
                  <td>{dataBR(o.validade)}</td>
                  <td className="num">{formatBRL(o.total)}</td>
                  <td>
                    <StatusOrcamento o={o} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function OrcamentoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const cat = useApi(async () => {
    const [c, p, s] = await Promise.all([
      api.get<Pagina<Registro>>("/clientes?pageSize=200"),
      api.get<Pagina<Registro>>("/produtos?pageSize=200"),
      api.get<Pagina<Registro>>("/servicos?pageSize=200"),
    ]);
    const orc = id ? await api.get<Orcamento>(`/orcamentos/${id}`) : null;
    return {
      clientes: c.items,
      produtos: p.items.filter((x) => x.ativo),
      servicos: s.items.filter((x) => x.ativo),
      orc,
    };
  }, [id]);
  const [form, setForm] = useState<{
    cliente_id: string;
    validade: string;
    desconto: string;
    condicoes: string;
    observacoes: string;
    itens: LinhaItem[];
  } | null>(null);
  const [erro, setErro] = useState<Error | null>(null);
  const [ocupado, setOcupado] = useState("");

  if (cat.loading && !cat.data) return <Loading />;
  if (cat.error) return <ErrorBox error={cat.error} onRetry={cat.reload} />;
  if (!cat.data) return null;
  const o = cat.data.orc;
  const editavel = !o || o.status === "aberto";
  const atual = form ?? {
    cliente_id: o?.cliente_id ?? "",
    validade: o?.validade ?? "",
    desconto: o ? String(o.desconto || "") : "",
    condicoes: o?.condicoes ?? "",
    observacoes: o?.observacoes ?? "",
    itens: o?.itens?.map((i) => ({
      ref: i.produto_id ? `p:${i.produto_id}` : `s:${i.servico_id}`,
      quantidade: String(i.quantidade),
      valor: String(i.valor_unitario),
    })) ?? [{ ref: "", quantidade: "1", valor: "" }],
  };
  const opcoes: OpcaoItem[] = [
    ...cat.data.produtos.map((p) => ({
      ref: `p:${p.id}`,
      nome: `Produto · ${p.nome}`,
      preco: Number(p.preco_unitario),
    })),
    ...cat.data.servicos.map((s) => ({
      ref: `s:${s.id}`,
      nome: `Serviço · ${s.nome}`,
      preco: Number(s.preco),
    })),
  ];
  const total = Math.max(0, somaLinhas(atual.itens, opcoes) - num(atual.desconto));
  const set = (patch: Partial<typeof atual>) => setForm({ ...atual, ...patch });

  const exec = async (nome: string, fn: () => Promise<void>) => {
    setOcupado(nome);
    setErro(null);
    try {
      await fn();
    } catch (e) {
      setErro(e as Error);
    } finally {
      setOcupado("");
    }
  };
  const salvar = () =>
    exec("salvar", async () => {
      const body = {
        cliente_id: atual.cliente_id,
        validade: atual.validade,
        desconto: atual.desconto,
        condicoes: atual.condicoes,
        observacoes: atual.observacoes,
        itens: atual.itens
          .filter((i) => i.ref)
          .map((i) => ({
            [i.ref.startsWith("p:") ? "produto_id" : "servico_id"]: i.ref.slice(2),
            quantidade: i.quantidade,
            ...(i.valor ? { valor_unitario: i.valor } : {}),
          })),
      };
      const r = id
        ? await api.put<Orcamento>(`/orcamentos/${id}`, body)
        : await api.post<Orcamento>("/orcamentos", body);
      toast.sucesso("Orçamento salvo.");
      setForm(null);
      navigate(`/orcamentos/${r.id}`, { replace: true });
      void cat.reload();
    });
  const acao = (a: "aprovar" | "recusar" | "reabrir") =>
    exec(a, async () => {
      await api.post(`/orcamentos/${id}/${a}`);
      void cat.reload();
    });
  const converter = () =>
    exec("converter", async () => {
      const r = await api.post<{ pedido_id: string }>(`/orcamentos/${id}/converter`);
      toast.sucesso("Pedido de venda criado a partir do orçamento.");
      navigate(`/pedidos/${r.pedido_id}`);
    });

  return (
    <>
      <PageHeader
        title={o ? `Orçamento nº ${o.numero}` : "Novo orçamento"}
        sub={o && <StatusOrcamento o={o} />}
        actions={
          <>
            <Link to="/orcamentos" className="btn secondary">
              <i className="bi bi-arrow-left" /> Voltar
            </Link>
            {o && (
              <Button variant="secondary" icon="bi-printer" onClick={() => window.print()}>
                Imprimir
              </Button>
            )}
          </>
        }
      />
      <ErrorBox error={erro} />
      {o?.pedido_id && (
        <Alert tone="success">
          Este orçamento virou o <Link to={`/pedidos/${o.pedido_id}`}>pedido de venda</Link>.
        </Alert>
      )}
      <Card title="Cliente e itens" icon="bi-file-earmark-text" className="mt">
        <div className="form-grid">
          <Field label="Cliente" required className="c8" htmlFor="cliente_id">
            <select
              id="cliente_id"
              disabled={!editavel}
              value={atual.cliente_id}
              onChange={(e) => set({ cliente_id: e.target.value })}
            >
              <option value="">Selecione</option>
              {cat.data.clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {String(c.nome_social)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Válido até" className="c4" htmlFor="validade">
            <input
              id="validade"
              type="date"
              disabled={!editavel}
              value={atual.validade}
              onChange={(e) => set({ validade: e.target.value })}
            />
          </Field>
        </div>
        <div className="mt">
          <EditorItens
            linhas={atual.itens}
            setLinhas={(itens) => set({ itens })}
            opcoes={opcoes}
            rotuloValor="Valor unit."
            editavel={editavel}
          />
        </div>
        <div className="form-grid mt">
          <Field label="Desconto (R$)" className="c3" htmlFor="desc">
            <input
              id="desc"
              inputMode="decimal"
              disabled={!editavel}
              value={atual.desconto}
              onChange={(e) => set({ desconto: e.target.value })}
            />
          </Field>
          <Field label="Condições de pagamento" className="c9" htmlFor="cond">
            <input
              id="cond"
              disabled={!editavel}
              placeholder="Ex.: 50% na aprovação, 50% na entrega"
              value={atual.condicoes}
              onChange={(e) => set({ condicoes: e.target.value })}
            />
          </Field>
          <Field label="Observações" htmlFor="obs">
            <textarea
              id="obs"
              disabled={!editavel}
              value={atual.observacoes}
              onChange={(e) => set({ observacoes: e.target.value })}
            />
          </Field>
        </div>
        <div className="totais mt">
          <span className="total">Total</span>
          <span className="total right">{formatBRL(total)}</span>
        </div>
      </Card>
      <div className="form-actions">
        {o?.status === "aberto" && (
          <>
            <Button
              variant="secondary"
              loading={ocupado === "recusar"}
              onClick={() => acao("recusar")}
            >
              Recusar
            </Button>
            <Button
              variant="secondary"
              loading={ocupado === "aprovar"}
              onClick={() => acao("aprovar")}
            >
              Aprovar
            </Button>
          </>
        )}
        {(o?.status === "aprovado" || o?.status === "recusado") && (
          <Button
            variant="secondary"
            loading={ocupado === "reabrir"}
            onClick={() => acao("reabrir")}
          >
            Reabrir
          </Button>
        )}
        {(o?.status === "aberto" || o?.status === "aprovado") && (
          <Button
            variant="secondary"
            icon="bi-cart-check"
            loading={ocupado === "converter"}
            onClick={converter}
          >
            Gerar pedido de venda
          </Button>
        )}
        {editavel && (
          <Button icon="bi-check-lg" loading={ocupado === "salvar"} onClick={salvar}>
            Salvar orçamento
          </Button>
        )}
      </div>
    </>
  );
}

/* ======================= Frente de caixa (PDV) ======================= */

interface ItemCarrinho {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  icms: number;
  pis_cofins: number;
  estoque: number | null;
}

export function Pdv() {
  const toast = useToast();
  const produtos = useApi(() => api.get<Pagina<Registro>>("/produtos?pageSize=200"), []);
  const clientes = useApi(() => api.get<Pagina<Registro>>("/clientes?pageSize=200"), []);
  const cfg = useApi(() => api.get<{ somar_impostos: boolean }>("/config/fiscal"), []);
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [pagamento, setPagamento] = useState<string>("PIX");
  const [recebido, setRecebido] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<ApiError | Error | null>(null);
  const [ultima, setUltima] = useState<Nota | null>(null);

  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return (produtos.data?.items ?? [])
      .filter((p) => p.ativo)
      .filter(
        (p) =>
          !t || String(p.nome).toLowerCase().includes(t) || String(p.sku).toLowerCase().includes(t),
      );
  }, [produtos.data, busca]);

  const totais = calcularTotais(
    carrinho.map((i) => ({
      tipo: "produto" as const,
      quantidade: i.quantidade,
      valorUnitario: i.preco,
      icms: i.icms,
      pisCofins: i.pis_cofins,
    })),
    0,
    0,
    cfg.data?.somar_impostos ?? true,
  );
  const troco = pagamento === "Dinheiro" && recebido ? num(recebido) - totais.totalNota : null;

  const adicionar = (p: Registro) => {
    setUltima(null);
    setCarrinho((c) => {
      const existe = c.find((i) => i.id === p.id);
      if (existe) return c.map((i) => (i.id === p.id ? { ...i, quantidade: i.quantidade + 1 } : i));
      return [
        ...c,
        {
          id: p.id,
          nome: String(p.nome),
          preco: Number(p.preco_unitario),
          quantidade: 1,
          icms: Number(p.icms),
          pis_cofins: Number(p.pis_cofins),
          estoque: p.controla_estoque ? Number(p.estoque_atual) : null,
        },
      ];
    });
  };
  const alterarQtd = (id: string, delta: number) =>
    setCarrinho((c) =>
      c
        .map((i) => (i.id === id ? { ...i, quantidade: Math.max(0, i.quantidade + delta) } : i))
        .filter((i) => i.quantidade > 0),
    );

  const finalizar = async () => {
    setEnviando(true);
    setErro(null);
    try {
      const n = await api.post<Nota>("/notas", {
        tipo: "NFC-e",
        cliente_id: clienteId || null,
        itens: carrinho.map((i) => ({ produto_id: i.id, quantidade: i.quantidade })),
        forma_pagamento: pagamento,
        natureza_operacao: "Venda ao consumidor",
        emitir: true,
      });
      setUltima(n);
      setCarrinho([]);
      setRecebido("");
      setClienteId("");
      toast.sucesso(`Venda concluída — NFC-e nº ${n.numero}.`);
      void produtos.reload();
    } catch (e) {
      setErro(e as Error);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Frente de caixa"
        sub="Venda rápida ao consumidor com emissão de NFC-e e recebimento no ato."
      />
      <div className="pdv">
        <Card>
          <div className="toolbar">
            <div className="search">
              <i className="bi bi-search" aria-hidden />
              <input
                className="input"
                placeholder="Buscar produto por nome ou SKU"
                aria-label="Buscar produto"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>
          {produtos.loading && !produtos.data ? (
            <Loading />
          ) : lista.length === 0 ? (
            <Empty icon="bi-box-seam">
              Nenhum produto ativo. <Link to="/produtos/novo">Cadastrar produto</Link>
            </Empty>
          ) : (
            <div className="pdv-produtos">
              {lista.map((p) => {
                const semEstoque = Boolean(p.controla_estoque) && Number(p.estoque_atual) <= 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className="pdv-produto"
                    disabled={semEstoque}
                    onClick={() => adicionar(p)}
                    aria-label={`Adicionar ${p.nome}`}
                  >
                    <strong>{String(p.nome)}</strong>
                    <span className="muted small">{String(p.sku)}</span>
                    <span className="preco">{formatBRL(p.preco_unitario)}</span>
                    {Boolean(p.controla_estoque) && (
                      <span className="muted small">
                        {semEstoque ? "Sem estoque" : `Estoque: ${p.estoque_atual}`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </Card>
        <Card title="Venda atual" icon="bi-cart3">
          <ErrorBox error={erro} />
          {ultima && (
            <Alert tone="success">
              NFC-e nº {numeroNota(ultima.numero)} emitida.{" "}
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => api.abrir(`/notas/${ultima.id}/pdf`)}
              >
                Ver cupom (PDF)
              </button>
            </Alert>
          )}
          {carrinho.length === 0 ? (
            <p className="muted small">Toque nos produtos para adicionar.</p>
          ) : (
            <div className="stack">
              {carrinho.map((i) => (
                <div
                  key={i.id}
                  className="row"
                  style={{
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong className="small">{i.nome}</strong>
                    <div className="muted small">
                      {formatBRL(i.preco)} × {i.quantidade}
                      {i.estoque !== null && i.quantidade > i.estoque ? (
                        <span style={{ color: "var(--danger)" }}> · acima do estoque</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="row" style={{ gap: 4 }}>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon="bi-dash"
                      aria-label={`Diminuir ${i.nome}`}
                      onClick={() => alterarQtd(i.id, -1)}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      icon="bi-plus"
                      aria-label={`Aumentar ${i.nome}`}
                      onClick={() => alterarQtd(i.id, 1)}
                    />
                  </div>
                  <strong style={{ width: 96, textAlign: "right" }}>
                    {formatBRL(i.preco * i.quantidade)}
                  </strong>
                </div>
              ))}
            </div>
          )}
          <div className="mt">
            <div className="muted small">Total</div>
            <div className="pdv-total">{formatBRL(totais.totalNota)}</div>
            {totais.valorTributos > 0 && (
              <div className="muted small">
                Tributos aproximados: {formatBRL(totais.valorTributos)}
              </div>
            )}
          </div>
          <div className="form-grid mt">
            <Field label="Cliente (opcional)" htmlFor="pdv-cliente">
              <select
                id="pdv-cliente"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
              >
                <option value="">Consumidor final</option>
                {clientes.data?.items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {String(c.nome_social)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Forma de pagamento" className="c6" htmlFor="pdv-pag">
              <select id="pdv-pag" value={pagamento} onChange={(e) => setPagamento(e.target.value)}>
                {FORMAS_PAGAMENTO.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </Field>
            {pagamento === "Dinheiro" && (
              <Field
                label="Valor recebido"
                className="c6"
                hint={
                  troco !== null
                    ? troco >= 0
                      ? `Troco: ${formatBRL(troco)}`
                      : `Faltam ${formatBRL(-troco)}`
                    : undefined
                }
                htmlFor="pdv-rec"
              >
                <input
                  id="pdv-rec"
                  inputMode="decimal"
                  value={recebido}
                  onChange={(e) => setRecebido(e.target.value)}
                />
              </Field>
            )}
          </div>
          <div className="row mt">
            <Button
              variant="secondary"
              disabled={carrinho.length === 0}
              onClick={() => setCarrinho([])}
            >
              Limpar
            </Button>
            <Button
              size="lg"
              style={{ flex: 1 }}
              icon="bi-check2-circle"
              loading={enviando}
              disabled={carrinho.length === 0 || (troco !== null && troco < 0)}
              onClick={finalizar}
            >
              Finalizar venda
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}

/* ======================= Relatórios ======================= */

const RELATORIOS = [
  { id: "vendas", label: "Vendas" },
  { id: "dre", label: "DRE" },
  { id: "fluxo", label: "Fluxo de caixa" },
  { id: "estoque", label: "Estoque" },
] as const;

type IdRel = (typeof RELATORIOS)[number]["id"];

function inicioMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString("en-CA");
}

export function Relatorios() {
  const [params, setParams] = useSearchParams();
  const rel = (RELATORIOS.find((r) => r.id === params.get("r"))?.id ?? "vendas") as IdRel;
  const [de, setDe] = useState(inicioMes());
  const [ate, setAte] = useState(hojeISO());
  const [agrupar, setAgrupar] = useState("dia");
  const toast = useToast();
  const caminho =
    rel === "vendas"
      ? `/relatorios/vendas${qs({ de, ate, agrupar })}`
      : rel === "dre"
        ? `/relatorios/dre${qs({ de, ate })}`
        : rel === "fluxo"
          ? `/relatorios/fluxo-caixa${qs({ de, ate })}`
          : "/relatorios/estoque";
  const { data, error, loading, reload } = useApi(
    () => api.get<Record<string, unknown> & { linhas: Record<string, unknown>[] }>(caminho),
    [caminho],
  );
  const linhas = data?.linhas ?? [];
  const exportar = () =>
    api
      .download(`${caminho}${caminho.includes("?") ? "&" : "?"}formato=csv`, `relatorio-${rel}.csv`)
      .catch(toast.erro);

  return (
    <>
      <PageHeader
        title="Relatórios"
        sub="Análises calculadas com os seus documentos e lançamentos."
        actions={
          <>
            <Button variant="secondary" icon="bi-download" onClick={exportar}>
              Exportar CSV
            </Button>
            <Button variant="secondary" icon="bi-printer" onClick={() => window.print()}>
              Imprimir
            </Button>
          </>
        }
      />
      <div className="toolbar">
        <div className="segmented" role="tablist" aria-label="Relatório">
          {RELATORIOS.map((r) => (
            <button
              key={r.id}
              role="tab"
              aria-selected={rel === r.id}
              className={rel === r.id ? "active" : ""}
              onClick={() => setParams({ r: r.id }, { replace: true })}
            >
              {r.label}
            </button>
          ))}
        </div>
        {rel !== "estoque" && (
          <>
            <input
              className="input"
              type="date"
              aria-label="De"
              value={de}
              onChange={(e) => setDe(e.target.value)}
            />
            <input
              className="input"
              type="date"
              aria-label="Até"
              value={ate}
              onChange={(e) => setAte(e.target.value)}
            />
          </>
        )}
        {rel === "vendas" && (
          <select
            className="input"
            aria-label="Agrupar por"
            value={agrupar}
            onChange={(e) => setAgrupar(e.target.value)}
          >
            <option value="dia">Por dia</option>
            <option value="cliente">Por cliente</option>
            <option value="item">Por produto/serviço</option>
            <option value="tipo">Por tipo de nota</option>
          </select>
        )}
      </div>
      <ErrorBox error={error} onRetry={reload} />
      {loading && !data ? (
        <Loading />
      ) : data ? (
        <>
          <div className="grid grid-3">
            {rel === "vendas" && (
              <Card>
                <div className="kpi">
                  <span className="label">Total vendido</span>
                  <span className="value">{formatBRL(data.total)}</span>
                </div>
              </Card>
            )}
            {rel === "dre" && (
              <>
                <Card>
                  <div className="kpi">
                    <span className="label">Receitas recebidas</span>
                    <span className="value" style={{ color: "var(--success)" }}>
                      {formatBRL(data.receitas)}
                    </span>
                  </div>
                </Card>
                <Card>
                  <div className="kpi">
                    <span className="label">Despesas pagas</span>
                    <span className="value" style={{ color: "var(--danger)" }}>
                      {formatBRL(data.despesas)}
                    </span>
                  </div>
                </Card>
                <Card>
                  <div className="kpi">
                    <span className="label">Resultado</span>
                    <span className="value">{formatBRL(data.resultado)}</span>
                  </div>
                </Card>
              </>
            )}
            {rel === "fluxo" && (
              <Card>
                <div className="kpi">
                  <span className="label">Saldo acumulado no período</span>
                  <span className="value">{formatBRL(data.saldo_final)}</span>
                </div>
              </Card>
            )}
            {rel === "estoque" && (
              <Card>
                <div className="kpi">
                  <span className="label">Valor do estoque (preço de venda)</span>
                  <span className="value">{formatBRL(data.valor_total)}</span>
                </div>
              </Card>
            )}
          </div>
          {linhas.length === 0 ? (
            <Card className="mt">
              <Empty icon="bi-bar-chart">Sem dados no período.</Empty>
            </Card>
          ) : (
            <>
              {(rel === "vendas" && agrupar === "dia") || rel === "fluxo" ? (
                <Card className="mt">
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer>
                      {rel === "vendas" ? (
                        <BarChart data={linhas.map((l) => ({ ...l, total: Number(l.total) }))}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="var(--border)"
                          />
                          <XAxis
                            dataKey="grupo"
                            tick={{ fontSize: 11, fill: "var(--muted)" }}
                            tickFormatter={(v: string) => dataBR(v).slice(0, 5)}
                          />
                          <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} />
                          <Tooltip
                            formatter={(v) => formatBRL(v)}
                            labelFormatter={(v) => dataBR(String(v))}
                          />
                          <Bar dataKey="total" name="Vendas" fill="#16a34a" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      ) : (
                        <LineChart
                          data={linhas.map((l) => ({
                            ...l,
                            saldo_acumulado: Number(l.saldo_acumulado),
                          }))}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="var(--border)"
                          />
                          <XAxis
                            dataKey="dia"
                            tick={{ fontSize: 11, fill: "var(--muted)" }}
                            tickFormatter={(v: string) => dataBR(v).slice(0, 5)}
                          />
                          <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} />
                          <Tooltip
                            formatter={(v) => formatBRL(v)}
                            labelFormatter={(v) => dataBR(String(v))}
                          />
                          <Line
                            type="monotone"
                            dataKey="saldo_acumulado"
                            name="Saldo"
                            stroke="#16a34a"
                            strokeWidth={2.5}
                            dot={false}
                          />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </Card>
              ) : null}
              <div className="table-wrap mt">
                <table className="table">
                  <thead>
                    <tr>
                      {Object.keys(linhas[0]!).map((k) => (
                        <th key={k} className={typeof linhas[0]![k] === "number" ? "num" : ""}>
                          {ROTULOS[k] ?? k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((l, i) => (
                      <tr key={i}>
                        {Object.entries(l).map(([k, v]) => (
                          <td key={k} className={typeof v === "number" ? "num" : ""}>
                            {formatarCelula(k, v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      ) : null}
    </>
  );
}

const ROTULOS: Record<string, string> = {
  grupo: "Grupo",
  tipo: "Tipo",
  quantidade: "Quantidade",
  total: "Total",
  tributos: "Tributos",
  categoria: "Categoria",
  dia: "Dia",
  entradas_realizadas: "Entradas",
  saidas_realizadas: "Saídas",
  entradas_previstas: "A receber",
  saidas_previstas: "A pagar",
  saldo_acumulado: "Saldo acumulado",
  nome: "Produto",
  sku: "SKU",
  unidade_medida: "Unidade",
  estoque_atual: "Saldo",
  estoque_minimo: "Mínimo",
  preco_unitario: "Preço",
  valor_estoque: "Valor em estoque",
  abaixo_minimo: "Abaixo do mínimo",
};

const MONETARIOS = new Set([
  "total",
  "tributos",
  "entradas_realizadas",
  "saidas_realizadas",
  "entradas_previstas",
  "saidas_previstas",
  "saldo_acumulado",
  "preco_unitario",
  "valor_estoque",
]);

function formatarCelula(k: string, v: unknown) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? <Badge tone="warning">Sim</Badge> : "Não";
  if (MONETARIOS.has(k)) return formatBRL(v);
  if ((k === "dia" || k === "grupo") && typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v))
    return dataBR(v);
  return String(v);
}
