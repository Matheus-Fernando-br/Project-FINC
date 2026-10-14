import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  REGIMES_TRIBUTARIOS,
  UFS,
  changePasswordSchema,
  configFiscalSchema,
  formatCpfCnpj,
  perfilSchema,
  type Preferencias,
} from "@finc/shared";
import { api } from "../../api/client";
import type { Assinatura, Registro } from "../../api/types";
import { aparencia, type Tema } from "../../aparencia";
import { useAuth } from "../../auth/AuthContext";
import {
  Alert,
  Badge,
  Button,
  Card,
  ErrorBox,
  Field,
  Loading,
  Modal,
  PageHeader,
  useToast,
} from "../../components/ui";
import { dataBR, dataHoraBR, formatBRL } from "../../format";
import { useApi } from "../../hooks/useApi";
import { useForm } from "../../hooks/useForm";
import { PlanoCard } from "../publico/Paginas";

/* ======================= Planos ======================= */

export function Planos() {
  const { recarregar } = useAuth();
  const toast = useToast();
  const { data, error, loading, reload } = useApi(() => api.get<Assinatura>("/assinatura"));
  const [trocando, setTrocando] = useState("");
  const [erro, setErro] = useState<Error | null>(null);

  const trocar = async (codigo: string) => {
    setTrocando(codigo);
    setErro(null);
    try {
      await api.put("/assinatura", { plano_codigo: codigo });
      toast.sucesso("Plano alterado.");
      await Promise.all([reload(), recarregar()]);
    } catch (e) {
      setErro(e as Error);
    } finally {
      setTrocando("");
    }
  };

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!data) return null;
  return (
    <>
      <PageHeader
        title="Planos"
        icon="bi-stars"
        sub="Compare os planos e acompanhe o histórico da sua assinatura."
      />
      <ErrorBox error={erro} />
      {!data.gatewayPagamento && (
        <Alert tone="info">
          A cobrança automática ainda não está integrada a um meio de pagamento: a troca de plano é
          aplicada imediatamente e registrada no histórico.
        </Alert>
      )}
      <div className="grid grid-2 mt">
        <PlanoCard
          plano={data.plano}
          destaque
          acao={<Badge tone="success">Seu plano atual</Badge>}
        />
        {data.disponiveis.map((p) => (
          <PlanoCard
            key={p.id}
            plano={p}
            acao={
              <Button loading={trocando === p.codigo} onClick={() => trocar(p.codigo)}>
                {p.valor > data.plano.valor ? "Fazer upgrade" : "Mudar para este plano"}
              </Button>
            }
          />
        ))}
      </div>
      <Card title="Histórico de assinaturas" icon="bi-clock-history" className="mt">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Plano</th>
                <th>Início</th>
                <th>Fim</th>
                <th className="num">Valor/mês</th>
                <th>Status</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              {data.historico.map((h) => (
                <tr key={h.id}>
                  <td>{h.plano_nome}</td>
                  <td>{dataBR(h.inicio)}</td>
                  <td>{dataBR(h.fim)}</td>
                  <td className="num">{formatBRL(h.valor)}</td>
                  <td>
                    {h.status === "ativa" ? (
                      <Badge tone="success">Ativa</Badge>
                    ) : (
                      <Badge>Encerrada</Badge>
                    )}
                  </td>
                  <td>{h.observacao ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

/* ======================= Meus dados ======================= */

export function MeusDados() {
  const toast = useToast();
  const { recarregar } = useAuth();
  const perfil = useApi(() => api.get<Registro>("/perfil"));
  const f = useForm<Record<string, unknown>>({
    nome: "",
    telefone: "",
    inscricao_estadual: "",
    inscricao_municipal: "",
    cep: "",
    uf: "",
    cidade: "",
    logradouro: "",
    bairro: "",
    numero: "",
    complemento: "",
  });

  useEffect(() => {
    if (!perfil.data) return;
    const v: Record<string, unknown> = {};
    for (const k of Object.keys(f.values)) v[k] = perfil.data[k] ?? "";
    f.carregar(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil.data]);

  const cep = async () => {
    const d = String(f.values.cep ?? "").replace(/\D/g, "");
    if (d.length !== 8) return;
    try {
      const r = await api.get<Record<string, string>>(`/util/cep/${d}`);
      f.setValues((v) => ({
        ...v,
        uf: r.uf ?? v.uf,
        cidade: r.cidade || v.cidade,
        logradouro: r.logradouro || v.logradouro,
        bairro: r.bairro || v.bairro,
      }));
    } catch (e) {
      toast.erro(e);
    }
  };

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.validar(perfilSchema)) return;
    void f.enviar(async () => {
      await api.put("/perfil", f.dados());
      toast.sucesso("Dados atualizados.");
      await recarregar();
    });
  };

  if (perfil.loading && !perfil.data) return <Loading />;
  if (perfil.error) return <ErrorBox error={perfil.error} onRetry={perfil.reload} />;
  const p = perfil.data!;
  return (
    <form onSubmit={salvar} noValidate>
      <PageHeader
        title="Meus dados"
        icon="bi-person-circle"
        sub="Esses dados aparecem como emitente nos seus documentos fiscais."
      />
      {f.erroGeral && <Alert tone="danger">{f.erroGeral}</Alert>}
      <Card title="Identificação" icon="bi-person-vcard">
        <div className="form-grid">
          <Field
            label="Nome social / razão social"
            required
            className="c8"
            error={f.errors.nome}
            htmlFor="nome"
          >
            <input {...f.bind("nome")} />
          </Field>
          <Field
            label={p.tipo_pessoa === "FISICA" ? "CPF" : "CNPJ"}
            className="c4"
            hint="Para alterar, abra um chamado no suporte."
          >
            <input value={formatCpfCnpj(p.cpf_cnpj)} readOnly />
          </Field>
          <Field label="E-mail de acesso" className="c6">
            <input value={String(p.email)} readOnly />
          </Field>
          <Field
            label="Telefone"
            required
            className="c6"
            error={f.errors.telefone}
            htmlFor="telefone"
          >
            <input {...f.bind("telefone", "telefone")} type="tel" />
          </Field>
          <Field label="Inscrição estadual" className="c6" htmlFor="inscricao_estadual">
            <input {...f.bind("inscricao_estadual")} />
          </Field>
          <Field label="Inscrição municipal" className="c6" htmlFor="inscricao_municipal">
            <input {...f.bind("inscricao_municipal")} />
          </Field>
        </div>
      </Card>
      <Card title="Endereço do emitente" icon="bi-geo-alt">
        <div className="form-grid">
          <Field
            label="CEP"
            className="c3"
            error={f.errors.cep}
            hint="Preenche o endereço automaticamente."
            htmlFor="cep"
          >
            <input {...f.bind("cep", "cep")} onBlur={cep} />
          </Field>
          <Field label="UF" className="c3" error={f.errors.uf} htmlFor="uf">
            <select {...f.bind("uf")}>
              <option value="">—</option>
              {UFS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </Field>
          <Field label="Cidade" className="c6" htmlFor="cidade">
            <input {...f.bind("cidade")} />
          </Field>
          <Field label="Logradouro" className="c8" htmlFor="logradouro">
            <input {...f.bind("logradouro")} />
          </Field>
          <Field label="Número" className="c4" htmlFor="numero">
            <input {...f.bind("numero")} />
          </Field>
          <Field label="Bairro" className="c6" htmlFor="bairro">
            <input {...f.bind("bairro")} />
          </Field>
          <Field label="Complemento" className="c6" htmlFor="complemento">
            <input {...f.bind("complemento")} />
          </Field>
        </div>
      </Card>
      <div className="form-actions">
        <Button type="submit" loading={f.enviando} icon="bi-check-lg">
          Salvar
        </Button>
      </div>
    </form>
  );
}

/* ======================= Certificado ======================= */

interface CertInfo {
  habilitado: boolean;
  certificado: null | {
    nome_arquivo: string;
    titular: string | null;
    documento: string | null;
    emissor: string | null;
    numero_serie: string;
    valido_de: string;
    valido_ate: string;
    expirado: boolean;
    dias_restantes: number;
  };
}

export function Certificado() {
  const toast = useToast();
  const { data, error, loading, reload } = useApi(() => api.get<CertInfo>("/certificado"));
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<Error | null>(null);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arquivo) return setErro(new Error("Selecione o arquivo .pfx ou .p12."));
    setEnviando(true);
    setErro(null);
    try {
      const fd = new FormData();
      fd.append("arquivo", arquivo);
      fd.append("senha", senha);
      await api.upload("/certificado", fd);
      toast.sucesso("Certificado validado e armazenado com segurança.");
      setArquivo(null);
      setSenha("");
      void reload();
    } catch (e2) {
      setErro(e2 as Error);
    } finally {
      setEnviando(false);
    }
  };

  const remover = async () => {
    try {
      await api.del("/certificado");
      toast.sucesso("Certificado removido.");
      void reload();
    } catch (e) {
      toast.erro(e);
    }
  };

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const c = data?.certificado;
  return (
    <>
      <PageHeader
        title="Certificado digital"
        icon="bi-shield-lock"
        sub="Certificado A1 (.pfx/.p12) usado para assinar documentos quando a integração fiscal estiver ativa."
      />
      {!data?.habilitado && (
        <Alert tone="warning">
          O armazenamento de certificados está desativado neste servidor (variável
          CERT_ENCRYPTION_KEY não configurada).
        </Alert>
      )}
      {c && (
        <Card
          title="Certificado atual"
          icon="bi-patch-check"
          className="mt"
          actions={
            <Button size="sm" variant="danger" icon="bi-trash" onClick={remover}>
              Remover
            </Button>
          }
        >
          <div className="grid grid-2">
            <div>
              <div className="muted small">Titular</div>
              <strong>{c.titular ?? "—"}</strong>
            </div>
            <div>
              <div className="muted small">CPF/CNPJ</div>
              {c.documento ? formatCpfCnpj(c.documento) : "—"}
            </div>
            <div>
              <div className="muted small">Emissor</div>
              {c.emissor ?? "—"}
            </div>
            <div>
              <div className="muted small">Validade</div>
              {dataBR(c.valido_de)} a {dataBR(c.valido_ate)}{" "}
              {c.expirado ? (
                <Badge tone="danger">Expirado</Badge>
              ) : c.dias_restantes <= 30 ? (
                <Badge tone="warning">Vence em {c.dias_restantes} dias</Badge>
              ) : (
                <Badge tone="success">Válido</Badge>
              )}
            </div>
          </div>
        </Card>
      )}
      <Card
        title={c ? "Substituir certificado" : "Enviar certificado"}
        icon="bi-upload"
        className="mt"
      >
        <form className="stack" onSubmit={enviar}>
          <ErrorBox error={erro} />
          <Field label="Arquivo do certificado (.pfx ou .p12)" required htmlFor="arquivo">
            <input
              id="arquivo"
              type="file"
              accept=".pfx,.p12"
              onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
            />
          </Field>
          <Field label="Senha do certificado" required htmlFor="senha_cert">
            <input
              id="senha_cert"
              type="password"
              autoComplete="off"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </Field>
          <p className="muted small">
            O arquivo é validado (senha, titular e validade) e armazenado cifrado com AES-256-GCM. O
            CPF/CNPJ do certificado precisa ser o mesmo da sua conta.
          </p>
          <div>
            <Button
              type="submit"
              loading={enviando}
              disabled={!data?.habilitado}
              icon="bi-shield-check"
            >
              Validar e salvar
            </Button>
          </div>
        </form>
      </Card>
      <Card title="Como obter seu certificado A1" icon="bi-question-circle" className="mt">
        <ol style={{ margin: 0, paddingLeft: 18 }} className="stack">
          <li>
            Adquira um certificado e-CNPJ ou e-CPF modelo A1 em uma autoridade certificadora
            credenciada pela ICP-Brasil.
          </li>
          <li>
            Após a validação de identidade, baixe o arquivo .pfx/.p12 e guarde a senha definida.
          </li>
          <li>
            Envie o arquivo nesta tela. O certificado A1 tem validade de 1 ano: a FINC avisa quando
            estiver perto de vencer.
          </li>
        </ol>
      </Card>
    </>
  );
}

/* ======================= Configurações ======================= */

const SECOES_CONFIG = [
  {
    to: "/configuracoes/fiscal",
    icon: "bi-receipt-cutoff",
    titulo: "Fiscal",
    texto: "Ambiente, série, numeração, natureza da operação, CFOP padrão e regime tributário.",
  },
  {
    to: "/configuracoes/preferencias",
    icon: "bi-sliders",
    titulo: "Geral e atalhos",
    texto: "Página inicial, formato de data, modo compacto e atalhos do painel.",
  },
  {
    to: "/configuracoes/aparencia",
    icon: "bi-palette",
    titulo: "Aparência",
    texto: "Tema claro/escuro, tamanho da fonte e negrito (neste dispositivo).",
  },
  {
    to: "/configuracoes/notificacoes",
    icon: "bi-bell",
    titulo: "Notificações",
    texto: "Canais de aviso e histórico de notificações.",
  },
  {
    to: "/configuracoes/seguranca",
    icon: "bi-shield-lock",
    titulo: "Segurança e privacidade",
    texto: "Senha, sessões ativas, atividade da conta, exportação e exclusão (LGPD).",
  },
  {
    to: "/configuracoes/integracoes",
    icon: "bi-plug",
    titulo: "Integrações",
    texto: "Situação das integrações externas (e-mail, Telegram, certificado, fiscal).",
  },
  {
    to: "/suporte",
    icon: "bi-headset",
    titulo: "Ajuda e suporte",
    texto: "Chamados, status do sistema e envio de feedback.",
  },
];

export function Configuracoes() {
  return (
    <>
      <PageHeader title="Configurações" icon="bi-gear" />
      <div className="grid grid-3">
        {SECOES_CONFIG.map((s) => (
          <Link key={s.to} to={s.to} style={{ color: "inherit", textDecoration: "none" }}>
            <Card>
              <div className="stack">
                <i
                  className={`bi ${s.icon}`}
                  style={{ fontSize: "1.5rem", color: "var(--brand)" }}
                />
                <h3>{s.titulo}</h3>
                <p className="muted small">{s.texto}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}

const VoltarConfig = () => (
  <Link to="/configuracoes" className="btn secondary">
    <i className="bi bi-arrow-left" /> Configurações
  </Link>
);

export function ConfigFiscal() {
  const toast = useToast();
  const cfg = useApi(() => api.get<Record<string, unknown>>("/config/fiscal"));
  const f = useForm<Record<string, unknown>>({});
  useEffect(() => {
    if (cfg.data)
      f.setValues({
        ...cfg.data,
        natureza_operacao: cfg.data.natureza_operacao ?? "",
        cfop_padrao: cfg.data.cfop_padrao ?? "",
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.data]);
  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      ...f.values,
      serie: Number(f.values.serie),
      proximo_numero: Number(f.values.proximo_numero),
    };
    const r = configFiscalSchema.safeParse(body);
    if (!r.success) {
      f.setErroGeral(r.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    void f.enviar(async () => {
      await api.put("/config/fiscal", body);
      toast.sucesso("Configuração fiscal salva.");
      void cfg.reload();
    });
  };
  if (cfg.loading && !cfg.data) return <Loading />;
  if (cfg.error) return <ErrorBox error={cfg.error} onRetry={cfg.reload} />;
  return (
    <form onSubmit={salvar}>
      <PageHeader title="Configuração fiscal" icon="bi-receipt-cutoff" actions={<VoltarConfig />} />
      {f.erroGeral && <Alert tone="danger">{f.erroGeral}</Alert>}
      <Card title="Emissão" icon="bi-send">
        <div className="form-grid">
          <Field
            label="Ambiente"
            className="c6"
            hint="Produção exige provedor fiscal homologado (ver Integrações)."
            htmlFor="ambiente"
          >
            <select {...f.bind("ambiente")}>
              <option value="homologacao">Homologação (sem valor fiscal)</option>
              <option value="producao">Produção</option>
            </select>
          </Field>
          <Field label="Tipo de emissão" className="c6" htmlFor="tipo_emissao">
            <select {...f.bind("tipo_emissao")}>
              <option value="normal">Normal</option>
              <option value="contingencia">Contingência</option>
            </select>
          </Field>
          <Field label="Regime tributário" className="c6" htmlFor="regime_tributario">
            <select {...f.bind("regime_tributario")}>
              {REGIMES_TRIBUTARIOS.map((r) => (
                <option key={r.codigo} value={r.codigo}>
                  {r.descricao}
                </option>
              ))}
            </select>
          </Field>
          <label className="check c6">
            <input
              type="checkbox"
              checked={Boolean(f.values.somar_impostos)}
              onChange={(e) => f.set("somar_impostos", e.target.checked)}
            />{" "}
            Somar tributos (ICMS, ISS, PIS/COFINS) ao total do documento
          </label>
        </div>
      </Card>
      <Card title="Natureza e CFOP" icon="bi-tags">
        <div className="form-grid">
          <Field label="Natureza da operação padrão" className="c8" htmlFor="natureza_operacao">
            <input {...f.bind("natureza_operacao")} />
          </Field>
          <Field label="CFOP padrão" className="c4" htmlFor="cfop_padrao">
            <input {...f.bind("cfop_padrao")} />
          </Field>
        </div>
      </Card>
      <Card title="Série e numeração" icon="bi-123">
        <div className="form-grid">
          <Field label="Série" className="c4" htmlFor="serie">
            <input {...f.bind("serie")} type="number" min={1} max={999} />
          </Field>
          <Field
            label="Próximo número"
            className="c4"
            hint="Nunca reutiliza números já emitidos."
            htmlFor="proximo_numero"
          >
            <input {...f.bind("proximo_numero")} type="number" min={1} />
          </Field>
          <label className="check c4">
            <input
              type="checkbox"
              checked={Boolean(f.values.numeracao_automatica)}
              onChange={(e) => f.set("numeracao_automatica", e.target.checked)}
            />{" "}
            Numeração automática
          </label>
        </div>
      </Card>
      <div className="form-actions">
        <Button type="submit" loading={f.enviando} icon="bi-check-lg">
          Salvar
        </Button>
      </div>
    </form>
  );
}

const ATALHOS_DISPONIVEIS = [
  { label: "Emitir nota", icon: "bi-receipt", to: "/notas/nova" },
  { label: "Novo cliente", icon: "bi-person-plus", to: "/clientes/novo" },
  { label: "Novo produto", icon: "bi-box-seam", to: "/produtos/novo" },
  { label: "Novo serviço", icon: "bi-tools", to: "/servicos/novo" },
  { label: "Novo pedido", icon: "bi-cart-plus", to: "/pedidos/novo" },
  { label: "Financeiro", icon: "bi-cash-coin", to: "/financeiro" },
  { label: "Estoque", icon: "bi-boxes", to: "/estoque" },
  { label: "Contadores", icon: "bi-person-badge", to: "/contadores" },
  { label: "Notas emitidas", icon: "bi-list-check", to: "/notas?status=emitida" },
  { label: "Suporte", icon: "bi-headset", to: "/suporte" },
];

export function ConfigPreferencias() {
  const toast = useToast();
  const prefs = useApi(() => api.get<Preferencias>("/config/preferencias"));
  const [p, setP] = useState<Preferencias | null>(null);
  const [salvando, setSalvando] = useState(false);
  useEffect(() => setP(prefs.data), [prefs.data]);
  if (prefs.loading && !prefs.data) return <Loading />;
  if (prefs.error || !p) return <ErrorBox error={prefs.error} onRetry={prefs.reload} />;

  const toggleAtalho = (a: (typeof ATALHOS_DISPONIVEIS)[number]) => {
    const tem = p.atalhos.some((x) => x.to === a.to);
    if (!tem && p.atalhos.length >= 9) return toast.erro("Máximo de 9 atalhos.");
    setP({ ...p, atalhos: tem ? p.atalhos.filter((x) => x.to !== a.to) : [...p.atalhos, a] });
  };
  const salvar = async () => {
    setSalvando(true);
    try {
      await api.put("/config/preferencias", p);
      document.documentElement.setAttribute("data-compact", String(p.modo_compacto));
      toast.sucesso("Preferências salvas.");
    } catch (e) {
      toast.erro(e);
    } finally {
      setSalvando(false);
    }
  };
  return (
    <>
      <PageHeader title="Geral e atalhos" icon="bi-sliders" actions={<VoltarConfig />} />
      <Card title="Geral" icon="bi-globe">
        <div className="form-grid">
          <Field label="Fuso horário" className="c6" htmlFor="fuso">
            <select
              id="fuso"
              value={p.fuso_horario}
              onChange={(e) => setP({ ...p, fuso_horario: e.target.value })}
            >
              {[
                "America/Sao_Paulo",
                "America/Manaus",
                "America/Belem",
                "America/Fortaleza",
                "America/Recife",
                "America/Cuiaba",
                "America/Porto_Velho",
                "America/Rio_Branco",
                "America/Noronha",
              ].map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
          </Field>
          <Field label="Formato de data" className="c6" htmlFor="fd">
            <select
              id="fd"
              value={p.formato_data}
              onChange={(e) =>
                setP({ ...p, formato_data: e.target.value as Preferencias["formato_data"] })
              }
            >
              <option value="dd/MM/yyyy">dd/mm/aaaa</option>
              <option value="yyyy-MM-dd">aaaa-mm-dd</option>
              <option value="MM/dd/yyyy">mm/dd/aaaa</option>
            </select>
          </Field>
          <Field label="Página inicial após o login" className="c6" htmlFor="pi">
            <select
              id="pi"
              value={p.pagina_inicial}
              onChange={(e) => setP({ ...p, pagina_inicial: e.target.value })}
            >
              <option value="/app">Painel</option>
              <option value="/notas">Notas fiscais</option>
              <option value="/financeiro">Financeiro</option>
              <option value="/clientes">Clientes</option>
            </select>
          </Field>
          <label className="check c6">
            <input
              type="checkbox"
              checked={p.modo_compacto}
              onChange={(e) => setP({ ...p, modo_compacto: e.target.checked })}
            />{" "}
            Modo compacto
          </label>
        </div>
      </Card>
      <Card title="Atalhos do painel" icon="bi-lightning-charge">
        <div className="row">
          {ATALHOS_DISPONIVEIS.map((a) => {
            const ativo = p.atalhos.some((x) => x.to === a.to);
            return (
              <Button
                key={a.to}
                variant={ativo ? "primary" : "secondary"}
                size="sm"
                icon={a.icon}
                aria-pressed={ativo}
                onClick={() => toggleAtalho(a)}
              >
                {a.label}
              </Button>
            );
          })}
        </div>
        <p className="muted small mt">{p.atalhos.length} de 9 atalhos selecionados.</p>
      </Card>
      <div className="form-actions">
        <Button loading={salvando} icon="bi-check-lg" onClick={salvar}>
          Salvar
        </Button>
      </div>
    </>
  );
}

export function ConfigAparencia() {
  const toast = useToast();
  const [tema, setTema] = useState<Tema>(aparencia.tema());
  const [fonte, setFonte] = useState(aparencia.fonte());
  const [negrito, setNegrito] = useState(aparencia.negrito());
  return (
    <>
      <PageHeader
        title="Aparência"
        icon="bi-palette"
        sub="Preferências salvas apenas neste navegador."
        actions={<VoltarConfig />}
      />
      <Card>
        <div className="form-grid">
          <Field label="Tema" className="c4" htmlFor="tema">
            <select id="tema" value={tema} onChange={(e) => setTema(e.target.value as Tema)}>
              <option value="auto">Automático (sistema)</option>
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
            </select>
          </Field>
          <Field label={`Tamanho da fonte (${fonte}%)`} className="c4" htmlFor="fonte">
            <input
              id="fonte"
              type="range"
              min={85}
              max={130}
              step={5}
              value={fonte}
              onChange={(e) => setFonte(Number(e.target.value))}
            />
          </Field>
          <label className="check c4">
            <input
              type="checkbox"
              checked={negrito}
              onChange={(e) => setNegrito(e.target.checked)}
            />{" "}
            Texto em negrito
          </label>
        </div>
        <div className="form-actions">
          <Button
            icon="bi-check-lg"
            onClick={() => {
              aparencia.salvar(tema, fonte, negrito);
              toast.sucesso("Aparência aplicada.");
            }}
          >
            Aplicar
          </Button>
        </div>
      </Card>
    </>
  );
}

interface Sessao {
  id: string;
  ip: string | null;
  user_agent: string | null;
  criado_em: string;
  ultimo_uso_em: string;
  atual: boolean;
}

export function ConfigSeguranca() {
  const toast = useToast();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const sessoes = useApi(() => api.get<Sessao[]>("/auth/sessoes"));
  const atividade = useApi(() =>
    api.get<{ acao: string; ip: string | null; criado_em: string }[]>("/conta/atividade"),
  );
  const f = useForm({ senha_atual: "", nova_senha: "", confirmar: "" });
  const [excluir, setExcluir] = useState(false);
  const [exclusao, setExclusao] = useState({ senha: "", confirmacao: "" });
  const [erroExclusao, setErroExclusao] = useState<Error | null>(null);

  const trocarSenha = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.validar(changePasswordSchema)) return;
    if (f.values.nova_senha !== f.values.confirmar)
      return f.setErrors({ confirmar: "As senhas não conferem" });
    void f.enviar(async () => {
      const r = await api.post<{ message: string }>("/auth/alterar-senha", {
        senha_atual: f.values.senha_atual,
        nova_senha: f.values.nova_senha,
      });
      toast.sucesso(r.message);
      f.setValues({ senha_atual: "", nova_senha: "", confirmar: "" });
      void sessoes.reload();
    });
  };
  const revogar = async (id: string) => {
    try {
      await api.del(`/auth/sessoes/${id}`);
      toast.sucesso("Sessão encerrada.");
      void sessoes.reload();
    } catch (e) {
      toast.erro(e);
    }
  };
  const confirmarExclusao = async () => {
    setErroExclusao(null);
    try {
      await api.post("/conta/excluir", exclusao);
      await logout().catch(() => undefined);
      navigate("/", { replace: true });
    } catch (e) {
      setErroExclusao(e as Error);
    }
  };

  return (
    <>
      <PageHeader
        title="Segurança e privacidade"
        icon="bi-shield-lock"
        actions={<VoltarConfig />}
      />
      <Card title="Alterar senha" icon="bi-key">
        <form className="form-grid" onSubmit={trocarSenha} noValidate>
          {f.erroGeral && <Alert tone="danger">{f.erroGeral}</Alert>}
          <Field
            label="Senha atual"
            required
            className="c4"
            error={f.errors.senha_atual}
            htmlFor="senha_atual"
          >
            <input {...f.bind("senha_atual")} type="password" autoComplete="current-password" />
          </Field>
          <Field
            label="Nova senha"
            required
            className="c4"
            error={f.errors.nova_senha}
            htmlFor="nova_senha"
          >
            <input {...f.bind("nova_senha")} type="password" autoComplete="new-password" />
          </Field>
          <Field
            label="Confirmar nova senha"
            required
            className="c4"
            error={f.errors.confirmar}
            htmlFor="confirmar"
          >
            <input {...f.bind("confirmar")} type="password" autoComplete="new-password" />
          </Field>
          <div className="form-actions" style={{ marginTop: 0 }}>
            <Button type="submit" loading={f.enviando}>
              Alterar senha
            </Button>
          </div>
        </form>
      </Card>
      <Card title="Sessões ativas" icon="bi-laptop">
        {sessoes.loading && !sessoes.data ? (
          <Loading />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Dispositivo</th>
                  <th>IP</th>
                  <th>Último uso</th>
                  <th className="acoes" />
                </tr>
              </thead>
              <tbody>
                {sessoes.data?.map((s) => (
                  <tr key={s.id}>
                    <td className="small">
                      {s.user_agent || "Desconhecido"}{" "}
                      {s.atual && <Badge tone="success">Esta sessão</Badge>}
                    </td>
                    <td>{s.ip ?? "—"}</td>
                    <td>{dataHoraBR(s.ultimo_uso_em)}</td>
                    <td className="acoes">
                      {!s.atual && (
                        <Button size="sm" variant="secondary" onClick={() => revogar(s.id)}>
                          Encerrar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Card title="Atividade recente" icon="bi-activity">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Ação</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {atividade.data?.slice(0, 30).map((a, i) => (
                <tr key={i}>
                  <td>{dataHoraBR(a.criado_em)}</td>
                  <td>
                    <code>{a.acao}</code>
                  </td>
                  <td>{a.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Seus dados (LGPD)" icon="bi-file-earmark-lock">
        <div className="row">
          <Button
            variant="secondary"
            icon="bi-download"
            onClick={() =>
              api.download("/conta/exportar", "finc-meus-dados.json").catch(toast.erro)
            }
          >
            Exportar meus dados (JSON)
          </Button>
          <Button variant="danger" icon="bi-trash" onClick={() => setExcluir(true)}>
            Excluir minha conta
          </Button>
        </div>
      </Card>
      <Modal
        title="Excluir conta definitivamente"
        open={excluir}
        onClose={() => setExcluir(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setExcluir(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              disabled={exclusao.confirmacao !== "EXCLUIR" || !exclusao.senha}
              onClick={confirmarExclusao}
            >
              Excluir conta
            </Button>
          </>
        }
      >
        <div className="stack">
          <Alert tone="danger">
            Todos os seus dados (clientes, produtos, documentos, financeiro) serão apagados. Exporte
            antes se precisar.
          </Alert>
          <ErrorBox error={erroExclusao} />
          <Field label="Senha" required htmlFor="ex_senha">
            <input
              id="ex_senha"
              type="password"
              value={exclusao.senha}
              onChange={(e) => setExclusao({ ...exclusao, senha: e.target.value })}
            />
          </Field>
          <Field label='Digite "EXCLUIR" para confirmar' required htmlFor="ex_conf">
            <input
              id="ex_conf"
              value={exclusao.confirmacao}
              onChange={(e) => setExclusao({ ...exclusao, confirmacao: e.target.value })}
            />
          </Field>
        </div>
      </Modal>
    </>
  );
}

interface Health {
  status: string;
  versao: string;
  banco: { ok: boolean; tipo: string };
  integracoes: { smtp: boolean; telegram: boolean; telegramWebhook: boolean; certificado: boolean };
}

const Situacao = ({ ok }: { ok: boolean }) =>
  ok ? <Badge tone="success">Configurado</Badge> : <Badge tone="warning">Não configurado</Badge>;

export function ConfigIntegracoes() {
  const { data, error, loading, reload } = useApi(() => api.get<Health>("/health"));
  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  const i = data!.integracoes;
  const linhas = [
    {
      nome: "E-mail (SMTP)",
      ok: i.smtp,
      uso: "Redefinição de senha, notificações por e-mail e envio de documentos ao contador.",
      vars: "SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM",
    },
    {
      nome: "Telegram (suporte)",
      ok: i.telegram,
      uso: "Aviso de novos chamados e feedbacks para a equipe.",
      vars: "TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID",
    },
    {
      nome: "Webhook do Telegram",
      ok: i.telegramWebhook,
      uso: "Responder/aceitar/encerrar chamados pelo bot.",
      vars: "TELEGRAM_WEBHOOK_SECRET",
    },
    {
      nome: "Cofre de certificados",
      ok: i.certificado,
      uso: "Armazenamento cifrado do certificado A1.",
      vars: "CERT_ENCRYPTION_KEY",
    },
    {
      nome: "Provedor fiscal (SEFAZ/Prefeitura)",
      ok: false,
      uso: "Transmissão de NF-e/NFC-e/NFS-e com validade fiscal.",
      vars: "Requer contratação de provedor homologado — ver docs/integracoes.md",
    },
    {
      nome: "Meio de pagamento",
      ok: false,
      uso: "Cobrança automática das assinaturas.",
      vars: "Requer gateway (ex.: Mercado Pago, Stripe) — ver docs/integracoes.md",
    },
  ];
  return (
    <>
      <PageHeader
        title="Integrações"
        icon="bi-plug"
        sub="Integrações externas dependem de credenciais configuradas no servidor pela equipe técnica."
        actions={<VoltarConfig />}
      />
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Integração</th>
              <th>Situação</th>
              <th>Para que serve</th>
              <th>Configuração</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.nome}>
                <td>
                  <strong>{l.nome}</strong>
                </td>
                <td>
                  <Situacao ok={l.ok} />
                </td>
                <td className="small">{l.uso}</td>
                <td className="small">
                  <code>{l.vars}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Card className="mt" title="Consulta de CEP" icon="bi-geo">
        <p className="small">
          Feita pelo servidor no serviço público ViaCEP, sem necessidade de credenciais.
        </p>
      </Card>
    </>
  );
}
