import { Link } from "react-router-dom";
import type { Plano } from "@finc/shared";
import { api } from "../../api/client";
import { Card, ErrorBox, Loading, PageHeader } from "../../components/ui";
import { formatBRL } from "../../format";
import { useApi } from "../../hooks/useApi";

const RECURSOS = [
  {
    icon: "bi-receipt",
    titulo: "Documentos fiscais",
    texto:
      "NF-e, NFC-e e NFS-e com numeração automática, PDF, XML e cancelamento com justificativa.",
  },
  {
    icon: "bi-people",
    titulo: "Cadastros completos",
    texto: "Clientes, produtos e serviços com validação de CPF/CNPJ, NCM, CFOP e alíquotas.",
  },
  {
    icon: "bi-boxes",
    titulo: "Estoque",
    texto: "Saldo atualizado a cada nota emitida, movimentações e alerta de estoque mínimo.",
  },
  {
    icon: "bi-cash-coin",
    titulo: "Financeiro",
    texto: "Contas a pagar e a receber, baixas, estornos e saldo previsto em um só lugar.",
  },
  {
    icon: "bi-cart3",
    titulo: "Pedidos de venda",
    texto: "Registre pedidos e transforme-os em nota fiscal com um clique.",
  },
  {
    icon: "bi-person-badge",
    titulo: "Seu contador por perto",
    texto: "Envie PDF e XML dos documentos direto para o e-mail do seu contador.",
  },
];

export function Landing() {
  return (
    <main>
      <section className="hero">
        <div className="inner">
          <div>
            <h1>Gestão e notas fiscais sem complicação para o seu negócio.</h1>
            <p>
              A FINC reúne emissão de documentos fiscais, cadastros, estoque e financeiro numa
              plataforma simples, pensada para MEIs e pequenas empresas.
            </p>
            <div className="cta">
              <Link to="/cadastro" className="btn">
                Criar conta <i className="bi bi-arrow-right" />
              </Link>
              <Link to="/planos-finc" className="btn secondary">
                Ver planos
              </Link>
            </div>
          </div>
          <div className="mock" aria-hidden>
            <div className="grid grid-2">
              {[
                "Notas emitidas no mês",
                "A receber",
                "Clientes ativos",
                "Produtos com estoque baixo",
              ].map((t, i) => (
                <div
                  key={t}
                  className="kpi"
                  style={{ background: "rgb(255 255 255 / 6%)", padding: 14, borderRadius: 12 }}
                >
                  <span className="label" style={{ color: "#a9c0d6" }}>
                    {t}
                  </span>
                  <span className="value" style={{ color: i === 3 ? "var(--accent)" : "#fff" }}>
                    {["▮▮▮", "R$ ▮▮▮", "▮▮", "▮"][i]}
                  </span>
                </div>
              ))}
            </div>
            <p className="small" style={{ marginTop: 12, fontSize: "0.85rem" }}>
              Seu painel com indicadores calculados a partir dos seus dados reais.
            </p>
          </div>
        </div>
      </section>
      <section className="section">
        <h2>Tudo o que um pequeno negócio precisa</h2>
        <p className="muted">
          Recursos que funcionam juntos: a nota emitida baixa o estoque e lança a conta a receber
          automaticamente.
        </p>
        <div className="grid grid-3 mt">
          {RECURSOS.map((r) => (
            <Card key={r.titulo}>
              <div className="feature stack">
                <i className={`bi ${r.icon}`} aria-hidden />
                <h3>{r.titulo}</h3>
                <p className="muted">{r.texto}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>
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
