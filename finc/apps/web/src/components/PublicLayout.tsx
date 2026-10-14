import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Logo } from "./ui";

function LinksPublicos() {
  return (
    <>
      <NavLink to="/" end>
        Visão geral
      </NavLink>
      <NavLink to="/planos-finc">Planos</NavLink>
      <NavLink to="/quem-somos">Quem somos</NavLink>
      <NavLink to="/duvidas">Dúvidas</NavLink>
    </>
  );
}

export function PublicLayout() {
  const { usuario } = useAuth();
  return (
    <div className="publico tema-claro">
      <header className="pub-header">
        <div className="inner">
          <Link to="/" aria-label="FINC — início">
            <Logo altura={24} />
          </Link>
          <nav aria-label="Navegação pública" className="pub-nav">
            <LinksPublicos />
          </nav>
          {usuario ? (
            <Link to="/app" className="btn sm">
              Abrir a FINC
            </Link>
          ) : (
            <div className="row">
              <Link to="/login" className="btn ghost sm">
                Entrar
              </Link>
              <Link to="/cadastro" className="btn sm">
                Criar conta
              </Link>
            </div>
          )}
        </div>
      </header>
      {/* No celular, as seções viram atalhos roláveis logo abaixo do cabeçalho. */}
      <nav aria-label="Seções do site" className="pub-atalhos">
        <LinksPublicos />
      </nav>
      <Outlet />
      <footer className="pub-footer">
        <div className="inner">
          <span>
            © {new Date().getFullYear()} FINC. Gestão simples para MEIs e pequenas empresas.
          </span>
          <span className="row" style={{ gap: 16 }}>
            <Link to="/termos">Termos e privacidade</Link>
            <a href="mailto:plataforma.finc@gmail.com">plataforma.finc@gmail.com</a>
            <a
              href="https://www.instagram.com/plataforma.finc/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram da FINC"
            >
              <i className="bi bi-instagram" />
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
