import { Link } from "react-router-dom";
import type { Plano } from "@finc/shared";
import { api } from "../../api/client";
import { Card, ErrorBox, Loading, PageHeader } from "../../components/ui";
import { formatBRL } from "../../format";
import { useApi } from "../../hooks/useApi";

const RECURSOS = [
  {
    icon: "bi-receipt",
    titulo: "Notas fiscais",
    texto:
      "NF-e, NFC-e e NFS-e com numeração automática, PDF, XML, cancelamento e envio ao contador.",
  },
  {
    icon: "bi-shop",
    titulo: "Frente de caixa",
    texto: "Venda no balcão em segundos, com NFC-e, troco e recebimento registrado no financeiro.",
  },
  {
    icon: "bi-cart3",
    titulo: "Vendas",
    texto: "Orçamento vira pedido, pedido vira nota. Sem redigitar nada.",
  },
  {
    icon: "bi-boxes",
    titulo: "Suprimentos",
    texto: "Fornecedores, pedidos de compra e estoque atualizado a cada entrada e saída.",
  },
  {
    icon: "bi-cash-coin",
    titulo: "Finanças",
    texto: "Contas a pagar e a receber, baixas, vencidos e saldo previsto.",
  },
  {
    icon: "bi-bar-chart",
    titulo: "Relatórios",
    texto: "Vendas, DRE simplificado, fluxo de caixa e posição de estoque, com exportação.",
  },
];

export function Landing() {
  return (
    <main>
      <section className="hero tema-escuro">
        <div className="eyebrow">
          <span className="dot lg" /> FINC
        </div>
        <h1>A gestão do seu negócio. Simples assim.</h1>
        <p>
          Notas fiscais, vendas, estoque e financeiro em uma única plataforma, pensada para MEIs e
          pequenas empresas.
        </p>
        <div className="cta">
          <Link to="/cadastro" className="btn lg">
            Começar agora
          </Link>
          <Link to="/planos-finc" className="btn ghost lg">
            Ver planos <i className="bi bi-chevron-right" />
          </Link>
        </div>
        <div className="palco" aria-hidden>
          <div className="orb" />
          <div className="janela tema-claro">
            <div className="row" style={{ gap: 6, marginBottom: 18 }}>
              <span className="dot danger" />
              <span className="dot warning" />
              <span className="dot" />
            </div>
            <div className="grid grid-4">
              {[
                ["Faturamento do mês", "bi-graph-up"],
                ["A receber", "bi-arrow-down-circle"],
                ["A pagar", "bi-arrow-up-circle"],
                ["Notas emitidas", "bi-receipt"],
              ].map(([t, i]) => (
                <div
                  key={t}
                  className="kpi"
                  style={{ background: "var(--surface-2)", padding: 16, borderRadius: 16 }}
                >
                  <span className="label">
                    <i className={`bi ${i}`} /> {t}
                  </span>
                  <span className="value" style={{ color: "var(--border-strong)" }}>
                    ••••
                  </span>
                </div>
              ))}
            </div>
            <p
              className="small muted"
              style={{ marginTop: 14, textAlign: "center", fontSize: "0.85rem" }}
            >
              Seu painel, com indicadores calculados a partir dos seus próprios dados.
            </p>
          </div>
        </div>
      </section>
      <div className="faixa branca">
        <section className="section" style={{ textAlign: "center" }}>
          <h2>Do orçamento ao caixa, tudo conectado.</h2>
          <p className="lead" style={{ margin: "0 auto" }}>
            Cada etapa alimenta a próxima: a nota emitida baixa o estoque e lança a conta a receber
            automaticamente.
          </p>
          <div className="fluxo">
            {["Orçamento", "Pedido de venda", "Nota fiscal", "Estoque", "Contas a receber"].map(
              (p, i, arr) => (
                <span key={p} className="row" style={{ gap: 10 }}>
                  <span className="passo">
                    <span className="dot" /> {p}
                  </span>
                  {i < arr.length - 1 && <i className="bi bi-arrow-right" aria-hidden />}
                </span>
              ),
            )}
          </div>
        </section>
      </div>
      <div className="faixa cinza">
        <section className="section">
          <h2>Tudo o que o seu negócio precisa.</h2>
          <p className="lead">
            Módulos organizados como num ERP completo, com a simplicidade de um aplicativo.
          </p>
          <div className="grid grid-3 mt">
            {RECURSOS.map((r) => (
              <Card key={r.titulo}>
                <div className="feature">
                  <span className="icone">
                    <i className={`bi ${r.icon}`} aria-hidden />
                  </span>
                  <h3>{r.titulo}</h3>
                  <p className="muted">{r.texto}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
      <div className="faixa escura tema-escuro">
        <section className="section" style={{ textAlign: "center", paddingBottom: 96 }}>
          <span
            className="orb"
            style={{ width: 64, height: 64, display: "inline-block" }}
            aria-hidden
          />
          <h2 style={{ marginTop: 18 }}>Pronto para começar?</h2>
          <p className="lead" style={{ margin: "0 auto 24px" }}>
            Crie sua conta no plano BÁSICO e evolua para o BLACK quando o negócio crescer.
          </p>
          <Link to="/cadastro" className="btn lg">
            Criar conta
          </Link>
        </section>
      </div>
    </main>
  );
}

export function PlanoCard({
  plano,
  destaque,
  acao,
}: {
  plano: Plano;
  destaque?: boolean;
  acao?: React.ReactNode;
}) {
  const lim = plano.limites;
  const fmt = (v: number | null, s: string) => (v === null ? `${s} ilimitados` : `Até ${v} ${s}`);
  return (
    <Card className={`plan-card ${destaque ? "destaque" : ""}`}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2>{plano.nome}</h2>
        {plano.codigo === "black" && <span className="badge warning">Mais completo</span>}
      </div>
      <div>
        <span className="preco">{formatBRL(plano.valor)}</span> <span className="muted">/mês</span>
      </div>
      <ul>
        <li>
          {lim.notas_mes === null
            ? "Documentos fiscais ilimitados"
            : `Até ${lim.notas_mes} documentos fiscais por mês`}
        </li>
        <li>{fmt(lim.clientes, "clientes")}</li>
        <li>{fmt(lim.produtos, "produtos")}</li>
        <li>{fmt(lim.servicos, "serviços")}</li>
        <li>
          {lim.contadores === null
            ? "Contadores ilimitados"
            : `${lim.contadores} contador${lim.contadores === 1 ? "" : "es"} vinculado${lim.contadores === 1 ? "" : "s"}`}
        </li>
        {plano.detalhes
          .filter((d) => !/^(Até|Documentos|Clientes|\d)/i.test(d))
          .map((d) => (
            <li key={d}>{d}</li>
          ))}
      </ul>
      {acao}
    </Card>
  );
}

export function PlanosPublico() {
  const { data, error, loading, reload } = useApi(() => api.get<Plano[]>("/planos"));
  return (
    <main className="section">
      <PageHeader
        title="Planos FINC"
        sub="Comece no BÁSICO e mude para o BLACK quando o seu negócio crescer."
      />
      {loading && <Loading />}
      <ErrorBox error={error} onRetry={reload} />
      <div className="grid grid-2">
        {data?.map((p) => (
          <PlanoCard
            key={p.id}
            plano={p}
            destaque={p.codigo === "black"}
            acao={
              <Link className="btn" to="/cadastro">
                Começar agora
              </Link>
            }
          />
        ))}
      </div>
      <Card className="mt" title="Todos os planos incluem" icon="bi-check2-all">
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>
            Emissão de documentos auxiliares em PDF e XML, financeiro, estoque e pedidos de venda;
          </li>
          <li>Painel de indicadores calculado com os seus dados;</li>
          <li>Suporte por chamados dentro da plataforma.</li>
        </ul>
      </Card>
    </main>
  );
}

export function QuemSomos() {
  return (
    <main className="section" style={{ maxWidth: 860 }}>
      <PageHeader title="Quem somos" />
      <Card>
        <div className="stack">
          <p>
            A <strong>FINC</strong> nasceu da iniciativa de alunos de Engenharia da UFMG e do
            Unileste com um propósito claro: tornar a tecnologia de gestão empresarial acessível a{" "}
            <strong>pequenos e médios empreendedores</strong>.
          </p>
          <p>
            Nossa plataforma organiza a emissão de documentos fiscais, os cadastros e o controle
            financeiro, ajudando negócios a crescer com mais organização, agilidade e eficiência.
          </p>
          <p className="row">
            <i className="bi bi-instagram" aria-hidden />
            <a
              href="https://www.instagram.com/plataforma.finc/"
              target="_blank"
              rel="noopener noreferrer"
            >
              @plataforma.finc
            </a>
            <i className="bi bi-envelope" aria-hidden style={{ marginLeft: 12 }} />
            <a href="mailto:plataforma.finc@gmail.com">plataforma.finc@gmail.com</a>
          </p>
        </div>
      </Card>
    </main>
  );
}

const FAQ = [
  [
    "Preciso instalar algum programa?",
    "Não. A FINC é 100% online e funciona no navegador do computador ou do celular.",
  ],
  [
    "As notas emitidas têm validade fiscal?",
    "Os documentos gerados pela FINC são emitidos em ambiente de homologação e trazem a marca “sem valor fiscal”. A transmissão à SEFAZ/Prefeitura exige certificado digital A1 e a integração com um provedor fiscal homologado, que pode ser configurada pela equipe técnica.",
  ],
  [
    "Posso enviar os documentos ao meu contador?",
    "Sim. Cadastre seu contador e envie PDF e XML de cada documento por e-mail diretamente da plataforma.",
  ],
  [
    "Como funciona o limite de notas do plano BÁSICO?",
    "O BÁSICO tem um limite mensal de documentos fiscais (veja os valores atuais na página de Planos). No BLACK as emissões são ilimitadas. Você pode trocar de plano a qualquer momento.",
  ],
  [
    "Posso importar meus clientes e produtos de uma planilha?",
    "Sim. Envie arquivos .xlsx ou .csv; a FINC mostra, linha a linha, o que foi importado e o que precisa ser corrigido.",
  ],
  [
    "Meus dados ficam protegidos?",
    "Sim. Senhas são armazenadas com hash forte, cada conta só enxerga os próprios dados e você pode exportar ou excluir sua conta a qualquer momento (LGPD).",
  ],
];

export function Duvidas() {
  return (
    <main className="section" style={{ maxWidth: 860 }}>
      <PageHeader
        title="Ficou com alguma dúvida?"
        sub="Separamos as dúvidas mais comuns. Se precisar, fale com a gente."
      />
      {FAQ.map(([p, r]) => (
        <details key={p} className="faq">
          <summary>{p}</summary>
          <p>{r}</p>
        </details>
      ))}
      <Card className="mt" title="Fale conosco" icon="bi-chat-dots">
        <div className="row">
          <a
            className="btn secondary"
            href="mailto:plataforma.finc@gmail.com?subject=D%C3%BAvida%20sobre%20a%20FINC"
          >
            <i className="bi bi-envelope" /> E-mail
          </a>
          <a
            className="btn secondary"
            href="https://wa.me/553185684262"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="bi bi-whatsapp" /> WhatsApp
          </a>
        </div>
      </Card>
    </main>
  );
}

export function Termos() {
  return (
    <main className="section" style={{ maxWidth: 860 }}>
      <PageHeader title="Termos de uso e política de privacidade" />
      <Card>
        <div className="stack">
          <h3>1. Objeto</h3>
          <p>
            A FINC oferece ferramentas de gestão (cadastros, estoque, financeiro, pedidos) e geração
            de documentos fiscais auxiliares.
          </p>
          <h3>2. Responsabilidades do usuário</h3>
          <p>
            O usuário é responsável pela veracidade dos dados cadastrados, pelas informações fiscais
            (NCM, CFOP, alíquotas) e pela guarda de suas credenciais.
          </p>
          <h3>3. Documentos fiscais</h3>
          <p>
            Sem a integração com um provedor fiscal homologado, os documentos são gerados em
            ambiente de homologação e não possuem validade fiscal.
          </p>
          <h3>4. Dados pessoais (LGPD)</h3>
          <p>
            Tratamos os dados estritamente para prestar o serviço. Você pode consultar sua trilha de
            atividades, exportar todos os seus dados e excluir sua conta em Configurações ›
            Segurança. Certificados digitais são armazenados cifrados (AES-256-GCM).
          </p>
          <h3>5. Planos</h3>
          <p>
            Os limites de cada plano são aplicados pela plataforma. A troca de plano é registrada no
            histórico de assinaturas.
          </p>
        </div>
      </Card>
    </main>
  );
}

export function NotFound() {
  return (
    <main className="section" style={{ textAlign: "center" }}>
      <h1>Página não encontrada</h1>
      <p className="muted mt">O endereço acessado não existe.</p>
      <Link to="/" className="btn mt">
        Voltar ao início
      </Link>
    </main>
  );
}
