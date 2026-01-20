import PlanoBasico from '../../components/planos/planoBasico';
import PlanoPremium from '../../components/planos/planoPremium';
import PlanoBlack from '../../components/planos/planoBlack';
import icons from "../../components/Icons";
import { useState } from 'react';

function Tela_1_planos() {
  const [ativo, setAtivo] = useState(null);

  const togglePlano = (plano) => {
    setAtivo((prev) => (prev === plano ? null : plano));
  };

  return (
    <main className="content">
      <section className='titulo-secao'>
        <h1><i className={icons.planos}></i> Planos</h1>
      </section>        

      <section className="form-section">
        <div className="section-header">
          <span className="icon"><i className={icons.relatorioOk}></i></span>
          <h3>Meu plano atual</h3>
        </div>
        <hr className="divider" />

        <PlanoBasico 
          ativo={ativo === "basico"} 
          onClick={() => togglePlano("basico")} 
        />
      </section>

      <section className="form-section">
        <div className="section-header">
          <span className="icon"><i className={icons.relatorio}></i></span>
          <h3>Planos Disponíveis</h3>
        </div>
        <hr className="divider" />

        <PlanoPremium 
          ativo={ativo === "premium"} 
          onClick={() => togglePlano("premium")} 
        />
        <PlanoBlack 
          ativo={ativo === "black"} 
          onClick={() => togglePlano("black")} 
        />
      </section>
    </main>
  );
}

export default Tela_1_planos;
