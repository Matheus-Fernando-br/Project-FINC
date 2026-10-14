import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import type { Preferencias } from "@finc/shared";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { configurarExibicao, dataHoraBR } from "../format";
import { CONTA, MODULOS, moduloDaRota, type Modulo } from "../nav";
import { Loading, Logo } from "./ui";

interface Notif {
  id: string;
  titulo: string;
  mensagem: string;
  link: string | null;
  lida_em: string | null;
  criado_em: string;
}

interface ResultadoBusca {
  tipo: "cliente" | "produto" | "servico" | "fornecedor" | "nota";
  id: string;
  titulo: string;
  detalhe: string | null;
}

const ROTA_BUSCA: Record<ResultadoBusca["tipo"], { base: string; icon: string; nome: string }> = {
  cliente: { base: "/clientes", icon: "bi-person", nome: "Cliente" },
  produto: { base: "/produtos", icon: "bi-box-seam", nome: "Produto" },
  servico: { base: "/servicos", icon: "bi-tools", nome: "Serviço" },
  fornecedor: { base: "/fornecedores", icon: "bi-truck", nome: "Fornecedor" },
  nota: { base: "/notas", icon: "bi-receipt", nome: "Nota fiscal" },
};

/** Fecha um painel ao clicar fora ou pressionar Esc. */
function useFechar(aberto: boolean, fechar: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) =>
      ref.current && !ref.current.contains(e.target as Node) && fechar();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto, fechar]);
  return ref;
}

function MenuModulo({ m, ativo }: { m: Modulo; ativo: boolean }) {
  const [aberto, setAberto] = useState(false);
  const fechar = useCallback(() => setAberto(false), []);
  const ref = useFechar(aberto, fechar);
  const loc = useLocation();
  useEffect(() => setAberto(false), [loc.pathname, loc.search]);

  if (m.itens.length === 1) {
    return (
      <Link to={m.itens[0]!.to} className={`modulo-btn ${ativo ? "active" : ""}`}>
        {m.label}
      </Link>
    );
  }
  return (
    <div ref={ref} style={{ position: "static" }}>
      <button
        type="button"
        className={`modulo-btn ${ativo ? "active" : ""}`}
        aria-expanded={aberto}
        aria-haspopup="true"
        onClick={() => setAberto(!aberto)}
      >
        {m.label} <i className="bi bi-chevron-down" aria-hidden />
      </button>
      {aberto && (
        <div className="flyout" role="menu" aria-label={m.label}>
          <div className="flyout-titulo">{m.label}</div>
          <div className="flyout-grid">
            {m.itens.map((it) => (
              <Link key={it.to} to={it.to} className="flyout-item" role="menuitem">
                <i className={`bi ${it.icon}`} aria-hidden />
                <div>
                  <strong>{it.label}</strong>
                  <span>{it.desc}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Notificacoes() {
  const [aberto, setAberto] = useState(false);
  const fechar = useCallback(() => setAberto(false), []);
  const ref = useFechar(aberto, fechar);
  const [dados, setDados] = useState<{ items: Notif[]; naoLidas: number }>({
    items: [],
    naoLidas: 0,
  });
  const navigate = useNavigate();
  const loc = useLocation();

  const carregar = useCallback(
    () =>
      api
        .get<{ items: Notif[]; naoLidas: number }>("/notificacoes")
        .then(setDados)
        .catch(() => undefined),
    [],
  );
  useEffect(() => {
    void carregar();
    const t = setInterval(carregar, 60_000);
    return () => clearInterval(t);
  }, [loc.pathname, carregar]);

  const abrir = async (n: Notif) => {
    if (!n.lida_em) await api.post(`/notificacoes/${n.id}/lida`).catch(() => undefined);
    setAberto(false);
    void carregar();
    if (n.link) navigate(n.link);
  };

  return (
    <div ref={ref}>
      <button
        type="button"
        className="icon-btn"
        aria-label={`Notificações (${dados.naoLidas} não lidas)`}
        onClick={() => setAberto(!aberto)}
      >
        <i className="bi bi-bell" />
        {dados.naoLidas > 0 && (
          <span className="badge-dot">{dados.naoLidas > 9 ? "9+" : dados.naoLidas}</span>
        )}
      </button>
      {aberto && (
        <div className="flyout estreito" style={{ width: "min(380px, calc(100vw - 24px))" }}>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <strong>Notificações</strong>
            <Link to="/notificacoes" className="small" onClick={() => setAberto(false)}>
              Ver todas
            </Link>
          </div>
          {dados.items.length === 0 && <p className="muted small">Nenhuma notificação.</p>}
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
              <span className={`dot ${n.lida_em ? "muted" : ""}`} />
              <div>
                <strong>{n.titulo}</strong>
                <div className="muted">{n.mensagem}</div>
                <div className="muted small">{dataHoraBR(n.criado_em)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const iniciaisDe = (nome?: string) =>
  (nome ?? "?")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

/** Menu da conta no desktop. No celular, essas opções ficam dentro do menu lateral. */
function MenuConta({ sair }: { sair: () => void }) {
  const { usuario } = useAuth();
  const [aberto, setAberto] = useState(false);
  const fechar = useCallback(() => setAberto(false), []);
  const ref = useFechar(aberto, fechar);
  const loc = useLocation();
  useEffect(() => setAberto(false), [loc.pathname]);
  const iniciais = iniciaisDe(usuario?.nome);
  return (
    <div ref={ref} className="so-desktop">
      <button
        type="button"
        className="icon-btn"
        aria-label="Menu da conta"
        aria-expanded={aberto}
        onClick={() => setAberto(!aberto)}
      >
        <span className="avatar">{iniciais}</span>
      </button>
      {aberto && (
        <div className="flyout estreito menu-lista" role="menu">
          <div style={{ padding: "6px 12px 10px" }}>
            <strong>{usuario?.nome}</strong>
            <div className="muted small">{usuario?.email}</div>
            <div className="small" style={{ marginTop: 6 }}>
              <span className="badge success">Plano {usuario?.plano.nome}</span>
            </div>
          </div>
          <hr />
          {CONTA.map((c) => (
            <Link key={c.to} to={c.to} role="menuitem">
              <i className={`bi ${c.icon}`} aria-hidden /> {c.label}
            </Link>
          ))}
          {usuario?.papel === "admin" && (
            <Link to="/admin/chamados" role="menuitem">
              <i className="bi bi-inboxes" aria-hidden /> Chamados (equipe)
            </Link>
          )}
          <hr />
          <button type="button" onClick={sair} role="menuitem">
            <i className="bi bi-box-arrow-right" aria-hidden /> Sair
          </button>
        </div>
      )}
    </div>
  );
}

function BuscaGlobal({ aberta, fechar }: { aberta: boolean; fechar: () => void }) {
  const [termo, setTermo] = useState("");
  const [res, setRes] = useState<ResultadoBusca[]>([]);
  const [sel, setSel] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!aberta) {
      setTermo("");
      setRes([]);
    }
  }, [aberta]);
  useEffect(() => {
    if (termo.trim().length < 2) return setRes([]);
    const t = setTimeout(() => {
      api
        .get<ResultadoBusca[]>(`/busca?q=${encodeURIComponent(termo.trim())}`)
        .then((r) => {
          setRes(r);
          setSel(0);
        })
        .catch(() => setRes([]));
    }, 200);
    return () => clearTimeout(t);
  }, [termo]);

  if (!aberta) return null;
  const ir = (r: ResultadoBusca) => {
    fechar();
    navigate(`${ROTA_BUSCA[r.tipo].base}/${r.id}`);
  };
  return (
    <div className="busca-overlay" onMouseDown={(e) => e.target === e.currentTarget && fechar()}>
      <div className="busca-painel" role="dialog" aria-modal="true" aria-label="Buscar na FINC">
        <div className="campo">
          <i className="bi bi-search muted" aria-hidden />
          <input
            autoFocus
            placeholder="Buscar clientes, produtos, fornecedores, notas…"
            aria-label="Buscar"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") fechar();
              if (e.key === "ArrowDown") setSel((s) => Math.min(s + 1, res.length - 1));
              if (e.key === "ArrowUp") setSel((s) => Math.max(s - 1, 0));
              if (e.key === "Enter" && res[sel]) ir(res[sel]);
            }}
          />
          <span className="atalho-tecla">Esc</span>
        </div>
        <div className="resultados">
          {termo.trim().length >= 2 && res.length === 0 && (
            <p className="muted small" style={{ padding: 12 }}>
              Nada encontrado.
            </p>
          )}
          {termo.trim().length < 2 && (
            <p className="muted small" style={{ padding: 12 }}>
              Digite ao menos 2 letras. Dica: abra a busca com{" "}
              <span className="atalho-tecla">Ctrl</span> + <span className="atalho-tecla">K</span>.
            </p>
          )}
          {res.map((r, i) => (
            <a
              key={`${r.tipo}-${r.id}`}
              className={`resultado ${i === sel ? "sel" : ""}`}
              onMouseEnter={() => setSel(i)}
              onClick={() => ir(r)}
            >
              <i
                className={`bi ${ROTA_BUSCA[r.tipo].icon}`}
                style={{ color: "var(--brand)" }}
                aria-hidden
              />
              <div>
                {r.titulo}
                <small>
                  {ROTA_BUSCA[r.tipo].nome}
                  {r.detalhe ? ` · ${r.detalhe}` : ""}
                </small>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function MenuMovel({
  aberto,
  fechar,
  sair,
}: {
  aberto: boolean;
  fechar: () => void;
  sair: () => void;
}) {
  const loc = useLocation();
  const atual = moduloDaRota(loc.pathname);
  const { usuario } = useAuth();
  if (!aberto) return null;
  return (
    <>
      <div className="sheet-backdrop" onClick={fechar} />
      <nav className="sheet" aria-label="Menu principal">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <Logo />
          <button type="button" className="icon-btn" aria-label="Fechar menu" onClick={fechar}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <Link to="/meus-dados" className="sheet-usuario" onClick={fechar}>
          <span className="avatar lg">{iniciaisDe(usuario?.nome)}</span>
          <span className="dados">
            <strong>{usuario?.nome}</strong>
            <span className="muted small">{usuario?.email}</span>
            <span className="badge success">Plano {usuario?.plano.nome}</span>
          </span>
          <i className="bi bi-chevron-right muted" aria-hidden />
        </Link>
        <Link
          to="/notas/nova"
          className="btn"
          style={{ width: "100%", marginBottom: 8 }}
          onClick={fechar}
        >
          <i className="bi bi-plus-lg" /> Emitir nota
        </Link>
        {MODULOS.map((m) => (
          <details key={m.id} open={m.id === atual?.id}>
            <summary>
              <span className="row">
                {m.id === atual?.id && <span className="dot" />}
                {m.label}
              </span>
              <i className="bi bi-chevron-down" aria-hidden />
            </summary>
            <div className="links">
              {m.itens.map((it) => (
                <NavLink key={it.to} to={it.to} end onClick={fechar}>
                  <i className={`bi ${it.icon}`} aria-hidden /> {it.label}
                </NavLink>
              ))}
            </div>
          </details>
        ))}
        <div className="sheet-conta">
          <div className="titulo-secao">Minha conta</div>
          <div className="links">
            {CONTA.map((c) => (
              <NavLink key={c.to} to={c.to} onClick={fechar}>
                <i className={`bi ${c.icon}`} aria-hidden /> {c.label}
              </NavLink>
            ))}
            {usuario?.papel === "admin" && (
              <NavLink to="/admin/chamados" onClick={fechar}>
                <i className="bi bi-inboxes" aria-hidden /> Chamados (equipe)
              </NavLink>
            )}
          </div>
        </div>
        <button type="button" className="btn secondary mt" style={{ width: "100%" }} onClick={sair}>
          <i className="bi bi-box-arrow-right" /> Sair
        </button>
      </nav>
    </>
  );
}

export function AppLayout() {
  const { logout } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();
  const [menuMovel, setMenuMovel] = useState(false);
  const [busca, setBusca] = useState(false);
  const [, setPronto] = useState(0);
  const modulo = moduloDaRota(loc.pathname);

  useEffect(() => {
    setMenuMovel(false);
    window.scrollTo({ top: 0 });
  }, [loc.pathname]);
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
  useEffect(() => {
    const atalho = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setBusca(true);
      }
    };
    window.addEventListener("keydown", atalho);
    return () => window.removeEventListener("keydown", atalho);
  }, []);

  const sair = async () => {
    // Navega antes de limpar o usuário para não acionar o redirecionamento "voltar" da rota protegida.
    navigate("/login", { replace: true });
    await logout();
  };

  const subitens = modulo && modulo.itens.length > 1 ? modulo.itens : null;
  // Item ativo do submenu: correspondência exata com a query primeiro; depois o caminho mais longo.
  const atualCompleto = loc.pathname + loc.search;
  const ativoTo = subitens
    ? (subitens.find((i) => i.to.includes("?") && i.to === atualCompleto)?.to ??
      subitens
        .filter((i) => !i.to.includes("?") || i.to.split("?")[0] === loc.pathname)
        .map((i) => i.to.split("?")[0]!)
        .filter((to) => loc.pathname === to || loc.pathname.startsWith(`${to}/`))
        .sort((x, y) => y.length - x.length)[0])
    : undefined;
  const itemAtivo = (to: string) =>
    to.includes("?")
      ? to === ativoTo
      : to === ativoTo || (!ativoTo?.includes("?") && to === ativoTo);

  return (
    <>
      <header className="topnav">
        <div className="inner">
          <Link to="/app" className="brand" aria-label="FINC — início">
            <Logo />
          </Link>
          <nav className="modulos" aria-label="Módulos">
            {MODULOS.map((m) => (
              <MenuModulo key={m.id} m={m} ativo={m.id === modulo?.id} />
            ))}
          </nav>
          <div className="nav-acoes">
            <button
              type="button"
              className="icon-btn"
              aria-label="Buscar (Ctrl+K)"
              title="Buscar (Ctrl+K)"
              onClick={() => setBusca(true)}
            >
              <i className="bi bi-search" />
            </button>
            <Link to="/notas/nova" className="btn sm ocultar-movel" style={{ marginInline: 6 }}>
              <i className="bi bi-plus-lg" /> Emitir nota
            </Link>
            <Notificacoes />
            <MenuConta sair={sair} />
            <button
              type="button"
              className="icon-btn menu-movel-btn"
              aria-label="Abrir menu"
              onClick={() => setMenuMovel(true)}
            >
              <i className="bi bi-list" />
            </button>
          </div>
        </div>
      </header>
      {subitens && (
        <nav className="subnav" aria-label={`Seções de ${modulo?.label}`}>
          <div className="inner">
            {subitens.map((it) => (
              <Link key={it.to} to={it.to} className={itemAtivo(it.to) ? "active" : ""}>
                {it.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
      <main className="content" id="conteudo">
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
      <MenuMovel aberto={menuMovel} fechar={() => setMenuMovel(false)} sair={sair} />
      <BuscaGlobal aberta={busca} fechar={() => setBusca(false)} />
    </>
  );
}
