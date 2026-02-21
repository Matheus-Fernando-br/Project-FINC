import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import suggestions from "./Suggestions";
import { applyTheme, getTheme } from "../../utils/scripts";


function Header() {
  const [theme, setTheme] = useState(getTheme());

  function toggleTheme() {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    applyTheme(newTheme);
  }


  const [searchTerm, setSearchTerm] = useState("");
  const [openDropdown, setOpenDropdown] = useState(false);
  const [animateClose, setAnimateClose] = useState(false);

  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const filteredSuggestions = suggestions.filter((item) =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function executeSearch() {
    if (searchTerm.trim() === "") return;
    closeDropdown();
  }

  function closeDropdown() {
    setAnimateClose(true);
    setTimeout(() => {
      setOpenDropdown(false);
      setAnimateClose(false);
    }, 200);
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !inputRef.current.contains(e.target)
      ) {
        closeDropdown();
      }
    }


    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      setTheme(getTheme());
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);


  function handleKeyDown(e) {
    if (e.key === "Enter") {
      executeSearch();
    }
  }

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const nomeCompleto = user.social_name || "Usuário";
  const primeiroNome = nomeCompleto.split(" ")[0];

  return (
    <header className="header">
      <div className="logo">
        <img src="/Images/FINC.png" alt="Logo Finc"/>
      </div>

      <div className="search-wrapper">
        <div className="search-bar" onClick={() => setOpenDropdown(true)}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setOpenDropdown(true);
            }}
            onKeyDown={handleKeyDown}
          />
          <i className="bi bi-search"></i>
        </div>

       {openDropdown && (
        <div
          className={`search-dropdown ${animateClose ? "closing" : ""}`}
          ref={dropdownRef}
        >
          <div className="dropdown-header">
            <span>Informe o conteúdo que deseja localizar</span>

            <p className="close-btn" onClick={closeDropdown}>
              <span>Fechar</span>
              <i className="bi bi-x-lg"></i>
            </p>
          </div>

          {filteredSuggestions.map((item, index) => (
            <Link
              key={index}
              className="dropdown-item"
              to={item.to}
              onClick={() => {
                executeSearch();   // executa pesquisa
                closeDropdown();   // fecha automaticamente
              }}
            >
              <i className={item.icon}></i>
              {item.label}
            </Link>
          ))}
        </div>
      )}
      </div>


      <div className="header-right">
        <div className="meuperfil">
        <Link to="/MeusDados">
          <span className="user-name">{nomeCompleto}</span>
        </Link>

        <div className="profile">
          <Link to="/MeusDados">
            <i className="bi bi-person-circle"></i>
          </Link>
        </div>
        </div>

        <div className="icons">
          <i
            className={`bi ${theme === "dark" ? "bi-sun" : "bi-moon"}`}
            onClick={toggleTheme}
          />
        </div>
      </div>
    </header>
  );
}

export default Header;