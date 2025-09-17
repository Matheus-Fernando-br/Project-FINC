import Layout from '../../components/Layout';
import { Link } from 'react-router-dom';
import { useState } from 'react';

function Tela_1_feedback() {

  return (
      <main className="content">
        <section className="form-section">
          <div className="section-header">
            <span className="icon"><i class="bi bi-telephone-forward"></i></span>
            <h3>Fale Conosco</h3>
          </div>
          <hr className="divider" />
          <div className="form-row">
            <input type="text" placeholder="Comentários, dúvidas e reclamações." />
          </div>
          <div className='botao_geral'>
            <button className="btn">Enviar</button>
          </div>
        </section>

        <section className="form-section">
          <div className="section-header">
            <span className="icon"><i class="bi bi-telephone-forward"></i></span>
            <h3>Entre em contato de outra forma...</h3>
          </div>
          <hr className="divider" />
          <section class="botoes">
              <button class="btn btn-email">E-mail</button>  
              <button class="btn btn-zap">Whattsap</button>  
              <button class="btn btn-sms">SMS</button>  
          </section>
        </section>
      </main>
  );
} 

export default Tela_1_feedback;