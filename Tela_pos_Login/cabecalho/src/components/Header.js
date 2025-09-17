import React, { useState } from "react";
import { Link } from 'react-router-dom';

function Header() {

// Função para alterar zoom
const [fontSize, setFontSize] = useState(100);

  function zoomIn() {
    setFontSize(prev => {
      const newSize = prev + 10;
      document.body.style.fontSize = newSize + "%";
      return newSize;
    });
  }

  function zoomOut() {
    setFontSize(prev => {
      const newSize = prev > 50 ? prev - 10 : prev;
      document.body.style.fontSize = newSize + "%";
      return newSize;
    });
  }  

// Função para alternar o dark mode
  function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
  }

  return (
    <header className="header">
      <div className="msg">
        <h2>Olá, MEPHINS Engenharia!</h2>
        <p>Estamos felizes em te ver novamente.</p>
      </div>

      {/* Barra de Pesquisa */}
      <div className="search-bar">
        <input type="text" placeholder="Pesquisar..." />
        <i className="bi bi-search"></i>
      </div>

      {/* Informações do Usuário */}
      <div className="header-right">
          <Link to="/MeusDados">
           <span className="user-name">Paulo Alcântara Engenharia</span>
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
