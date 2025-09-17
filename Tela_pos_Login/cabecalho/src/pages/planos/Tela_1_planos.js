import Layout from '../../components/Layout';
import { useState } from 'react';
import './plano.css'

function Tela_1_planos() {
  // Estado para controlar qual plano está ativo
  const [ativo, setAtivo] = useState(null);

  const togglePlano = (plano) => {
    setAtivo((prev) => (prev === plano ? null : plano));
  };

  return (
      <main className="content">
        <section className="form-section">
          <div className="section-header">
            <span className="icon"><i className="bi bi-journal-check"></i></span>
            <h3>Meu plano atual</h3>
          </div>
          <hr className="divider" />

          <div
            className={`plano ${ativo === 'basico' ? 'ativo' : ''}`}
            onClick={() => togglePlano('basico')}
          >
            <div className="plano-header">
              <h3>BÁSICO</h3>
              <span className="preco">R$ 19,90</span>
            </div>
            <div className="icon-veja">
            </div>
            <p>até 80 notas/boletos mensais</p>
            <div className="detalhes">
              <p>• Emissão MANUAL agilizada de notas e boletos</p>
              <p>• Auxílio da IA para preenchimento</p>
              <p>• Cobrança extra de R$1,50 por nota adicional</p>
              <p>• 300MB de armazenamento</p>
            </div>
          </div>
        </section>

        <section className="form-section">
          <div className="section-header">
            <span className="icon"><i className="bi bi-journal-check"></i></span>
            <h3>Planos Disponíveis</h3>
          </div>
          <hr className="divider" />

          <div
            className={`plano ${ativo === 'premium' ? 'ativo' : ''}`}
            onClick={() => togglePlano('premium')}
          >
            <div className="plano-header">
              <h3>PREMIUM</h3>
              <span className="preco">R$ 45,50</span>
            </div>
            <div className="icon-veja">
            </div>
            <p>até 1.500 notas/boletos mensais</p>
            <div className="detalhes">
              <p>• Tudo do Básico +</p>
              <p>• Maior limite de emissão</p>
              <p>• Mais espaço de armazenamento</p>
            </div>
          </div>
        </section>

        <section className="form-section">
          <div
            className={`plano ${ativo === 'black' ? 'ativo' : ''}`}
            onClick={() => togglePlano('black')}
          >
            <div className="plano-header">
              <h3>BLACK</h3>
              <span className="preco">R$ 185,60</span>
            </div>
            <div className="icon-veja">
            </div>
            <p>emissões ilimitadas</p>
            <div className="detalhes">
              <p>• Tudo do Premium +</p>
              <p>• Emissões ilimitadas</p>
              <p>• Armazenamento ampliado</p>
            </div>
          </div>
        </section>
      </main>
  );
}

export default Tela_1_planos;
