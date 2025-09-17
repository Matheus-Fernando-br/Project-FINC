import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "./styles/Layout.css";

function LayoutTelaInicial({ children }) {

  useEffect(() => {
    // Seletores
    const hamburger = document.querySelector(".hamburger");
    const closeMenu = document.querySelector(".close-menu");
    const menu = document.querySelector(".menu");

    const openMenu = () => menu?.classList.add("active");
    const closeMenuFn = () => menu?.classList.remove("active");

    if (hamburger) hamburger.addEventListener("click", openMenu);
    if (closeMenu) closeMenu.addEventListener("click", closeMenuFn);

    const menuLinks = menu ? Array.from(menu.querySelectorAll("a")) : [];
    menuLinks.forEach((link) => link.addEventListener("click", closeMenuFn));

    // Cleanup
    return () => {
      if (hamburger) hamburger.removeEventListener("click", openMenu);
      if (closeMenu) closeMenu.removeEventListener("click", closeMenuFn);
      menuLinks.forEach((link) =>
        link.removeEventListener("click", closeMenuFn)
      );
    };
  }, []);

  return (
    <div className="cabecalho">
      <header>
        <nav className="navbar">
          {/* Logo */}
          <Link to="/">
            <img src="/Images/FINC.png" alt="Logo" />
          </Link>

          {/* Menu */}
          <div className="menu">
            <Link to="/TelaInicial/Planos">Planos</Link>
            <Link to="/TelaInicial/Duvidas">Dúvidas</Link>
            <Link to="/TelaInicial/QuemSomos">Quem Somos</Link>
            <Link to="/TelaInicial/Login">
              <i className="bi bi-person-circle"></i> Login
            </Link>
          </div>

          {/* Ícones Mobile */}
          <i className="bi bi-list hamburger"></i>
          <i className="bi bi-x-lg close-menu"></i>
        </nav>
      </header>

      {/* Conteúdo das páginas que usarem esse layout */}
      <main>{children}</main>
    </div>
  );
}

export default LayoutTelaInicial;
