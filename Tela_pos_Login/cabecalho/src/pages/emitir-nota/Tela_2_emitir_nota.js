import Layout from '../../components/Layout';
import { Link } from 'react-router-dom';

function Tela_2_emitir_nota() {
  return (
      <main className="content">
        <section className="form-section">
          <div className="section-header">
            <span className="icon"><i className="bi bi-journal-text"></i></span>
            <h3>Consulta da nota</h3>
          </div>
          <hr className="divider" />
          <div className="form-row">
            <input type="text" placeholder="Consulte sua nota aqui" />
          </div>
        </section>

        <section className="emitir">
          <div className="section-header">
            <span className="icon"><i className="bi bi-journal-text"></i></span>
            <h3>Emitir nota</h3>
          </div>
          <hr className="divider" />
          <div className="botao_geral">
          <button className="btn">Emitir Nota Fiscal</button>
          </div>
        </section>

        <div className="form-footer-voltar">
          <Link to="/emitir-nota/Dados" className="previous-step">
            Voltar <i className="bi bi-chevron-double-left"></i><i className="bi bi-chevron-double-left"></i>
          </Link>
        </div>
      </main>
  );
} 

export default Tela_2_emitir_nota;