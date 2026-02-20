import React, { useEffect, useState } from "react";
import "./styles/plano.css";

function PlanoPadrao({ titulo, preco, descricao, detalhes = [], ativo, onClick }) {
  const [aberto, setAberto] = useState(!!ativo);

  useEffect(() => {
    if (typeof ativo === "boolean") setAberto(ativo);
  }, [ativo]);

  const handleClick = () => {
    // notifica pai (se existir)
    if (onClick) onClick();

    // sempre abre/fecha localmente
    setAberto((prev) => !prev);
  };

  return (
    <div className={`plano ${aberto ? "ativo" : ""}`} onClick={handleClick}>
      <div className="plano-header">
        <h3>{titulo}</h3>

        <div className="preco-container desktop">
          <span className="preco">{preco}</span>
          <div className="linha-vertical"></div>
          <span className="descricao">{descricao}</span>
        </div>

        <div className="veja-mais">
          <span>{aberto ? "Fechar" : "Veja mais"}</span>
          <i className={`bi ${aberto ? "bi-chevron-double-up" : "bi-chevron-double-down"}`}></i>
        </div>

        <div className="preco-container mobile">
          <span className="preco">{preco}</span>
          <div className="linha-vertical"></div>
          <span className="descricao">{descricao}</span>
        </div>
      </div>

      <div className={`detalhes ${aberto ? "aberto" : ""}`}>
        {(Array.isArray(detalhes) ? detalhes : []).map((item, index) => (
          <p key={index}>• {item}</p>
        ))}
      </div>
    </div>
  );
}

export default PlanoPadrao;