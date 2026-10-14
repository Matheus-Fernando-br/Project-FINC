import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { Preferencias } from "@finc/shared";
import { configurarExibicao, dataHoraBR } from "../format";
import { Button, Logo } from "./ui";

interface Notif {
  id: string;
  titulo: string;
  mensagem: string;
  link: string | null;
  lida_em: string | null;
  criado_em: string;
}

const MENU: { grupo?: string; itens: { to: string; label: string; icon: string }[] }[] = [
  { itens: [{ to: "/app", label: "Painel", icon: "bi-speedometer2" }] },
  {
    grupo: "Vendas e fiscal",
    itens: [
      { to: "/notas", label: "Notas fiscais", icon: "bi-receipt" },
      { to: "/pedidos", label: "Pedidos de venda", icon: "bi-cart3" },
    ],
  },
  {
    grupo: "Cadastros",
    itens: [
      { to: "/clientes", label: "Clientes", icon: "bi-people" },
      { to: "/produtos", label: "Produtos", icon: "bi-box-seam" },
      { to: "/servicos", label: "Serviços", icon: "bi-tools" },
      { to: "/estoque", label: "Estoque", icon: "bi-boxes" },
      { to: "/contadores", label: "Contadores", icon: "bi-person-badge" },
    ],
  },
  { grupo: "Finanças", itens: [{ to: "/financeiro", label: "Financeiro", icon: "bi-cash-coin" }] },
  {
    grupo: "Conta",
    itens: [
      { to: "/planos", label: "Planos", icon: "bi-stars" },
      { to: "/certificado", label: "Certificado digital", icon: "bi-shield-lock" },
      { to: "/configuracoes", label: "Configurações", icon: "bi-gear" },
      { to: "/suporte", label: "Suporte", icon: "bi-headset" },
    ],
  },
];

function Notificacoes() {
  const [aberto, setAberto] = useState(false);
  const [dados, setDados] = useState<{ items: Notif[]; naoLidas: number }>({
    items: [],
    naoLidas: 0,
  });
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const loc = useLocation();

  const carregar = () =>
    api
      .get<{ items: Notif[]; naoLidas: number }>("/notificacoes")
      .then(setDados)
      .catch(() => undefined);

  useEffect(() => {
    void carregar();
    const t = setInterval(carregar, 60_000);
    return () => clearInterval(t);
  }, [loc.pathname]);

  useEffect(() => {
    const fora = (e: MouseEvent) =>
      ref.current && !ref.current.contains(e.target as Node) && setAberto(false);
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  const abrir = async (n: Notif) => {
    if (!n.lida_em) await api.post(`/notificacoes/${n.id}/lida`).catch(() => undefined);
    setAberto(false);
    void carregar();
    if (n.link) navigate(n.link);
  };

  return (
    <div className="dropdown" ref={ref}>
      <button
        className="btn ghost icon bell"
        aria-label={`Notificações (${dados.naoLidas} não lidas)`}
        onClick={() => setAberto(!aberto)}
      >
        <i className="bi bi-bell" />
        {dados.naoLidas > 0 && (
          <span className="dot">{dados.naoLidas > 9 ? "9+" : dados.naoLidas}</span>
        )}
      </button>
      {aberto && (
        <div className="dropdown-panel">
          <div
            className="row"
            style={{
              justifyContent: "space-between",
              padding: "10px 14px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <strong>Notificações</strong>
            <Link to="/notificacoes" onClick={() => setAberto(false)} className="small">
              Ver todas
            </Link>
          </div>
          {dados.items.length === 0 && <div className="notif-item muted">Nenhuma notificação.</div>}
          {dados.items.slice(0, 6).map((n) => (
            <div
              key={n.id}
              className={`notif-item ${n.lida_em ? "" : "unread"}`}
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer" }}
              onClick={() => abrir(n)}
              onKeyDown={(e) => e.key === "Enter" && abrir(n)}
            >
              <strong>{n.titulo}</strong>
              <div className="muted">{n.mensagem}</div>
              <div className="muted small">{dataHoraBR(n.criado_em)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AppLayout() {
  const { usuario, logout } = useAuth();
  const [menu, setMenu] = useState(false);
  const loc = useLocation();
  const navigate = useNavigate();
  const [, setPronto] = useState(0);
  useEffect(() => setMenu(false), [loc.pathname]);
  useEffect(() => {
    api
      .get<Preferencias>("/config/preferencias")
      .then((p) => {
        configurarExibicao(p.formato_data, p.fuso_horario);
        document.documentElement.setAttribute("data-compact", String(p.modo_compacto));
        setPronto((n) => n + 1);
      })
      .catch(() => undefined);
  }, []);

  const sair = async () => {
    // Navega antes de limpar o usuário para não acionar o redirecionamento "voltar" da rota protegida.
    navigate("/login", { replace: true });
    await logout();
  };

  return (
    <div className="shell">
      <div className={`sidebar-backdrop ${menu ? "open" : ""}`} onClick={() => setMenu(false)} />
      <aside className={`sidebar ${menu ? "open" : ""}`} aria-label="Menu principal">
        <Link to="/app" className="logo" aria-label="Início">
          <Logo claro altura={32} />
        </Link>
        <nav>
          {MENU.map((g, i) => (
            <div key={i}>
              {g.grupo && <div className="grupo">{g.grupo}</div>}
              {g.itens.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end={it.to === "/app"}
                  className={({ isActive }) => `item ${isActive ? "active" : ""}`}
                >
                  <i className={`bi ${it.icon}`} aria-hidden /> {it.label}
                </NavLink>
              ))}
            </div>
          ))}
          {usuario?.papel === "admin" && (
            <>
              <div className="grupo">Administração</div>
              <NavLink
                to="/admin/chamados"
                className={({ isActive }) => `item ${isActive ? "active" : ""}`}
              >
                <i className="bi bi-inboxes" aria-hidden /> Chamados (equipe)
              </NavLink>
            </>
          )}
        </nav>
        {usuario && (
          <div className="plano-box">
            Plano <strong style={{ color: "#fff" }}>{usuario.plano.nome}</strong>
            {usuario.plano.codigo === "basico" && (
              <div style={{ marginTop: 6 }}>
                <Link to="/planos" style={{ color: "var(--accent)" }}>
                  Conhecer o BLACK →
                </Link>
              </div>
            )}
          </div>
        )}
      </aside>
      <div className="main">
        <header className="topbar">
          <Button
            variant="ghost"
            className="menu-toggle"
            icon="bi-list"
            aria-label="Abrir menu"
            onClick={() => setMenu(true)}
          />
          <Link to="/notas/nova" className="btn sm">
            <i className="bi bi-plus-lg" /> Emitir nota
          </Link>
          <div className="spacer" />
          <Notificacoes />
          <Link to="/meus-dados" className="btn ghost sm" title="Meus dados">
            <i className="bi bi-person-circle" />{" "}
            <span className="hide-sm">{usuario?.nome.split(" ")[0]}</span>
          </Link>
          <Button variant="ghost" size="sm" icon="bi-box-arrow-right" onClick={sair}>
            Sair
          </Button>
        </header>
        <main className="content" id="conteudo">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
