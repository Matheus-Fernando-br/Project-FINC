import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import suggestions from "./Suggestions";

function Header() {
  const [fontSize, setFontSize] = useState(100);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDropdown, setOpenDropdown] = useState(false);
  const [animateClose, setAnimateClose] = useState(false);

  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const filteredSuggestions = suggestions.filter((item) =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function zoomIn() {
    const newSize = fontSize + 10;
    setFontSize(newSize);
    document.documentElement.style.fontSize = newSize + "%";
  }
  function zoomOut() {
    const newSize = fontSize > 50 ? fontSize - 10 : fontSize;
    setFontSize(newSize);
    document.documentElement.style.fontSize = newSize + "%";
  }

  function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
  }

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

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      executeSearch();
    }
  }

  return (
    <header className="header">
      <div className="msg">
        <h2>Olá, Gabriel</h2>
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
        <Link to="/MeusDados">
          <span className="user-name">Gabriel Moreira Carvalho</span>
        </Link>

        <div className="profile">
          <Link to="/MeusDados">
            <i className="bi bi-person-circle"></i>
          </Link>
        </div>

        <div className="icons">
          <i className="bi bi-moon" onClick={toggleDarkMode}></i>
          <i className="bi bi-zoom-in" onClick={zoomIn}></i>
          <i className="bi bi-zoom-out" onClick={zoomOut}></i>
        </div>
      </div>
    </header>
  );
}

export default Header;
