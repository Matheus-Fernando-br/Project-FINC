import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CATEGORIAS_FINANCEIRO, contaSchema, estoqueMovimentoSchema } from "@finc/shared";
import { api, qs } from "../../api/client";
import type { Pagina, Registro } from "../../api/types";
import {
  Alert,
  Badge,
  Button,
  Card,
  Empty,
  ErrorBox,
  Field,
  Loading,
  Modal,
  PageHeader,
  useConfirm,
  useToast,
} from "../../components/ui";
import { dataBR, dataHoraBR, formatBRL, hojeISO } from "../../format";
import { useApi } from "../../hooks/useApi";
import { useForm } from "../../hooks/useForm";

/* ======================= Estoque ======================= */

interface Movimento {
  id: string;
  produto_nome: string;
  sku: string;
  tipo: "entrada" | "saida" | "ajuste";
  quantidade: number;
  saldo_apos: number;
  motivo: string | null;
  nota_id: string | null;
  criado_em: string;
}

export function Estoque() {
  const toast = useToast();
  const produtos = useApi(() => api.get<Pagina<Registro>>("/produtos?pageSize=200"), []);
  const movs = useApi(() => api.get<Movimento[]>("/estoque/movimentos"), []);
  const [aberto, setAberto] = useState(false);
  const f = useForm({ produto_id: "", tipo: "entrada", quantidade: "", motivo: "" });
  const controlados = (produtos.data?.items ?? []).filter((p) => p.controla_estoque);

  const salvar = () => {
    if (!f.validar(estoqueMovimentoSchema)) return;
    void f.enviar(async () => {
      const r = await api.post<{ saldo: number }>("/estoque/movimentos", f.values);
      toast.sucesso(`Movimentação registrada. Novo saldo: ${r.saldo}`);
      setAberto(false);
      f.setValues({ produto_id: "", tipo: "entrada", quantidade: "", motivo: "" });
      void produtos.reload();
      void movs.reload();
    });
  };

  return (
    <>
      <PageHeader
        title="Estoque"
        icon="bi-boxes"
        sub="Saldo dos produtos com controle de estoque. Notas emitidas baixam o estoque automaticamente."
        actions={
          <Button
            icon="bi-arrow-left-right"
            disabled={controlados.length === 0}
            onClick={() => setAberto(true)}
          >
            Nova movimentação
          </Button>
        }
      />
      <ErrorBox error={produtos.error ?? movs.error} />
      {produtos.loading && !produtos.data ? (
        <Loading />
      ) : controlados.length === 0 ? (
        <Card>
          <Empty icon="bi-boxes">
            Nenhum produto com controle de estoque. Ative a opção “Controlar estoque” no{" "}
            <Link to="/produtos">cadastro do produto</Link>.
          </Empty>
        </Card>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>SKU</th>
                <th className="num">Saldo</th>
                <th className="num">Mínimo</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {controlados.map((p) => {
                const baixo =
                  p.estoque_minimo !== null && Number(p.estoque_atual) <= Number(p.estoque_minimo);
                return (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/produtos/${p.id}`}>{String(p.nome)}</Link>
                    </td>
                    <td>{String(p.sku)}</td>
                    <td className="num">
                      {String(p.estoque_atual)} {String(p.unidade_medida)}
                    </td>
                    <td className="num">
                      {p.estoque_minimo === null ? "—" : String(p.estoque_minimo)}
                    </td>
                    <td>
                      {baixo ? (
                        <Badge tone="warning">Abaixo do mínimo</Badge>
                      ) : (
                        <Badge tone="success">OK</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Card title="Últimas movimentações" icon="bi-clock-history" className="mt">
        {movs.data?.length === 0 ? (
          <p className="muted small">Nenhuma movimentação.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Produto</th>
                  <th>Tipo</th>
                  <th className="num">Quantidade</th>
                  <th className="num">Saldo após</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {movs.data?.map((m) => (
                  <tr key={m.id}>
                    <td>{dataHoraBR(m.criado_em)}</td>
                    <td>{m.produto_nome}</td>
                    <td>
                      {m.tipo === "entrada" ? (
                        <Badge tone="success">Entrada</Badge>
                      ) : m.tipo === "saida" ? (
                        <Badge tone="danger">Saída</Badge>
                      ) : (
                        <Badge tone="info">Ajuste</Badge>
                      )}
                    </td>
                    <td className="num">{m.quantidade}</td>
                    <td className="num">{m.saldo_apos}</td>
                    <td>
                      {m.motivo ?? "—"}{" "}
                      {m.nota_id && (
                        <Link to={`/notas/${m.nota_id}`} className="small">
                          (ver nota)
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Modal
        title="Nova movimentação de estoque"
        open={aberto}
        onClose={() => setAberto(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button loading={f.enviando} onClick={salvar}>
              Registrar
            </Button>
          </>
        }
      >
        <div className="stack">
          {f.erroGeral && <Alert tone="danger">{f.erroGeral}</Alert>}
          <Field label="Produto" required error={f.errors.produto_id} htmlFor="produto_id">
            <select {...f.bind("produto_id")}>
              <option value="">Selecione</option>
              {controlados.map((p) => (
                <option key={p.id} value={p.id}>
                  {String(p.nome)} (saldo {String(p.estoque_atual)})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tipo" required htmlFor="tipo">
            <select {...f.bind("tipo")}>
              <option value="entrada">Entrada (compra, devolução)</option>
              <option value="saida">Saída (perda, consumo)</option>
              <option value="ajuste">Ajuste (define o saldo exato)</option>
            </select>
          </Field>
          <Field
            label={f.values.tipo === "ajuste" ? "Novo saldo" : "Quantidade"}
            required
            error={f.errors.quantidade}
            htmlFor="quantidade"
          >
            <input {...f.bind("quantidade")} inputMode="decimal" />
          </Field>
          <Field label="Motivo" htmlFor="motivo">
            <input {...f.bind("motivo")} />
          </Field>
        </div>
      </Modal>
    </>
  );
}

/* ======================= Pedidos de venda ======================= */

interface Pedido {
  id: string;
  numero: number;
  status: "aberto" | "faturado" | "cancelado";
  data_pedido: string;
  total: number;
  nota_id: string | null;
  cliente_id: string | null;
  cliente_nome: string | null;
  desconto: number;
  observacoes: string | null;
  itens?: {
    tipo: string;
    produto_id: string | null;
    servico_id: string | null;
    descricao: string;
    quantidade: number;
    valor_unitario: number;
    subtotal: number;
  }[];
}

const StatusPedido = ({ s }: { s: Pedido["status"] }) =>
  s === "aberto" ? (
    <Badge tone="info">Aberto</Badge>
  ) : s === "faturado" ? (
    <Badge tone="success">Faturado</Badge>
  ) : (
    <Badge tone="danger">Cancelado</Badge>
  );

export function PedidosLista() {
  const [status, setStatus] = useState("");
  const navigate = useNavigate();
  const { data, error, loading, reload } = useApi(
    () => api.get<Pedido[]>(`/pedidos${qs({ status })}`),
    [status],
  );
  return (
    <>
      <PageHeader
        title="Pedidos de venda"
        icon="bi-cart3"
        sub="Registre o pedido e gere a nota fiscal quando faturar."
        actions={
          <Link to="/pedidos/novo" className="btn">
            <i className="bi bi-plus-lg" /> Novo pedido
          </Link>
        }
      />
      <div className="toolbar">
        <select
          className="input"
          style={{ width: "auto" }}
          aria-label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="aberto">Abertos</option>
          <option value="faturado">Faturados</option>
          <option value="cancelado">Cancelados</option>
        </select>
      </div>
      <ErrorBox error={error} onRetry={reload} />
      {loading && !data ? (
        <Loading />
      ) : data?.length === 0 ? (
        <Card>
          <Empty icon="bi-cart3">Nenhum pedido.</Empty>
        </Card>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Cliente</th>
                <th>Data</th>
                <th className="num">Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((p) => (
                <tr key={p.id} className="clickable" onClick={() => navigate(`/pedidos/${p.id}`)}>
                  <td>
                    <strong>{p.numero}</strong>
                  </td>
                  <td>{p.cliente_nome ?? "—"}</td>
                  <td>{dataBR(p.data_pedido)}</td>
                  <td className="num">{formatBRL(p.total)}</td>
                  <td>
                    <StatusPedido s={p.status} />
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

export function PedidoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { confirmar, dialog } = useConfirm();
  const cat = useApi(async () => {
    const [c, p, s] = await Promise.all([
      api.get<Pagina<Registro>>("/clientes?pageSize=200"),
      api.get<Pagina<Registro>>("/produtos?pageSize=200"),
      api.get<Pagina<Registro>>("/servicos?pageSize=200"),
    ]);
    const pedido = id ? await api.get<Pedido>(`/pedidos/${id}`) : null;
    return {
      clientes: c.items,
      produtos: p.items.filter((x) => x.ativo),
      servicos: s.items.filter((x) => x.ativo),
      pedido,
    };
  }, [id]);
  const [form, setForm] = useState<{
    cliente_id: string;
    desconto: string;
    observacoes: string;
    itens: { ref: string; quantidade: string; valor_unitario: string }[];
  } | null>(null);
  const [erro, setErro] = useState<Error | null>(null);
  const [ocupado, setOcupado] = useState("");
  const [tipoNota, setTipoNota] = useState("NF-e");

  if (cat.loading && !cat.data) return <Loading />;
  if (cat.error) return <ErrorBox error={cat.error} onRetry={cat.reload} />;
  if (!cat.data) return null;
  const ped = cat.data.pedido;
  const editavel = !ped || ped.status === "aberto";
  const atual = form ?? {
    cliente_id: ped?.cliente_id ?? "",
    desconto: ped ? String(ped.desconto || "") : "",
    observacoes: ped?.observacoes ?? "",
    itens: ped?.itens?.map((i) => ({
      ref: i.produto_id ? `p:${i.produto_id}` : `s:${i.servico_id}`,
      quantidade: String(i.quantidade),
      valor_unitario: String(i.valor_unitario),
    })) ?? [{ ref: "", quantidade: "1", valor_unitario: "" }],
  };
  const opcoes = [
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
  const set = (patch: Partial<typeof atual>) => setForm({ ...atual, ...patch });
  const total =
    atual.itens.reduce((s, i) => {
      const o = opcoes.find((x) => x.ref === i.ref);
      const v =
        i.valor_unitario === "" ? (o?.preco ?? 0) : Number(i.valor_unitario.replace(",", ".")) || 0;
      return s + (Number(i.quantidade.replace(",", ".")) || 0) * v;
    }, 0) - (Number(atual.desconto.replace(",", ".")) || 0);

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
        desconto: atual.desconto || 0,
        observacoes: atual.observacoes,
        itens: atual.itens
          .filter((i) => i.ref)
          .map((i) => ({
            [i.ref.startsWith("p:") ? "produto_id" : "servico_id"]: i.ref.slice(2),
            quantidade: i.quantidade,
            ...(i.valor_unitario ? { valor_unitario: i.valor_unitario } : {}),
          })),
      };
      const r = id
        ? await api.put<Pedido>(`/pedidos/${id}`, body)
        : await api.post<Pedido>("/pedidos", body);
      toast.sucesso("Pedido salvo.");
      setForm(null);
      navigate(`/pedidos/${r.id}`, { replace: true });
      void cat.reload();
    });
  const gerarNota = () =>
    exec("nota", async () => {
      const r = await api.post<{ nota_id: string }>(`/pedidos/${id}/gerar-nota`, {
        tipo: tipoNota,
      });
      toast.sucesso("Rascunho de nota gerado a partir do pedido.");
      navigate(`/notas/${r.nota_id}`);
    });
  const cancelar = async () => {
    if (!(await confirmar("Cancelar pedido", "O pedido será marcado como cancelado."))) return;
    await exec("cancelar", async () => {
      await api.post(`/pedidos/${id}/cancelar`);
      toast.sucesso("Pedido cancelado.");
      void cat.reload();
    });
  };

  return (
    <>
      <PageHeader
        title={ped ? `Pedido nº ${ped.numero}` : "Novo pedido"}
        icon="bi-cart3"
        sub={ped && <StatusPedido s={ped.status} />}
        actions={
          <Link to="/pedidos" className="btn secondary">
            <i className="bi bi-arrow-left" /> Voltar
          </Link>
        }
      />
      <ErrorBox error={erro} />
      {ped?.nota_id && (
        <Alert tone="success">
          Pedido faturado. <Link to={`/notas/${ped.nota_id}`}>Ver documento fiscal</Link>
        </Alert>
      )}
      <Card title="Cliente e itens" icon="bi-list-ul" className="mt">
        <div className="stack">
          <Field label="Cliente" required htmlFor="cliente_id">
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
          {atual.itens.map((i, idx) => (
            <div
              key={idx}
              className="item-row"
              style={{ gridTemplateColumns: "2.5fr 1fr 1fr auto" }}
            >
              <Field label={`Item ${idx + 1}`} htmlFor={`ped-item-${idx}`}>
                <select
                  id={`ped-item-${idx}`}
                  disabled={!editavel}
                  value={i.ref}
                  onChange={(e) =>
                    set({
                      itens: atual.itens.map((x, j) =>
                        j === idx ? { ...x, ref: e.target.value } : x,
                      ),
                    })
                  }
                >
                  <option value="">Selecione</option>
                  {opcoes.map((o) => (
                    <option key={o.ref} value={o.ref}>
                      {o.nome}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Qtd." htmlFor={`ped-qtd-${idx}`}>
                <input
                  id={`ped-qtd-${idx}`}
                  disabled={!editavel}
                  value={i.quantidade}
                  onChange={(e) =>
                    set({
                      itens: atual.itens.map((x, j) =>
                        j === idx ? { ...x, quantidade: e.target.value } : x,
                      ),
                    })
                  }
                />
              </Field>
              <Field label="Valor unit." htmlFor={`ped-v-${idx}`}>
                <input
                  id={`ped-v-${idx}`}
                  disabled={!editavel}
                  placeholder={String(opcoes.find((o) => o.ref === i.ref)?.preco ?? "")}
                  value={i.valor_unitario}
                  onChange={(e) =>
                    set({
                      itens: atual.itens.map((x, j) =>
                        j === idx ? { ...x, valor_unitario: e.target.value } : x,
                      ),
                    })
                  }
                />
              </Field>
              <Button
                variant="ghost"
                icon="bi-trash"
                aria-label="Remover item"
                disabled={!editavel || atual.itens.length === 1}
                onClick={() => set({ itens: atual.itens.filter((_, j) => j !== idx) })}
              />
            </div>
          ))}
          {editavel && (
            <div>
              <Button
                size="sm"
                variant="secondary"
                icon="bi-plus"
                onClick={() =>
                  set({ itens: [...atual.itens, { ref: "", quantidade: "1", valor_unitario: "" }] })
                }
              >
                Adicionar item
              </Button>
            </div>
          )}
          <div className="form-grid">
            <Field label="Desconto (R$)" className="c4" htmlFor="ped-desc">
              <input
                id="ped-desc"
                disabled={!editavel}
                value={atual.desconto}
                onChange={(e) => set({ desconto: e.target.value })}
              />
            </Field>
            <Field label="Observações" className="c8" htmlFor="ped-obs">
              <input
                id="ped-obs"
                disabled={!editavel}
                value={atual.observacoes}
                onChange={(e) => set({ observacoes: e.target.value })}
              />
            </Field>
          </div>
          <div className="totais">
            <span className="total">Total</span>
            <span className="total right">{formatBRL(Math.max(0, total))}</span>
          </div>
        </div>
      </Card>
      <div className="form-actions">
        {ped?.status === "aberto" && (
          <>
            <Button
              variant="danger"
              icon="bi-x-circle"
              loading={ocupado === "cancelar"}
              onClick={cancelar}
            >
              Cancelar pedido
            </Button>
            <select
              className="input"
              style={{ width: "auto" }}
              aria-label="Tipo de nota"
              value={tipoNota}
              onChange={(e) => setTipoNota(e.target.value)}
            >
              <option value="NF-e">NF-e</option>
              <option value="NFC-e">NFC-e</option>
              <option value="NFS-e">NFS-e</option>
            </select>
            <Button
              variant="secondary"
              icon="bi-receipt"
              loading={ocupado === "nota"}
              onClick={gerarNota}
            >
              Gerar nota
            </Button>
          </>
        )}
        {editavel && (
          <Button icon="bi-check-lg" loading={ocupado === "salvar"} onClick={salvar}>
            Salvar pedido
          </Button>
        )}
      </div>
      {dialog}
    </>
  );
}

/* ======================= Financeiro ======================= */

interface Conta {
  id: string;
  tipo: "receber" | "pagar";
  descricao: string;
  valor: number;
  vencimento: string;
  status: "aberta" | "paga" | "cancelada";
  data_pagamento: string | null;
  forma_pagamento: string | null;
  categoria: string | null;
  cliente_id: string | null;
  cliente_nome: string | null;
  nota_id: string | null;
  observacoes: string | null;
  vencida: boolean;
}

interface Resumo {
  a_receber: number;
  a_pagar: number;
  receber_vencido: number;
  pagar_vencido: number;
  recebido_mes: number;
  pago_mes: number;
  saldo_previsto: number;
}

const contaVazia = {
  tipo: "receber",
  descricao: "",
  valor: "",
  vencimento: hojeISO(),
  categoria: "",
  cliente_id: "",
  observacoes: "",
};

export function Financeiro() {
  const [params, setParams] = useSearchParams();
  const tipo = params.get("tipo") ?? "";
  const status = params.get("status") ?? "";
  const toast = useToast();
  const { confirmar, dialog } = useConfirm();
  const contas = useApi(
    () => api.get<Conta[]>(`/financeiro/contas${qs({ tipo, status })}`),
    [tipo, status],
  );
  const resumo = useApi(() => api.get<Resumo>("/financeiro/resumo"), []);
  const clientes = useApi(() => api.get<Pagina<Registro>>("/clientes?pageSize=200"), []);
  const [editando, setEditando] = useState<Conta | null | "nova">(null);
  const [baixa, setBaixa] = useState<Conta | null>(null);
  const [baixaDados, setBaixaDados] = useState({
    data_pagamento: hojeISO(),
    forma_pagamento: "PIX",
  });
  const f = useForm<Record<string, unknown>>(contaVazia);
  const recarregar = () => {
    void contas.reload();
    void resumo.reload();
  };
  const filtro = (k: string, v: string) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    setParams(p, { replace: true });
  };

  const abrir = (c: Conta | "nova") => {
    f.setErrors({});
    f.setErroGeral("");
    f.setValues(
      c === "nova"
        ? { ...contaVazia, tipo: tipo || "receber" }
        : {
            tipo: c.tipo,
            descricao: c.descricao,
            valor: String(c.valor),
            vencimento: c.vencimento,
            categoria: c.categoria ?? "",
            cliente_id: c.cliente_id ?? "",
            observacoes: c.observacoes ?? "",
          },
    );
    setEditando(c);
  };
  const salvar = () => {
    if (!f.validar(contaSchema)) return;
    void f.enviar(async () => {
      if (editando === "nova") await api.post("/financeiro/contas", f.values);
      else if (editando) await api.put(`/financeiro/contas/${editando.id}`, f.values);
      toast.sucesso("Lançamento salvo.");
      setEditando(null);
      recarregar();
    });
  };
  const acao = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      toast.sucesso(msg);
      recarregar();
    } catch (e) {
      toast.erro(e);
    }
  };

  const r = resumo.data;
  return (
    <>
      <PageHeader
        title="Financeiro"
        icon="bi-cash-coin"
        sub="Contas a receber e a pagar. Notas emitidas geram contas a receber automaticamente."
        actions={
          <Button icon="bi-plus-lg" onClick={() => abrir("nova")}>
            Novo lançamento
          </Button>
        }
      />
      {r && (
        <div className="grid grid-4">
          <Card>
            <div className="kpi">
              <span className="label">A receber</span>
              <span className="value" style={{ color: "var(--success)" }}>
                {formatBRL(r.a_receber)}
              </span>
              {r.receber_vencido > 0 && (
                <span className="small" style={{ color: "var(--danger)" }}>
                  {formatBRL(r.receber_vencido)} vencido
                </span>
              )}
            </div>
          </Card>
          <Card>
            <div className="kpi">
              <span className="label">A pagar</span>
              <span className="value" style={{ color: "var(--danger)" }}>
                {formatBRL(r.a_pagar)}
              </span>
              {r.pagar_vencido > 0 && (
                <span className="small" style={{ color: "var(--danger)" }}>
                  {formatBRL(r.pagar_vencido)} vencido
                </span>
              )}
            </div>
          </Card>
          <Card>
            <div className="kpi">
              <span className="label">Saldo previsto</span>
              <span className="value">{formatBRL(r.saldo_previsto)}</span>
            </div>
          </Card>
          <Card>
            <div className="kpi">
              <span className="label">Realizado no mês</span>
              <span className="value">{formatBRL(r.recebido_mes - r.pago_mes)}</span>
              <span className="muted small">
                +{formatBRL(r.recebido_mes)} / −{formatBRL(r.pago_mes)}
              </span>
            </div>
          </Card>
        </div>
      )}
      <div className="toolbar mt">
        <select
          className="input"
          style={{ width: "auto" }}
          aria-label="Tipo"
          value={tipo}
          onChange={(e) => filtro("tipo", e.target.value)}
        >
          <option value="">Receber e pagar</option>
          <option value="receber">A receber</option>
          <option value="pagar">A pagar</option>
        </select>
        <select
          className="input"
          style={{ width: "auto" }}
          aria-label="Status"
          value={status}
          onChange={(e) => filtro("status", e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="aberta">Em aberto</option>
          <option value="vencida">Vencidas</option>
          <option value="paga">Pagas</option>
          <option value="cancelada">Canceladas</option>
        </select>
      </div>
      <ErrorBox error={contas.error} onRetry={contas.reload} />
      {contas.loading && !contas.data ? (
        <Loading />
      ) : contas.data?.length === 0 ? (
        <Card>
          <Empty icon="bi-cash-coin">Nenhum lançamento.</Empty>
        </Card>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Vencimento</th>
                <th>Descrição</th>
                <th>Tipo</th>
                <th className="num">Valor</th>
                <th>Status</th>
                <th className="acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              {contas.data?.map((c) => (
                <tr key={c.id}>
                  <td>{dataBR(c.vencimento)}</td>
                  <td>
                    {c.descricao}
                    <div className="muted small">
                      {[c.categoria, c.cliente_nome].filter(Boolean).join(" · ")}{" "}
                      {c.nota_id && <Link to={`/notas/${c.nota_id}`}>ver nota</Link>}
                    </div>
                  </td>
                  <td>
                    {c.tipo === "receber" ? (
                      <Badge tone="success">Receber</Badge>
                    ) : (
                      <Badge tone="danger">Pagar</Badge>
                    )}
                  </td>
                  <td className="num">{formatBRL(c.valor)}</td>
                  <td>
                    {c.status === "paga" ? (
                      <Badge tone="success">Paga {dataBR(c.data_pagamento)}</Badge>
                    ) : c.status === "cancelada" ? (
                      <Badge>Cancelada</Badge>
                    ) : c.vencida ? (
                      <Badge tone="danger">Vencida</Badge>
                    ) : (
                      <Badge tone="info">Em aberto</Badge>
                    )}
                  </td>
                  <td className="acoes">
                    {c.status === "aberta" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon="bi-check2"
                        onClick={() => setBaixa(c)}
                      >
                        Baixar
                      </Button>
                    )}
                    {c.status === "paga" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon="bi-arrow-counterclockwise"
                        onClick={() =>
                          acao(
                            () => api.post(`/financeiro/contas/${c.id}/estornar`),
                            "Baixa estornada.",
                          )
                        }
                      >
                        Estornar
                      </Button>
                    )}
                    {c.status === "aberta" && !c.nota_id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon="bi-pencil"
                        aria-label="Editar"
                        onClick={() => abrir(c)}
                      />
                    )}
                    {c.status !== "paga" && !c.nota_id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon="bi-trash"
                        aria-label="Excluir"
                        onClick={async () =>
                          (await confirmar("Excluir lançamento", c.descricao)) &&
                          acao(() => api.del(`/financeiro/contas/${c.id}`), "Lançamento excluído.")
                        }
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal
        title={editando === "nova" ? "Novo lançamento" : "Editar lançamento"}
        open={editando !== null}
        onClose={() => setEditando(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button loading={f.enviando} onClick={salvar}>
              Salvar
            </Button>
          </>
        }
      >
        <div className="form-grid">
          {f.erroGeral && <Alert tone="danger">{f.erroGeral}</Alert>}
          <Field label="Tipo" required className="c6" htmlFor="tipo">
            <select {...f.bind("tipo")}>
              <option value="receber">A receber</option>
              <option value="pagar">A pagar</option>
            </select>
          </Field>
          <Field label="Valor (R$)" required className="c6" error={f.errors.valor} htmlFor="valor">
            <input {...f.bind("valor")} inputMode="decimal" />
          </Field>
          <Field label="Descrição" required error={f.errors.descricao} htmlFor="descricao">
            <input {...f.bind("descricao")} />
          </Field>
          <Field
            label="Vencimento"
            required
            className="c6"
            error={f.errors.vencimento}
            htmlFor="vencimento"
          >
            <input {...f.bind("vencimento")} type="date" />
          </Field>
          <Field label="Categoria" className="c6" htmlFor="categoria">
            <select {...f.bind("categoria")}>
              <option value="">—</option>
              {CATEGORIAS_FINANCEIRO.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Cliente (opcional)" htmlFor="cliente_id">
            <select {...f.bind("cliente_id")}>
              <option value="">—</option>
              {clientes.data?.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {String(c.nome_social)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Observações" htmlFor="observacoes">
            <textarea {...f.bind("observacoes")} />
          </Field>
        </div>
      </Modal>
      <Modal
        title="Registrar pagamento"
        open={Boolean(baixa)}
        onClose={() => setBaixa(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setBaixa(null)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                const c = baixa!;
                setBaixa(null);
                await acao(
                  () => api.post(`/financeiro/contas/${c.id}/baixar`, baixaDados),
                  "Baixa registrada.",
                );
              }}
            >
              Confirmar baixa
            </Button>
          </>
        }
      >
        <div className="stack">
          <p>
            <strong>{baixa?.descricao}</strong> — {formatBRL(baixa?.valor)}
          </p>
          <Field label="Data do pagamento" htmlFor="data_pagamento">
            <input
              id="data_pagamento"
              type="date"
              value={baixaDados.data_pagamento}
              onChange={(e) => setBaixaDados({ ...baixaDados, data_pagamento: e.target.value })}
            />
          </Field>
          <Field label="Forma de pagamento" htmlFor="forma">
            <select
              id="forma"
              value={baixaDados.forma_pagamento}
              onChange={(e) => setBaixaDados({ ...baixaDados, forma_pagamento: e.target.value })}
            >
              {[
                "PIX",
                "Dinheiro",
                "Boleto",
                "Cartão de crédito",
                "Cartão de débito",
                "Transferência",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
        </div>
      </Modal>
      {dialog}
    </>
  );
}
