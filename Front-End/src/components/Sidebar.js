import React, { useState } from "react";
import { Link } from "react-router-dom";
import icons from "./Icons";

function Sidebar() {
  const [active, setActive] = useState(false);

  const toggleMenu = () => {
    setActive(!active);
  };

  return (
    <>
      {/* Botão hamburguer */}
      <div className="sidebar-hamburguer">
        <div
          className="hamburger"
          onClick={toggleMenu}
          aria-label={active ? "Fechar menu" : "Abrir menu"}
        >
          <i className={active ? icons.menuAberto : icons.menuFechado}></i>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar${active ? " active" : " collapsed"}`}>
        <ul className="menu">
          <li>
            <Link to="/app">
              <i className={icons.casa}></i>
              <span className="label">Home</span>
            </Link>
          </li>
          <li>
            <Link to="/emitir-nota/Dados">
              <i className={icons.emitirNota}></i>
              <span className="label">Emitir nota</span>
            </Link>
          </li>
          <li>
            <Link to="/clientes">
              <i className={icons.clientes}></i>
              <span className="label">Meus clientes</span>
            </Link>
          </li>
          <li>
            <Link to="/produtos">
              <i className={icons.produtos}></i>
              <span className="label">Produtos e serviços</span>
            </Link>
          </li>
          <hr className="divider" />
          <li>
            <Link to="/planos">
              <i className={icons.planos}></i>
              <span className="label">Planos</span>
            </Link>
          </li>
          <li>
            <Link to="/pagamento">
              <i className={icons.pagamento}></i>
              <span className="label">Pagamento</span>
            </Link>
          </li>
          <hr className="divider" />
          <li>
            <Link to="/notificacao">
              <i className={icons.notificacoes}></i>
              <span className="label">Notificações</span>
            </Link>
          </li>
          <li>
            <Link to="/contador">
              <i className={icons.contador}></i>
              <span className="label">Contador</span>
            </Link>
          </li>
          <hr className="divider" />
          <li>
            <Link to="/sair">
              <i className={icons.sair}></i>
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
