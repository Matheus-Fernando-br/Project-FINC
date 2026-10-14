import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { TIPOS_NOTA, calcularTotais, tipoItemPermitido, type TipoNota } from "@finc/shared";
import { api, qs, ApiError } from "../../api/client";
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
  Modal,
  PageHeader,
  Pagination,
  useConfirm,
  useToast,
} from "../../components/ui";
import { dataBR, dataHoraBR, formatBRL, formatCpfCnpj, numeroNota } from "../../format";
import { useApi } from "../../hooks/useApi";

export const StatusNota = ({ s }: { s: Nota["status"] }) =>
  s === "emitida" ? (
    <Badge tone="success">Emitida</Badge>
  ) : s === "cancelada" ? (
    <Badge tone="danger">Cancelada</Badge>
  ) : (
    <Badge tone="info">Rascunho</Badge>
  );

type LinhaNota = Pick<
  Nota,
  "id" | "tipo" | "serie" | "numero" | "status" | "data_emissao" | "criado_em" | "total"
> & { cliente_nome: string; cliente_cpf_cnpj: string };

export function NotasLista() {
  const [params, setParams] = useSearchParams();
  const filtros = {
    status: params.get("status") ?? "",
    tipo: params.get("tipo") ?? "",
    de: params.get("de") ?? "",
    ate: params.get("ate") ?? "",
    q: params.get("q") ?? "",
  };
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { data, error, loading, reload } = useApi(
    () => api.get<Pagina<LinhaNota>>(`/notas${qs({ ...filtros, page })}`),
    [params.toString(), page],
  );
  const setFiltro = (k: string, v: string) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    setParams(p, { replace: true });
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Notas fiscais"
        icon="bi-receipt"
        sub="Documentos emitidos, rascunhos e cancelamentos."
        actions={
          <Link to="/notas/nova" className="btn">
            <i className="bi bi-plus-lg" /> Emitir nota
          </Link>
        }
      />
      <div className="toolbar">
        <div className="search">
          <i className="bi bi-search" aria-hidden />
          <input
            className="input"
            placeholder="Cliente, CPF/CNPJ ou número"
            aria-label="Buscar notas"
            defaultValue={filtros.q}
            onKeyDown={(e) =>
              e.key === "Enter" && setFiltro("q", (e.target as HTMLInputElement).value)
            }
          />
        </div>
        <select
          className="input"
          style={{ width: "auto" }}
          aria-label="Status"
          value={filtros.status}
          onChange={(e) => setFiltro("status", e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="rascunho">Rascunhos</option>
          <option value="emitida">Emitidas</option>
          <option value="cancelada">Canceladas</option>
        </select>
        <select
          className="input"
          style={{ width: "auto" }}
          aria-label="Tipo"
          value={filtros.tipo}
          onChange={(e) => setFiltro("tipo", e.target.value)}
        >
          <option value="">Todos os tipos</option>
          {TIPOS_NOTA.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <input
          className="input"
          style={{ width: "auto" }}
          type="date"
          aria-label="De"
          value={filtros.de}
          onChange={(e) => setFiltro("de", e.target.value)}
        />
        <input
          className="input"
          style={{ width: "auto" }}
          type="date"
          aria-label="Até"
          value={filtros.ate}
          onChange={(e) => setFiltro("ate", e.target.value)}
        />
      </div>
      <ErrorBox error={error} onRetry={reload} />
      {loading && !data ? (
        <Loading />
      ) : data && data.items.length === 0 ? (
        <Card>
          <Empty icon="bi-receipt">
            Nenhum documento encontrado. <Link to="/notas/nova">Emitir o primeiro</Link>
          </Empty>
        </Card>
      ) : data ? (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Tipo</th>
                  <th>Cliente</th>
                  <th>Data</th>
                  <th className="num">Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((n) => (
                  <tr key={n.id} className="clickable" onClick={() => navigate(`/notas/${n.id}`)}>
                    <td>
                      <strong>{numeroNota(n.numero)}</strong>
                      <div className="muted small">Série {n.serie}</div>
                    </td>
                    <td>{n.tipo}</td>
                    <td>
                      {n.cliente_nome}
                      <div className="muted small">{formatCpfCnpj(n.cliente_cpf_cnpj)}</div>
                    </td>
                    <td>{dataBR(n.data_emissao ?? n.criado_em)}</td>
                    <td className="num">{formatBRL(n.total)}</td>
                    <td>
                      <StatusNota s={n.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            onPage={setPage}
          />
        </>
      ) : null}
    </>
  );
}

interface ItemForm {
  chave: number;
  ref: string; // "p:<id>" ou "s:<id>"
  quantidade: string;
  valor_unitario: string;
  info: string;
}

interface Catalogo {
  produtos: Registro[];
  servicos: Registro[];
  clientes: Registro[];
  somarImpostos: boolean;
}

let seq = 1;
const novoItem = (): ItemForm => ({
  chave: seq++,
  ref: "",
  quantidade: "1",
  valor_unitario: "",
  info: "",
});

export function NotaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [cat, setCat] = useState<Catalogo | null>(null);
  const [erro, setErro] = useState<ApiError | Error | null>(null);
  const [tipo, setTipo] = useState<TipoNota | "">("");
  const [clienteId, setClienteId] = useState("");
  const [itens, setItens] = useState<ItemForm[]>([novoItem()]);
  const [descI, setDescI] = useState("");
  const [descC, setDescC] = useState("");
  const [obs, setObs] = useState("");
  const [natureza, setNatureza] = useState("");
  const [frete, setFrete] = useState({
    incluir_frete: false,
    nome: "",
    cpf_cnpj: "",
    placa: "",
    peso_bruto: "",
    peso_liquido: "",
    info: "",
  });
  const [gerarFin, setGerarFin] = useState(true);
  const [vencimento, setVencimento] = useState("");
  const [enviando, setEnviando] = useState<"" | "rascunho" | "emitir">("");
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const [p, s, c, cfg] = await Promise.all([
          api.get<Pagina<Registro>>("/produtos?pageSize=200"),
          api.get<Pagina<Registro>>("/servicos?pageSize=200"),
          api.get<Pagina<Registro>>("/clientes?pageSize=200"),
          api.get<{ somar_impostos: boolean; natureza_operacao: string | null }>("/config/fiscal"),
        ]);
        setCat({
          produtos: p.items.filter((x) => x.ativo),
          servicos: s.items.filter((x) => x.ativo),
          clientes: c.items,
          somarImpostos: cfg.somar_impostos,
        });
        if (id) {
          const n = await api.get<Nota>(`/notas/${id}`);
          if (n.status !== "rascunho") {
            navigate(`/notas/${id}`, { replace: true });
            return;
          }
          setTipo(n.tipo);
          setClienteId(n.cliente_id ?? "");
          setItens(
            n.itens.map((i) => ({
              chave: seq++,
              ref: i.produto_id ? `p:${i.produto_id}` : `s:${i.servico_id}`,
              quantidade: String(i.quantidade),
              valor_unitario: String(i.valor_unitario),
              info: i.info ?? "",
            })),
          );
          setDescI(String(n.desconto_incondicional || ""));
          setDescC(String(n.desconto_condicional || ""));
          setObs(n.observacoes ?? "");
          setNatureza(n.natureza_operacao ?? "");
          setGerarFin(n.gerar_financeiro);
          setVencimento(n.vencimento ?? "");
          const t = n.transporte as Record<string, unknown>;
          setFrete((f) => ({
            ...f,
            ...Object.fromEntries(
              Object.entries(t ?? {}).map(([k, v]) => [
                k,
                v ?? (k === "incluir_frete" ? false : ""),
              ]),
            ),
          }));
        } else setNatureza(cfg.natureza_operacao ?? "");
      } catch (e) {
        setErro(e as Error);
      }
    })();
  }, [id, navigate]);

  const disponiveis = useMemo(() => {
    if (!cat || !tipo) return [];
    return tipo === "NFS-e"
      ? cat.servicos.map((s) => ({
          ref: `s:${s.id}`,
          nome: String(s.nome),
          preco: Number(s.preco),
          extra: s,
        }))
      : cat.produtos.map((p) => ({
          ref: `p:${p.id}`,
          nome: `${p.nome} (${p.sku})`,
          preco: Number(p.preco_unitario),
          extra: p,
        }));
  }, [cat, tipo]);

  const prever = useMemo(() => {
    const linhas = itens
      .map((i) => {
        const d = disponiveis.find((x) => x.ref === i.ref);
        if (!d) return null;
        const e = d.extra;
        return {
          tipo: i.ref.startsWith("p:") ? ("produto" as const) : ("servico" as const),
          quantidade: Number(i.quantidade.replace(",", ".")) || 0,
          valorUnitario:
            i.valor_unitario === "" ? d.preco : Number(i.valor_unitario.replace(",", ".")) || 0,
          icms: e.icms as number,
          pisCofins: e.pis_cofins as number,
          aliquotaIss: e.aliquota_iss as number,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
    return calcularTotais(
      linhas,
      Number(descI.replace(",", ".")) || 0,
      Number(descC.replace(",", ".")) || 0,
      cat?.somarImpostos ?? true,
    );
  }, [itens, disponiveis, descI, descC, cat]);

  const mudarTipo = (t: TipoNota) => {
    setTipo(t);
    setItens((its) =>
      its.map((i) =>
        i.ref && !tipoItemPermitido(t, i.ref.startsWith("p:") ? "produto" : "servico")
          ? { ...i, ref: "", valor_unitario: "" }
          : i,
      ),
    );
  };
  const setItem = (chave: number, campo: keyof ItemForm, v: string) =>
    setItens((its) => its.map((i) => (i.chave === chave ? { ...i, [campo]: v } : i)));

  const corpo = (emitir: boolean) => ({
    tipo,
    cliente_id: clienteId,
    itens: itens
      .filter((i) => i.ref)
      .map((i) => ({
        [i.ref.startsWith("p:") ? "produto_id" : "servico_id"]: i.ref.slice(2),
        quantidade: i.quantidade,
        ...(i.valor_unitario !== "" ? { valor_unitario: i.valor_unitario } : {}),
        info: i.info,
      })),
    desconto_incondicional: descI,
    desconto_condicional: descC,
    observacoes: obs,
    natureza_operacao: natureza,
    transporte:
      tipo === "NFS-e"
        ? undefined
        : {
            ...frete,
            cpf_cnpj: frete.cpf_cnpj,
            peso_bruto: frete.peso_bruto,
            peso_liquido: frete.peso_liquido,
          },
    gerar_financeiro: gerarFin,
    vencimento,
    emitir,
  });

  const salvar = async (emitir: boolean) => {
    setEnviando(emitir ? "emitir" : "rascunho");
    setErro(null);
    setErrosCampos({});
    try {
      let notaId = id;
      if (id) {
        await api.put(`/notas/${id}`, corpo(false));
        if (emitir) await api.post(`/notas/${id}/emitir`);
      } else {
        const n = await api.post<Nota>("/notas", corpo(emitir));
        notaId = n.id;
      }
      toast.sucesso(emitir ? "Documento emitido com sucesso." : "Rascunho salvo.");
      navigate(`/notas/${notaId}`);
    } catch (e) {
      setErro(e as Error);
      if (e instanceof ApiError) setErrosCampos(e.campos);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setEnviando("");
    }
  };

  if (!cat && !erro) return <Loading />;
  const semCadastros =
    cat && (cat.clientes.length === 0 || (cat.produtos.length === 0 && cat.servicos.length === 0));

  return (
    <>
      <PageHeader
        title={id ? "Editar rascunho" : "Emitir nota fiscal"}
        icon="bi-receipt"
        actions={
          <Link to="/notas" className="btn secondary">
            <i className="bi bi-arrow-left" /> Voltar
          </Link>
        }
      />
      <ErrorBox error={erro} />
      {semCadastros && (
        <Alert tone="warning">
          Para emitir é preciso ter ao menos um <Link to="/clientes/novo">cliente</Link> e um{" "}
          <Link to="/produtos/novo">produto</Link> ou <Link to="/servicos/novo">serviço</Link>{" "}
          cadastrados.
        </Alert>
      )}
      <Card title="Tipo e destinatário" icon="bi-person" className="mt">
        <div className="form-grid">
          <Field
            label="Tipo de documento"
            required
            className="c4"
            error={errosCampos.tipo}
            htmlFor="tipo"
          >
            <select id="tipo" value={tipo} onChange={(e) => mudarTipo(e.target.value as TipoNota)}>
              <option value="">Selecione</option>
              <option value="NF-e">NF-e (produtos)</option>
              <option value="NFC-e">NFC-e (consumidor)</option>
              <option value="NFS-e">NFS-e (serviços)</option>
            </select>
          </Field>
          <Field
            label="Cliente"
            required
            className="c8"
            error={errosCampos.cliente_id}
            htmlFor="cliente"
          >
            <select id="cliente" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">Selecione</option>
              {cat?.clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {String(c.nome_social)} — {formatCpfCnpj(c.cpf_cnpj)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Natureza da operação" className="c8" htmlFor="natureza">
            <input id="natureza" value={natureza} onChange={(e) => setNatureza(e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card
        title={tipo === "NFS-e" ? "Serviços" : "Produtos"}
        icon="bi-list-ul"
        actions={
          <Button
            size="sm"
            variant="secondary"
            icon="bi-plus"
            disabled={!tipo}
            onClick={() => setItens((i) => [...i, novoItem()])}
          >
            Adicionar item
          </Button>
        }
      >
        {!tipo && (
          <p className="muted">
            Selecione o tipo de documento: NF-e/NFC-e aceitam produtos e NFS-e aceita serviços.
          </p>
        )}
        {errosCampos.itens && <Alert tone="danger">{errosCampos.itens}</Alert>}
        <div className="stack">
          {tipo &&
            itens.map((i, idx) => {
              const d = disponiveis.find((x) => x.ref === i.ref);
              const sub =
                (Number(i.quantidade.replace(",", ".")) || 0) *
                (i.valor_unitario === ""
                  ? (d?.preco ?? 0)
                  : Number(i.valor_unitario.replace(",", ".")) || 0);
              return (
                <div key={i.chave} className="item-row">
                  <Field label={`Item ${idx + 1}`} htmlFor={`item-${i.chave}`}>
                    <select
                      id={`item-${i.chave}`}
                      value={i.ref}
                      onChange={(e) => setItem(i.chave, "ref", e.target.value)}
                    >
                      <option value="">Selecione</option>
                      {disponiveis.map((x) => (
                        <option key={x.ref} value={x.ref}>
                          {x.nome}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Qtd." htmlFor={`qtd-${i.chave}`}>
                    <input
                      id={`qtd-${i.chave}`}
                      inputMode="decimal"
                      value={i.quantidade}
                      onChange={(e) => setItem(i.chave, "quantidade", e.target.value)}
                    />
                  </Field>
                  <Field
                    label="Valor unit."
                    hint={d ? `Catálogo: ${formatBRL(d.preco)}` : undefined}
                    htmlFor={`v-${i.chave}`}
                  >
                    <input
                      id={`v-${i.chave}`}
                      inputMode="decimal"
                      placeholder={d ? String(d.preco) : ""}
                      value={i.valor_unitario}
                      onChange={(e) => setItem(i.chave, "valor_unitario", e.target.value)}
                    />
                  </Field>
                  <Field label="Subtotal">
                    <input value={formatBRL(sub)} readOnly tabIndex={-1} />
                  </Field>
                  <Field label="Informações adicionais" htmlFor={`info-${i.chave}`}>
                    <input
                      id={`info-${i.chave}`}
                      value={i.info}
                      onChange={(e) => setItem(i.chave, "info", e.target.value)}
                    />
                  </Field>
                  <Button
                    variant="ghost"
                    icon="bi-trash"
                    aria-label={`Remover item ${idx + 1}`}
                    disabled={itens.length === 1}
                    onClick={() => setItens((its) => its.filter((x) => x.chave !== i.chave))}
                  />
                </div>
              );
            })}
        </div>
      </Card>

      {tipo && tipo !== "NFS-e" && (
        <Card title="Transporte" icon="bi-truck">
          <label className="check">
            <input
              type="checkbox"
              checked={frete.incluir_frete}
              onChange={(e) => setFrete({ ...frete, incluir_frete: e.target.checked })}
            />{" "}
            Incluir frete (por conta do remetente)
          </label>
          {frete.incluir_frete && (
            <div className="form-grid mt">
              <Field label="Transportador" className="c6">
                <input
                  value={frete.nome}
                  onChange={(e) => setFrete({ ...frete, nome: e.target.value })}
                />
              </Field>
              <Field
                label="CPF/CNPJ do transportador"
                className="c6"
                error={errosCampos["transporte"]}
              >
                <input
                  value={frete.cpf_cnpj}
                  onChange={(e) => setFrete({ ...frete, cpf_cnpj: e.target.value })}
                />
              </Field>
              <Field label="Placa" className="c4">
                <input
                  value={frete.placa}
                  onChange={(e) => setFrete({ ...frete, placa: e.target.value })}
                />
              </Field>
              <Field label="Peso bruto (kg)" className="c4">
                <input
                  inputMode="decimal"
                  value={frete.peso_bruto}
                  onChange={(e) => setFrete({ ...frete, peso_bruto: e.target.value })}
                />
              </Field>
              <Field label="Peso líquido (kg)" className="c4">
                <input
                  inputMode="decimal"
                  value={frete.peso_liquido}
                  onChange={(e) => setFrete({ ...frete, peso_liquido: e.target.value })}
                />
              </Field>
              <Field label="Informações do transporte">
                <input
                  value={frete.info}
                  onChange={(e) => setFrete({ ...frete, info: e.target.value })}
                />
              </Field>
            </div>
          )}
        </Card>
      )}

      <Card title="Valores, financeiro e observações" icon="bi-calculator">
        <div className="grid grid-2">
          <div className="form-grid">
            <Field label="Desconto incondicional (R$)" className="c6">
              <input inputMode="decimal" value={descI} onChange={(e) => setDescI(e.target.value)} />
            </Field>
            <Field label="Desconto condicional (R$)" className="c6">
              <input inputMode="decimal" value={descC} onChange={(e) => setDescC(e.target.value)} />
            </Field>
            <label className="check c6">
              <input
                type="checkbox"
                checked={gerarFin}
                onChange={(e) => setGerarFin(e.target.checked)}
              />{" "}
              Lançar conta a receber
            </label>
            {gerarFin && (
              <Field label="Vencimento" className="c6" hint="Padrão: 30 dias após a emissão.">
                <input
                  type="date"
                  value={vencimento}
                  onChange={(e) => setVencimento(e.target.value)}
                />
              </Field>
            )}
            <Field label="Observações gerais">
              <textarea value={obs} onChange={(e) => setObs(e.target.value)} />
            </Field>
          </div>
          <div className="totais">
            <span>Produtos</span>
            <span className="right">{formatBRL(prever.valorProdutos)}</span>
            <span>Serviços</span>
            <span className="right">{formatBRL(prever.valorServicos)}</span>
            <span>ICMS</span>
            <span className="right">{formatBRL(prever.valorIcms)}</span>
            <span>PIS/COFINS</span>
            <span className="right">{formatBRL(prever.valorPisCofins)}</span>
            <span>ISS</span>
            <span className="right">{formatBRL(prever.valorIss)}</span>
            <span>Descontos</span>
            <span className="right">
              − {formatBRL(prever.descontoIncondicional + prever.descontoCondicional)}
            </span>
            <span className="total">Total</span>
            <span className="total right">{formatBRL(prever.totalNota)}</span>
            <span className="muted small" style={{ gridColumn: "1 / -1" }}>
              {cat?.somarImpostos
                ? "Tributos somados ao total (configurável em Configurações › Fiscal)."
                : "Tributos destacados, sem soma ao total."}{" "}
              O cálculo final é feito no servidor.
            </span>
          </div>
        </div>
      </Card>
      <div className="form-actions">
        <Button
          variant="secondary"
          loading={enviando === "rascunho"}
          disabled={Boolean(enviando)}
          onClick={() => salvar(false)}
          icon="bi-save"
        >
          Salvar rascunho
        </Button>
        <Button
          loading={enviando === "emitir"}
          disabled={Boolean(enviando)}
          onClick={() => salvar(true)}
          icon="bi-send-check"
        >
          Emitir documento
        </Button>
      </div>
    </>
  );
}

export function NotaDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { confirmar, dialog } = useConfirm();
  const {
    data: n,
    error,
    loading,
    reload,
    setData,
  } = useApi(() => api.get<Nota>(`/notas/${id}`), [id]);
  const contadores = useApi(() => api.get<Pagina<Registro>>("/contadores?pageSize=50"), []);
  const [cancelar, setCancelar] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [enviar, setEnviar] = useState(false);
  const [contadorId, setContadorId] = useState("");
  const [ocupado, setOcupado] = useState("");

  if (loading && !n) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!n) return null;

  const acao = async (nome: string, fn: () => Promise<void>) => {
    setOcupado(nome);
    try {
      await fn();
    } catch (e) {
      toast.erro(e);
    } finally {
      setOcupado("");
    }
  };

  const emitir = () =>
    acao("emitir", async () => {
      setData(await api.post<Nota>(`/notas/${n.id}/emitir`));
      toast.sucesso("Documento emitido.");
    });
  const excluir = async () => {
    if (!(await confirmar("Excluir rascunho", "O rascunho será removido definitivamente."))) return;
    await acao("excluir", async () => {
      await api.del(`/notas/${n.id}`);
      toast.sucesso("Rascunho excluído.");
      navigate("/notas");
    });
  };
  const confirmarCancelamento = () =>
    acao("cancelar", async () => {
      setData(await api.post<Nota>(`/notas/${n.id}/cancelar`, { motivo }));
      setCancelar(false);
      toast.sucesso("Documento cancelado.");
    });
  const enviarContador = () =>
    acao("enviar", async () => {
      const r = await api.post<{ message: string }>(`/notas/${n.id}/enviar-contador`, {
        contador_id: contadorId,
      });
      setEnviar(false);
      toast.sucesso(r.message);
    });

  const d = n.destinatario;
  return (
    <>
      <PageHeader
        title={`${n.tipo} ${numeroNota(n.numero)}`}
        icon="bi-receipt"
        sub={
          <span className="row">
            <StatusNota s={n.status} /> Série {n.serie} · Ambiente de{" "}
            {n.ambiente === "producao" ? "produção" : "homologação"} ·{" "}
            {n.data_emissao
              ? `Emitida em ${dataHoraBR(n.data_emissao)}`
              : `Criada em ${dataHoraBR(n.criado_em)}`}
          </span>
        }
        actions={
          <>
            <Link to="/notas" className="btn secondary">
              <i className="bi bi-arrow-left" /> Voltar
            </Link>
            <Button
              variant="secondary"
              icon="bi-file-earmark-pdf"
              loading={ocupado === "pdf"}
              onClick={() => acao("pdf", () => api.abrir(`/notas/${n.id}/pdf`))}
            >
              Ver PDF
            </Button>
            <Button
              variant="secondary"
              icon="bi-download"
              onClick={() =>
                acao("pdfd", () => api.download(`/notas/${n.id}/pdf?download=1`, "nota.pdf"))
              }
            >
              Baixar PDF
            </Button>
            <Button
              variant="secondary"
              icon="bi-filetype-xml"
              onClick={() => acao("xml", () => api.download(`/notas/${n.id}/xml`, "nota.xml"))}
            >
              Baixar XML
            </Button>
            {n.status === "rascunho" && (
              <>
                <Link to={`/notas/${n.id}/editar`} className="btn secondary">
                  <i className="bi bi-pencil" /> Editar
                </Link>
                <Button variant="danger" icon="bi-trash" onClick={excluir}>
                  Excluir
                </Button>
                <Button icon="bi-send-check" loading={ocupado === "emitir"} onClick={emitir}>
                  Emitir
                </Button>
              </>
            )}
            {n.status === "emitida" && (
              <>
                <Button variant="secondary" icon="bi-envelope" onClick={() => setEnviar(true)}>
                  Enviar ao contador
                </Button>
                <Button variant="danger" icon="bi-x-circle" onClick={() => setCancelar(true)}>
                  Cancelar
                </Button>
              </>
            )}
          </>
        }
      />
      <Alert tone="warning">
        Documento auxiliar <strong>sem valor fiscal</strong>: a transmissão à SEFAZ/Prefeitura
        requer certificado A1 e provedor fiscal homologado (veja a documentação de integrações).
      </Alert>
      {n.status === "cancelada" && (
        <Alert tone="danger">
          Cancelada{n.motivo_cancelamento ? `: ${n.motivo_cancelamento}` : ""}
        </Alert>
      )}
      <div className="grid grid-2 mt">
        <Card title="Emitente" icon="bi-building">
          <strong>{n.emitente.nome}</strong>
          <div className="muted small">{formatCpfCnpj(n.emitente.cpf_cnpj)}</div>
          <div className="small">
            {[
              n.emitente.logradouro,
              n.emitente.numero,
              n.emitente.bairro,
              n.emitente.cidade && `${n.emitente.cidade}/${n.emitente.uf}`,
            ]
              .filter(Boolean)
              .join(", ") || "Endereço não informado"}
          </div>
        </Card>
        <Card title="Destinatário" icon="bi-person">
          <strong>{d.nome}</strong>
          <div className="muted small">
            {formatCpfCnpj(d.cpf_cnpj)} {d.email ? `· ${d.email}` : ""}
          </div>
          <div className="small">
            {[d.logradouro, d.numero, d.bairro, d.cidade && `${d.cidade}/${d.uf}`]
              .filter(Boolean)
              .join(", ") || "Endereço não informado"}
          </div>
        </Card>
      </div>
      <Card title="Itens" icon="bi-list-ul" className="mt">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Descrição</th>
                <th>Código</th>
                <th className="num">Qtd.</th>
                <th className="num">Valor unit.</th>
                <th className="num">Alíquota</th>
                <th className="num">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {n.itens.map((i) => (
                <tr key={i.ordem}>
                  <td>{i.ordem}</td>
                  <td>
                    {i.descricao}
                    {i.info ? <div className="muted small">{i.info}</div> : null}
                  </td>
                  <td>{i.codigo ?? "—"}</td>
                  <td className="num">
                    {i.quantidade} {i.unidade ?? ""}
                  </td>
                  <td className="num">{formatBRL(i.valor_unitario)}</td>
                  <td className="num">
                    {i.tipo === "servico" ? `ISS ${i.aliquota_iss ?? 0}%` : `ICMS ${i.icms ?? 0}%`}
                  </td>
                  <td className="num">{formatBRL(i.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="totais mt">
          <span>Produtos</span>
          <span className="right">{formatBRL(n.valor_produtos)}</span>
          <span>Serviços</span>
          <span className="right">{formatBRL(n.valor_servicos)}</span>
          <span>ICMS</span>
          <span className="right">{formatBRL(n.valor_icms)}</span>
          <span>PIS/COFINS</span>
          <span className="right">{formatBRL(n.valor_pis_cofins)}</span>
          <span>ISS</span>
          <span className="right">{formatBRL(n.valor_iss)}</span>
          <span>Descontos</span>
          <span className="right">
            − {formatBRL(n.desconto_incondicional + n.desconto_condicional)}
          </span>
          <span className="total">Total</span>
          <span className="total right">{formatBRL(n.total)}</span>
        </div>
        {n.observacoes && (
          <p className="mt small">
            <strong>Observações:</strong> {n.observacoes}
          </p>
        )}
      </Card>

      <Modal
        title="Cancelar documento"
        open={cancelar}
        onClose={() => setCancelar(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelar(false)}>
              Voltar
            </Button>
            <Button
              variant="danger"
              loading={ocupado === "cancelar"}
              disabled={motivo.trim().length < 15}
              onClick={confirmarCancelamento}
            >
              Confirmar cancelamento
            </Button>
          </>
        }
      >
        <div className="stack">
          <p>O estoque baixado será estornado e a conta a receber em aberto será cancelada.</p>
          <Field label="Justificativa (mínimo 15 caracteres)" required htmlFor="motivo">
            <textarea id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </Field>
        </div>
      </Modal>
      <Modal
        title="Enviar ao contador"
        open={enviar}
        onClose={() => setEnviar(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEnviar(false)}>
              Cancelar
            </Button>
            <Button loading={ocupado === "enviar"} disabled={!contadorId} onClick={enviarContador}>
              Enviar PDF e XML
            </Button>
          </>
        }
      >
        {contadores.data?.items.length === 0 ? (
          <p>
            Nenhum contador cadastrado. <Link to="/contadores/novo">Cadastrar contador</Link>
          </p>
        ) : (
          <Field label="Contador" required htmlFor="contador">
            <select
              id="contador"
              value={contadorId}
              onChange={(e) => setContadorId(e.target.value)}
            >
              <option value="">Selecione</option>
              {contadores.data?.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {String(c.nome)} — {String(c.email)}
                </option>
              ))}
            </select>
          </Field>
        )}
      </Modal>
      {dialog}
    </>
  );
}
