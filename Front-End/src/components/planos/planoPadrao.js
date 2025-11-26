import React from "react";
import './styles/plano.css';

function PlanoPadrao({ titulo, preco, descricao, detalhes, ativo, onClick }) {
  return (
    <div className={`plano ${ativo ? "ativo" : ""}`} onClick={onClick}>
      
      <div className="plano-header">

        <h3>{titulo}</h3>

        {/* --- DESKTOP --- */}
        <div className="preco-container desktop">
          <span className="preco">{preco}</span>
          <div className="linha-vertical"></div>
          <span className="descricao">{descricao}</span>
        </div>

        <div className="veja-mais">
          <span>Veja mais</span>
          <i className="bi bi-chevron-double-down"></i>
        </div>

        {/* --- MOBILE (aparece abaixo do título) --- */}
        <div className="preco-container mobile">
          <span className="preco">{preco}</span>
          <div className="linha-vertical"></div>
          <span className="descricao">{descricao}</span>
        </div>

      </div>

      <div className="detalhes">
        {detalhes.map((item, index) => (
          <p key={index}>• {item}</p>
        ))}
      </div>

    </div>
  );
}

export default PlanoPadrao;
