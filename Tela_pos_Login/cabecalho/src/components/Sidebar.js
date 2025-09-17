import React, { useState } from "react";
import { Link } from "react-router-dom";

function Sidebar() {
  const [active, setActive] = useState(false);

  const toggleMenu = () => {
    setActive(!active);
  };

  return (
    <>
      {/* Botão hamburguer (vira X quando ativo) */}
      <div className="sidebar-hamburguer">
      <div
        className="hamburger"
        onClick={toggleMenu}
        aria-label={active ? "Fechar menu" : "Abrir menu"}
      >
        {active ? (
          <i className="bi bi-x"></i>   // X quando aberto
        ) : (
          <i className="bi bi-list"></i> // Hamburguer quando fechado
        )}
      </div>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar${active ? " active" : " collapsed"}`}>
        <ul className="menu">
          <li>
            <Link to="/emitir-nota/Dados">
              <i className="bi bi-file-earmark-plus"></i>
              <span className="label">Emitir nota</span>
            </Link>
          </li>
          <li>
            <Link to="/MeusDados">
              <i className="bi bi-person"></i>
              <span className="label">Meus dados</span>
            </Link>
          </li>
          <li>
            <Link to="/clientes">
              <i className="bi bi-people"></i>
              <span className="label">Meus clientes</span>
            </Link>
          </li>
          <li>
            <Link to="/produtos">
              <i className="bi bi-box"></i>
              <span className="label">Produtos e serviços</span>
            </Link>
          </li>
          <li>
            <Link to="/notificacao">
              <i className="bi bi-bell"></i>
              <span className="label">Notificações</span>
            </Link>
          </li>
          <hr className="divider" />
          <li>
            <Link to="/planos">
              <i className="bi bi-card-list"></i>
              <span className="label">Planos</span>
            </Link>
          </li>
          <li>
            <Link to="/pagamento">
              <i className="bi bi-credit-card"></i>
              <span className="label">Pagamento</span>
            </Link>
          </li>
          <hr className="divider" />
          <li>
            <Link to="/feedback">
              <i className="bi bi-chat-dots"></i>
              <span className="label">Converse com a gente</span>
            </Link>
          </li>
          <li>
            <Link to="/sair">
              <i className="bi bi-box-arrow-right"></i>
              <span className="label">Sair</span>
            </Link>
          </li>
        </ul>

        {/* Logo sempre embaixo */}
        <div className="logo-baixo">
          <Link to="/app">
            <img src="/Images/FINC.png" alt="Logo FINC" />
          </Link>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
