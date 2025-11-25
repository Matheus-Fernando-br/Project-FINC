import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import icons from "../components/Icons";
import "./styles/Layout.css";

function LayoutTelaInicial({ children }) {

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

const openMenu = () => setActive(true);
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
          <Link to="/">
            <img src="/Images/FINC.png" alt="Logo" />
          </Link>

          {/* Ícones Mobile */}
          <i 
            className={`bi ${active ? "bi-x-lg" : "bi-list"} hamburger`}
            onClick={() => setActive(!active)}
          ></i>

          {/* Menu */}
          <div className={`menu ${active ? "active" : ""}`}>
            <Link to="/">
              <i className={icons.casa}></i> Home</Link>
            <Link to="/TelaInicial/Planos">
               <i className={icons.cash}></i> Planos</Link>
            <Link to="/TelaInicial/Duvidas">
              <i className={icons.duvidas}></i> Dúvidas</Link>
            <Link to="/TelaInicial/QuemSomos">
              <i className={icons.clientes}></i> Quem Somos</Link>
            <Link to="/TelaInicial/Login">
              <i className={icons.clientePerson}></i> Login
            </Link>
          </div>

        </nav>
      </header>

      {/* Conteúdo das páginas que usarem esse layout */}
      <main>{children}</main>
    </div>
  );
}

export default LayoutTelaInicial;
