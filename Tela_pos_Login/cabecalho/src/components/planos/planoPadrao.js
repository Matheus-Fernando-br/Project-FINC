// src/components/Plano.jsx
import React from "react";
import "./plano.css";

function planoPadrao({ titulo, preco, descricao, detalhes, ativo, onClick }) {
  return (
    <div className={`plano ${ativo ? "ativo" : ""}`} onClick={onClick}>
      <div className="plano-header">
        <h3>{titulo}</h3>
        <span className="preco">{preco}</span>
      </div>
      <p>{descricao}</p>
      <div className="detalhes">
        {detalhes.map((item, index) => (
          <p key={index}>• {item}</p>
        ))}
      </div>
    </div>
  );
}

export default planoPadrao;
