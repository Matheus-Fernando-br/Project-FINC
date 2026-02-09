import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import icons from "../Icons";

function Sidebar() {
  const [active, setActive] = useState(false);
  const location = useLocation();
  const sidebarRef = useRef(null);

  const toggleMenu = () => setActive(!active);
  const closeMenu = () => setActive(false);

    // FECHAR ao clicar fora
    useEffect(() => {
      function clickOutside(e) {
        if (
          active &&
          sidebarRef.current &&
          !sidebarRef.current.contains(e.target) &&
          !e.target.closest(".hamburger-icon")
        ) {
          closeMenu();
        }
    }

    document.addEventListener("mousedown", clickOutside);

    return () => document.removeEventListener("mousedown", clickOutside);
  }, [active]);

  // bloquear scroll
  useEffect(() => {
    document.body.style.overflow = active ? "hidden" : "auto";
  }, [active]);

  return (
    <>
      {/* Botão hamburguer */}
      <div className="sidebar-hamburguer" onClick={toggleMenu}>
        <div className={`hamburger-icon ${active ? "open" : ""}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      {/* Overlay */}
      {active && <div className="sidebar-overlay"></div>}

      <aside ref={sidebarRef} className={`sidebar ${active ? "active" : ""}`}>
        <ul className="menu">

          <li className={location.pathname.includes("/app") ? "ativo" : ""}>
            <Link to="/app" onClick={closeMenu}>
              <i className={icons.casa}></i>
              <span className="label">Home</span>
            </Link>
          </li>

          <li className={location.pathname.includes("/emitir-nota") ? "ativo" : ""}>
            <Link to="/emitir-nota/Dados" onClick={closeMenu}>
              <i className={icons.emitirNota}></i>
              <span className="label">Emitir nota</span>
            </Link>
          </li>

          <li className={location.pathname.includes("/clientes") ? "ativo" : ""}>
            <Link to="/clientes" onClick={closeMenu}>
              <i className={icons.clientes}></i>
              <span className="label">Meus clientes</span>
            </Link>
          </li>

          <li className={location.pathname.includes("/produtos") ? "ativo" : ""}>
            <Link to="/produtos" onClick={closeMenu}>
              <i className={icons.produtos}></i>
              <span className="label">Produtos e serviços</span>
            </Link>
          </li>

          <hr className="divider" />

          <li className={location.pathname.includes("/planos") ? "ativo" : ""}>
            <Link to="/planos" onClick={closeMenu}>
              <i className={icons.planos}></i>
              <span className="label">Planos</span>
            </Link>
          </li>

          <li className={location.pathname.includes("/configuracao") ? "ativo" : ""}>
            <Link to="/configuracao" onClick={closeMenu}>
              <i className={icons.configuracao}></i>
              <span className="label">Configurações</span>
            </Link>
          </li>

          <hr className="divider" />

          <li className={location.pathname.includes("/notificacao") ? "ativo" : ""}>
            <Link to="/notificacao" onClick={closeMenu}>
              <i className={icons.notificacoes}></i>
              <span className="label">Notificações</span>
            </Link>
          </li>

          <li className={location.pathname.includes("/contador") ? "ativo" : ""}>
            <Link to="/contador" onClick={closeMenu}>
              <i className={icons.contador}></i>
              <span className="label">Contador</span>
            </Link>
          </li>

          <hr className="divider" />

          <li className={location.pathname === "/sair" ? "ativo" : ""}>
            <Link to="/sair" onClick={closeMenu}>
              <i className={icons.sair}></i>
              <span className="label">Sair</span>
            </Link>
          </li>

        </ul>

        <div className="logo-baixo">
          <Link to="/app" onClick={closeMenu}>
            <img src="/Images/FINC.png" alt="Logo FINC" />
          </Link>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
