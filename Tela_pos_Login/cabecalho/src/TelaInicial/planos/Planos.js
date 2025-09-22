// src/pages/Planos.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Planos.css";
import PlanoBasico from "../../components/planos/planoBasico";
import PlanoPremium from "../../components/planos/planoPremium";
import PlanoBlack from "../../components/planos/planoBlack";

function Planos() {
  const [planoAtivo, setPlanoAtivo] = useState(null);

  const togglePlano = (plano) => {
    setPlanoAtivo(planoAtivo === plano ? null : plano);
  };

  return (
    <main className="tela-planos">
      {/* Título */}
      <div className="titulo">
        <h1>Nossos Planos</h1>
      </div>

      {/* Conteúdo */}
      <section className="panel_planos">
        {/* Caixa dos planos */}
        <div className="planos">
          <PlanoBasico
            ativo={planoAtivo === "basico"}
            onClick={() => togglePlano("basico")}
          />
          <PlanoPremium
            ativo={planoAtivo === "premium"}
            onClick={() => togglePlano("premium")}
          />
          <PlanoBlack
            ativo={planoAtivo === "black"}
            onClick={() => togglePlano("black")}
          />
        </div>

        {/* Caixa lateral */}
        <div className="lado-direito">
          <div className="text">
            <h2>Todos os planos contemplam:</h2>
            <ul>
              <li>Gestão financeira com relatórios;</li>
              <li>Controle de produtos e clientes;</li>
              <li>Interface gráfica otimizada.</li>
              <li>Suporte via e-mail.</li>
            </ul>
          </div>

          <div className="rodape form-footer voltar">
            <Link to="/">
              Voltar para Tela Inicial{" "}
              <i className="bi bi-chevron-double-left"></i>
              <i className="bi bi-chevron-double-left"></i>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Planos;
