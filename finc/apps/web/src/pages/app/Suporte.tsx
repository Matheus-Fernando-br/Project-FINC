import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CATEGORIAS_CHAMADO, chamadoSchema } from "@finc/shared";
import { api } from "../../api/client";
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
  useToast,
} from "../../components/ui";
import { dataHoraBR } from "../../format";
import { useApi } from "../../hooks/useApi";
import { useForm } from "../../hooks/useForm";

/* ======================= Notificações ======================= */

interface Notif {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  link: string | null;
  lida_em: string | null;
  criado_em: string;
}
interface Canais {
  interno: { disponivel: boolean; ativo: boolean };
  email: { disponivel: boolean; ativo: boolean; destino: string };
}

export function Notificacoes() {
  const toast = useToast();
  const navigate = useNavigate();
  const lista = useApi(() => api.get<{ items: Notif[]; naoLidas: number }>("/notificacoes"));
  const canais = useApi(() => api.get<Canais>("/notificacoes/canais"));
  const [testando, setTestando] = useState(false);

  const acao = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      void lista.reload();
    } catch (e) {
      toast.erro(e);
    }
  };
  const alternarEmail = async (ativo: boolean) => {
    try {
      const prefs = await api.get<Record<string, unknown>>("/config/preferencias");
      await api.put("/config/preferencias", { ...prefs, notificar_email: ativo });
      void canais.reload();
      toast.sucesso(
        ativo ? "Notificações por e-mail ativadas." : "Notificações por e-mail desativadas.",
      );
    } catch (e) {
      toast.erro(e);
    }
  };
  const testar = async () => {
    setTestando(true);
    try {
      const r = await api.post<{ message: string }>("/notificacoes/canais/email/teste");
      toast.sucesso(r.message);
    } catch (e) {
      toast.erro(e);
    } finally {
      setTestando(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Notificações"
        icon="bi-bell"
        actions={
          <Button
            variant="secondary"
            icon="bi-check2-all"
            disabled={!lista.data?.naoLidas}
            onClick={() => acao(() => api.post("/notificacoes/lidas"))}
          >
            Marcar todas como lidas
          </Button>
        }
      />
      <Card title="Canais" icon="bi-broadcast">
        {canais.data && (
          <div className="stack">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <strong>Na plataforma</strong>
                <div className="muted small">Sino no topo da tela. Sempre ativo.</div>
              </div>
              <Badge tone="success">Ativo</Badge>
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <strong>E-mail</strong>
                <div className="muted small">
                  {canais.data.email.disponivel
                    ? `Enviado para ${canais.data.email.destino}.`
                    : "Indisponível: o servidor não tem SMTP configurado."}
                </div>
              </div>
              <div className="row">
                <label className="check">
                  <input
                    type="checkbox"
                    disabled={!canais.data.email.disponivel}
                    checked={canais.data.email.disponivel && canais.data.email.ativo}
                    onChange={(e) => alternarEmail(e.target.checked)}
                  />{" "}
                  Receber por e-mail
                </label>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!canais.data.email.disponivel}
                  loading={testando}
                  onClick={testar}
                >
                  Enviar teste
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
      <Card title="Histórico" icon="bi-clock-history">
        <ErrorBox error={lista.error} onRetry={lista.reload} />
        {lista.loading && !lista.data ? (
          <Loading />
        ) : lista.data?.items.length === 0 ? (
          <Empty icon="bi-bell">Nenhuma notificação.</Empty>
        ) : (
          <div className="stack">
            {lista.data?.items.map((n) => (
              <div
                key={n.id}
                className={`notif-item ${n.lida_em ? "" : "unread"}`}
                style={{ borderRadius: 10, border: "1px solid var(--border)" }}
              >
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <strong>{n.titulo}</strong>
                  <span className="muted small">{dataHoraBR(n.criado_em)}</span>
                </div>
                <p className="muted">{n.mensagem}</p>
                <div className="row mt" style={{ marginTop: 6 }}>
                  {n.link && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        acao(async () => {
                          if (!n.lida_em) await api.post(`/notificacoes/${n.id}/lida`);
                          navigate(n.link!);
                        })
                      }
                    >
                      Abrir
                    </Button>
                  )}
                  {!n.lida_em && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => acao(() => api.post(`/notificacoes/${n.id}/lida`))}
                    >
                      Marcar como lida
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    icon="bi-trash"
                    aria-label="Excluir notificação"
                    onClick={() => acao(() => api.del(`/notificacoes/${n.id}`))}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

/* ======================= Suporte ======================= */

interface Chamado {
  id: string;
  protocolo: string;
  categoria: string;
  assunto: string;
  status: "aberto" | "aceito" | "fechado";
  criado_em: string;
  atualizado_em: string;
  mensagens?:
    | { id: string; autor: "cliente" | "suporte"; mensagem: string; criado_em: string }[]
    | number;
  usuario_nome?: string;
  usuario_email?: string;
}

const StatusChamado = ({ s }: { s: Chamado["status"] }) =>
  s === "aberto" ? (
    <Badge tone="info">Aguardando atendimento</Badge>
  ) : s === "aceito" ? (
    <Badge tone="success">Em atendimento</Badge>
  ) : (
    <Badge>Encerrado</Badge>
  );

interface Health {
  status: string;
  banco: { ok: boolean };
}

export function Suporte() {
  const lista = useApi(() => api.get<Chamado[]>("/suporte/chamados"));
  const toast = useToast();
  const [status, setStatus] = useState<{ api: boolean; banco: boolean; internet: boolean } | null>(
    null,
  );
  const [verificando, setVerificando] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();

  const verificar = async () => {
    setVerificando(true);
    try {
      const h = await api.get<Health>("/health");
      setStatus({ api: true, banco: h.banco.ok, internet: navigator.onLine });
    } catch {
      setStatus({ api: false, banco: false, internet: navigator.onLine });
    } finally {
      setVerificando(false);
    }
  };
  const enviarFeedback = async () => {
    setEnviando(true);
    try {
      const r = await api.post<{ message: string }>("/suporte/feedback", { mensagem: feedback });
      toast.sucesso(r.message);
      setFeedback("");
    } catch (e) {
      toast.erro(e);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Ajuda e suporte"
        icon="bi-headset"
        actions={
          <Link to="/suporte/novo" className="btn">
            <i className="bi bi-plus-lg" /> Abrir chamado
          </Link>
        }
      />
      <Card title="Meus chamados" icon="bi-ticket-detailed">
        <ErrorBox error={lista.error} onRetry={lista.reload} />
        {lista.loading && !lista.data ? (
          <Loading />
        ) : lista.data?.length === 0 ? (
          <Empty icon="bi-ticket">Você ainda não abriu chamados.</Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>Assunto</th>
                  <th>Categoria</th>
                  <th>Atualizado</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lista.data?.map((c) => (
                  <tr key={c.id} className="clickable" onClick={() => navigate(`/suporte/${c.id}`)}>
                    <td>
                      <code>{c.protocolo}</code>
                    </td>
                    <td>{c.assunto}</td>
                    <td>{c.categoria}</td>
                    <td>{dataHoraBR(c.atualizado_em)}</td>
                    <td>
                      <StatusChamado s={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <div className="grid grid-2 mt">
        <Card title="Status do sistema" icon="bi-activity">
          <Button variant="secondary" loading={verificando} onClick={verificar}>
            Verificar agora
          </Button>
          {status && (
            <ul className="mt" style={{ paddingLeft: 18, margin: "12px 0 0" }}>
              <li>
                Servidor (API):{" "}
                {status.api ? (
                  <Badge tone="success">Operacional</Badge>
                ) : (
                  <Badge tone="danger">Indisponível</Badge>
                )}
              </li>
              <li>
                Banco de dados:{" "}
                {status.banco ? (
                  <Badge tone="success">Operacional</Badge>
                ) : (
                  <Badge tone="danger">Indisponível</Badge>
                )}
              </li>
              <li>
                Sua conexão:{" "}
                {status.internet ? (
                  <Badge tone="success">Online</Badge>
                ) : (
                  <Badge tone="danger">Offline</Badge>
                )}
              </li>
            </ul>
          )}
        </Card>
        <Card title="Enviar feedback" icon="bi-lightbulb">
          <div className="stack">
            <textarea
              className="input"
              aria-label="Feedback"
              rows={4}
              placeholder="Conte o que podemos melhorar..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <div>
              <Button
                loading={enviando}
                disabled={feedback.trim().length < 3}
                onClick={enviarFeedback}
              >
                Enviar
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

export function NovoChamado() {
  const navigate = useNavigate();
  const f = useForm({ categoria: "", assunto: "", mensagem: "" });
  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.validar(chamadoSchema)) return;
    void f.enviar(async () => {
      const c = await api.post<Chamado>("/suporte/chamados", f.values);
      navigate(`/suporte/${c.id}`, { replace: true });
    });
  };
  return (
    <form onSubmit={enviar} noValidate>
      <PageHeader
        title="Abrir chamado"
        icon="bi-headset"
        actions={
          <Link to="/suporte" className="btn secondary">
            <i className="bi bi-arrow-left" /> Voltar
          </Link>
        }
      />
      <Card>
        <div className="form-grid">
          {f.erroGeral && <Alert tone="danger">{f.erroGeral}</Alert>}
          <Field
            label="Categoria"
            required
            className="c4"
            error={f.errors.categoria}
            htmlFor="categoria"
          >
            <select {...f.bind("categoria")}>
              <option value="">Selecione</option>
              {CATEGORIAS_CHAMADO.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Assunto" required className="c8" error={f.errors.assunto} htmlFor="assunto">
            <input {...f.bind("assunto")} />
          </Field>
          <Field
            label="Descreva sua solicitação"
            required
            error={f.errors.mensagem}
            htmlFor="mensagem"
          >
            <textarea {...f.bind("mensagem")} rows={6} />
          </Field>
        </div>
        <div className="form-actions">
          <Button type="submit" loading={f.enviando} icon="bi-send">
            Enviar
          </Button>
        </div>
      </Card>
    </form>
  );
}

export function ChatChamado({ admin = false }: { admin?: boolean }) {
  const { id } = useParams();
  const toast = useToast();
  const base = admin ? "/admin/chamados" : "/suporte/chamados";
  const {
    data: c,
    error,
    loading,
    reload,
    setData,
  } = useApi(() => api.get<Chamado>(`${base}/${id}`), [id]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible")
        api
          .get<Chamado>(`${base}/${id}`)
          .then(setData)
          .catch(() => undefined);
    }, 15000);
    return () => clearInterval(t);
  }, [base, id, setData]);
  useEffect(() => fim.current?.scrollIntoView({ block: "end" }), [c]);

  const exec = async (fn: () => Promise<Chamado>) => {
    setEnviando(true);
    try {
      setData(await fn());
    } catch (e) {
      toast.erro(e);
    } finally {
      setEnviando(false);
    }
  };
  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!texto.trim()) return;
    void exec(async () => {
      const r = await api.post<Chamado>(
        admin ? `${base}/${id}/responder` : `${base}/${id}/mensagens`,
        { mensagem: texto },
      );
      setTexto("");
      return r;
    });
  };

  if (loading && !c) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!c) return null;
  const msgs = Array.isArray(c.mensagens) ? c.mensagens : [];
  return (
    <>
      <PageHeader
        title={c.assunto}
        icon="bi-chat-dots"
        sub={
          <span className="row">
            Protocolo <code>{c.protocolo}</code> · {c.categoria} · <StatusChamado s={c.status} />
            {admin && c.usuario_nome && ` · ${c.usuario_nome} <${c.usuario_email}>`}
          </span>
        }
        actions={
          <>
            <Link to={admin ? "/admin/chamados" : "/suporte"} className="btn secondary">
              <i className="bi bi-arrow-left" /> Voltar
            </Link>
            {admin && c.status === "aberto" && (
              <Button
                variant="secondary"
                onClick={() => exec(() => api.post(`${base}/${id}/aceitar`))}
              >
                Aceitar
              </Button>
            )}
            {c.status !== "fechado" && (
              <Button
                variant="danger"
                icon="bi-lock"
                onClick={() =>
                  exec(() => api.post(admin ? `${base}/${id}/fechar` : `${base}/${id}/encerrar`))
                }
              >
                Encerrar
              </Button>
            )}
          </>
        }
      />
      <Card>
        <div className="chat" aria-live="polite">
          {msgs.map((m) => (
            <div key={m.id} className={`msg ${m.autor}`}>
              {m.mensagem}
              <div className="meta">
                {m.autor === "suporte" ? "Equipe FINC" : admin ? "Cliente" : "Você"} ·{" "}
                {dataHoraBR(m.criado_em)}
              </div>
            </div>
          ))}
          <div ref={fim} />
        </div>
        {c.status !== "fechado" ? (
          <form className="row mt" onSubmit={enviar}>
            <input
              className="input"
              style={{ flex: 1 }}
              aria-label="Mensagem"
              placeholder="Digite sua mensagem..."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
            <Button type="submit" loading={enviando} icon="bi-send">
              Enviar
            </Button>
          </form>
        ) : (
          <p className="muted small mt">Chamado encerrado.</p>
        )}
      </Card>
    </>
  );
}

export function AdminChamados() {
  const [status, setStatus] = useState("aberto");
  const navigate = useNavigate();
  const { data, error, loading, reload } = useApi(
    () => api.get<Chamado[]>(`/admin/chamados${status ? `?status=${status}` : ""}`),
    [status],
  );
  const feedbacks = useApi(() =>
    api.get<
      {
        id: string;
        mensagem: string;
        criado_em: string;
        usuario_nome: string | null;
        usuario_email: string | null;
      }[]
    >("/admin/feedbacks"),
  );
  return (
    <>
      <PageHeader
        title="Chamados (equipe de suporte)"
        icon="bi-inboxes"
        sub="Visível apenas para administradores."
      />
      <div className="tabs">
        {[
          ["aberto", "Aguardando"],
          ["aceito", "Em atendimento"],
          ["fechado", "Encerrados"],
          ["", "Todos"],
        ].map(([v, l]) => (
          <button key={v} className={status === v ? "active" : ""} onClick={() => setStatus(v!)}>
            {l}
          </button>
        ))}
      </div>
      <ErrorBox error={error} onRetry={reload} />
      {loading && !data ? (
        <Loading />
      ) : data?.length === 0 ? (
        <Card>
          <Empty>Nenhum chamado.</Empty>
        </Card>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Protocolo</th>
                <th>Cliente</th>
                <th>Assunto</th>
                <th>Atualizado</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((c) => (
                <tr
                  key={c.id}
                  className="clickable"
                  onClick={() => navigate(`/admin/chamados/${c.id}`)}
                >
                  <td>
                    <code>{c.protocolo}</code>
                  </td>
                  <td>
                    {c.usuario_nome}
                    <div className="muted small">{c.usuario_email}</div>
                  </td>
                  <td>{c.assunto}</td>
                  <td>{dataHoraBR(c.atualizado_em)}</td>
                  <td>
                    <StatusChamado s={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Card title="Feedbacks recebidos" icon="bi-lightbulb" className="mt">
        {feedbacks.data?.length === 0 ? (
          <p className="muted small">Nenhum feedback.</p>
        ) : (
          <div className="stack">
            {feedbacks.data?.map((f) => (
              <div
                key={f.id}
                className="notif-item"
                style={{ border: "1px solid var(--border)", borderRadius: 10 }}
              >
                <strong>{f.usuario_nome ?? "Usuário removido"}</strong>{" "}
                <span className="muted small">
                  {f.usuario_email} · {dataHoraBR(f.criado_em)}
                </span>
                <p>{f.mensagem}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

/* ======================= Importação ======================= */

interface Relatorio {
  total: number;
  importados: number;
  rejeitados: number;
  erros: { linha: number; erros: { campo: string; mensagem: string }[] }[];
  colunasIgnoradas: string[];
}

const ENTIDADES: Record<string, { titulo: string; voltar: string }> = {
  clientes: { titulo: "clientes", voltar: "/clientes" },
  produtos: { titulo: "produtos", voltar: "/produtos" },
  servicos: { titulo: "serviços", voltar: "/servicos" },
};

export function Importar() {
  const { entidade = "" } = useParams();
  const info = ENTIDADES[entidade];
  const toast = useToast();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [rel, setRel] = useState<Relatorio | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<Error | null>(null);
  if (!info) return <ErrorBox error={new Error("Tipo de importação inválido.")} />;

  const enviar = async () => {
    if (!arquivo) return;
    setEnviando(true);
    setErro(null);
    setRel(null);
    try {
      const fd = new FormData();
      fd.append("arquivo", arquivo);
      const r = await api.upload<Relatorio>(`/importacao/${entidade}`, fd);
      setRel(r);
      if (r.importados) toast.sucesso(`${r.importados} registro(s) importado(s).`);
    } catch (e) {
      setErro(e as Error);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <PageHeader
        title={`Importar ${info.titulo}`}
        icon="bi-upload"
        actions={
          <Link to={info.voltar} className="btn secondary">
            <i className="bi bi-arrow-left" /> Voltar
          </Link>
        }
      />
      <Card title="1. Baixe o modelo" icon="bi-file-earmark-spreadsheet">
        <p className="small">
          Use o modelo CSV (separado por “;”) ou uma planilha .xlsx com os mesmos cabeçalhos. Os
          modelos .xlsx da versão anterior da FINC também são aceitos.
        </p>
        <Button
          variant="secondary"
          className="mt"
          icon="bi-download"
          onClick={() =>
            api
              .download(`/importacao/${entidade}/modelo.csv`, `modelo-${entidade}.csv`)
              .catch(toast.erro)
          }
        >
          Baixar modelo CSV
        </Button>
      </Card>
      <Card title="2. Envie o arquivo" icon="bi-cloud-upload">
        <div className="stack">
          <ErrorBox error={erro} />
          <input
            type="file"
            accept=".csv,.xlsx"
            aria-label="Arquivo da planilha"
            onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          />
          <div>
            <Button loading={enviando} disabled={!arquivo} icon="bi-upload" onClick={enviar}>
              Importar
            </Button>
          </div>
        </div>
      </Card>
      {rel && (
        <Card title="Resultado" icon="bi-clipboard-check">
          <div className="grid grid-3">
            <div className="kpi">
              <span className="label">Linhas lidas</span>
              <span className="value">{rel.total}</span>
            </div>
            <div className="kpi">
              <span className="label">Importadas</span>
              <span className="value" style={{ color: "var(--success)" }}>
                {rel.importados}
              </span>
            </div>
            <div className="kpi">
              <span className="label">Rejeitadas</span>
              <span
                className="value"
                style={{ color: rel.rejeitados ? "var(--danger)" : undefined }}
              >
                {rel.rejeitados}
              </span>
            </div>
          </div>
          {rel.colunasIgnoradas.length > 0 && (
            <Alert tone="warning">
              Colunas não reconhecidas (ignoradas): {rel.colunasIgnoradas.join(", ")}
            </Alert>
          )}
          {rel.erros.length > 0 && (
            <div className="table-wrap mt">
              <table className="table">
                <thead>
                  <tr>
                    <th>Linha</th>
                    <th>Problemas</th>
                  </tr>
                </thead>
                <tbody>
                  {rel.erros.map((e) => (
                    <tr key={e.linha}>
                      <td>{e.linha}</td>
                      <td>
                        {e.erros
                          .map((x) => `${x.campo ? `${x.campo}: ` : ""}${x.mensagem}`)
                          .join("; ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </>
  );
}
