import Layout from '../../components/Layout';
import { Link } from 'react-router-dom';

function Tela_1_emitir_nota() {
  return (
      <main className="content">
        <section className="form-section">
          <div className="section-header">
            <span className="icon"><i className="bi bi-person-circle"></i></span>
            <h3>Destinatário</h3>
          </div>
          <hr className="divider"/>
          <div className="form-row">
            <input type="text" placeholder="Nome social" />
            <input type="text" placeholder="CPF/CNPJ" />
            <input type="text" placeholder="CEP" />
          </div>
          <div className="form-row">
            <input type="text" placeholder="Logradouro" />
            <input type="text" placeholder="Número" />
            <input type="text" placeholder="Referência" />
          </div>
          <div className="form-row">
            <input type="text" placeholder="Bairro/distrito" />
            <input type="text" placeholder="Cidade" />
            <input type="text" placeholder="UF" />
          </div>
        </section>

        <section className="form-section">
          <div className="section-header">
            <span className="icon"><i className="bi bi-tools"></i></span>
            <h3>Produto/Serviço</h3>
          </div>
          <hr className="divider"/>
          <div className="form-row">
            <input type="text" placeholder="Produto/Serviço" />
            <input type="text" placeholder="CNAE" />
            <input type="text" placeholder="Valor Unitário" />
          </div>
          <div className="form-row">
            <input type="text" placeholder="Unidade" />
            <input type="text" placeholder="Quantidade" />
            <input type="text" placeholder="Valor total" />
          </div>
          <div className="form-row full">
            <input type="text" placeholder="informação complementar a inserir no rodapé da nota fiscal? (opcional)" />
          </div>
        </section>

        <section className="form-section">
          <div className="section-header">
            <span className="icon"><i className="bi bi-bus-front"></i></span>
            <h3>Transporte</h3>
          </div>
          <hr className="divider"/>
          <div className="form-row">
            <input type="text" placeholder="Frete por conta" />
            <input type="text" placeholder="Nome Social" />
            <input type="text" placeholder="CPF/CNPJ" />
          </div>
          <div className="form-row">
            <input type="text" placeholder="Placa do veículo" />
            <input type="text" placeholder="Peso Bruto" />
            <input type="text" placeholder="Peso Líquido" />
          </div>
          <div className="form-row full">
            <input type="text" placeholder="informação complementar a inserir no rodapé da nota fiscal? (opcional)" />
          </div>
        </section>
        
        <section className="form-section">
          <div className="section-header">
            <span className="icon"><i className="bi bi-coin"></i></span>
            <h3>Valores</h3>
          </div>
          <hr className="divider"/>
          <div className="form-row">
            <input type="text" placeholder="valor do serviço" />
            <input type="text" placeholder="desconto incondicionado" />
            <input type="text" placeholder="desconto condicionado" />
          </div>
        </section>

        <div className="form-footer-avancar">
          <Link to="/emitir-nota/Finalizar">
            <a>AVANÇAR</a> <i className="bi bi-chevron-double-right"></i><i className="bi bi-chevron-double-right"></i>
          </Link>
        </div>
      </main>
  );
}

export default Tela_1_emitir_nota;