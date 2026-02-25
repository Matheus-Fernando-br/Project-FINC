import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import icons from "../components/Icons";
import "../styles/telaInicial.css";

function LayoutTelaInicial({ children }) {
  const location = useLocation();

  useEffect(() => {
    // Seletores
    const hamburger = document.querySelector(".hamburger");
    const closeMenuX = document.querySelector(".close-menux");
    const menu = document.querySelector(".menu");

    const openMenu = () => menu?.classList.add("active");
    const closeMenuFn = () => menu?.classList.remove("active");

    if (hamburger) hamburger.addEventListener("click", openMenu);
    if (closeMenuX) closeMenuX.addEventListener("click", closeMenuFn);

    const menuLinks = menu ? Array.from(menu.querySelectorAll("a")) : [];
    menuLinks.forEach((link) => link.addEventListener("click", closeMenuFn));

    // Cleanup
    return () => {
      if (hamburger) hamburger.removeEventListener("click", openMenu);
      if (closeMenuX) closeMenuX.removeEventListener("click", closeMenuFn);
      menuLinks.forEach((link) =>
        link.removeEventListener("click", closeMenuFn)
      );
    };
  }, []);

const [active, setActive] = useState(false);
const sidebarRef = useRef(null);

const closeMenu = () => setActive(false);

useEffect(() => {
  function clickOutside(e) {
    if (active && sidebarRef.current && !sidebarRef.current.contains(e.target) && !e.target.closest(".navbar")) {
      closeMenu();
    }
  }
  document.addEventListener("mousedown", clickOutside);
  return () => document.removeEventListener("mousedown", clickOutside);
}, [active]);


  return (
    <div className="cabecalho">
      <header>
        <nav className="navbar" ref={sidebarRef}>
        {/* Logo */}
        <div className="logo">
          <Link to="/">
            <img src="/Images/FINC.png" alt="Logo" />
          </Link>
        </div>

          {/* Ícones Mobile */}
          <i 
            className={`bi ${active ? "bi-x-lg" : "bi-list"} hamburger`}
            onClick={() => setActive(!active)}
          ></i>

          {/* Menu */}
          <div className={`menu ${active ? "active" : ""}`}>

            <Link 
              to="/" 
              className={location.pathname === "/" ? "ativo" : ""}
            >
              <i className={icons.casa}></i> Home
            </Link>

            <Link 
              to="/TelaInicial/Planos"
              className={location.pathname.includes("/TelaInicial/Planos") ? "ativo" : ""}
            >
              <i className={icons.cash}></i> Planos
            </Link>

            <Link 
              to="/TelaInicial/Duvidas"
              className={location.pathname.includes("/TelaInicial/Duvidas") ? "ativo" : ""}
            >
              <i className={icons.duvidas}></i> Dúvidas
            </Link>

            <Link 
              to="/TelaInicial/QuemSomos"
              className={location.pathname.includes("/TelaInicial/QuemSomos") ? "ativo" : ""}
            >
              <i className={icons.clientes}></i> Quem Somos
            </Link>

            <Link 
              to="/TelaInicial/Login"
              className={location.pathname.includes("/TelaInicial/Login") ? "ativo" : ""}
            >
              <i className={icons.clientePerson}></i> Login
            </Link>

          </div>

        </nav>
      </header>

      {/* Conteúdo das páginas que usarem esse layout */}
      <main className="page-transition">
        {children}
      </main>
    </div>
  );
}

export default LayoutTelaInicial;
