import Layout from '../../components/Layout';
import icons from "../../components/Icons";
import { Link } from 'react-router-dom';

function Tela_1_emitir_nota() {
  return (
    <main className="content">
      <section className='titulo-secao'>
        <h1><i className={icons.emitirNota}></i> Emitir Nota Fiscal</h1>
      </section>
      <section className="form-section">
          <p className="frase-campo-asterisco">
            Os campos que contêm um asterisco (<span className="campo-obrigatório">*</span>) são de preenchimento obrigatório.
          </p>
        <div className="section-header">
          <span className="icon"><i className={icons.clientes}></i></span>
          <h3>Cliente</h3>
        </div>
        <hr className="divider" />
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="nome-social">Nome Social <span className='campo-obrigatório'>*</span></label>
            <input id="nome-social" type="text" placeholder="Selecione" />
          </div>
          <div className="form-group">
            <label htmlFor="cpf-cnpj">CPF/CNPJ <span className='campo-obrigatório'>*</span></label>
            <input id="cpf-cnpj" type="text" placeholder="Selecione" />
          </div>
        </div>
      </section>

      <section className="form-section">
        <div className="section-header">
          <span className="icon"><i className={icons.produtos}></i></span>
          <h3>Produto/Serviço</h3>
        </div>
        <hr className="divider" />
        <div className="form-row radio-group">
          <label className="label-radio">Selecione o tipo: <span className='campo-obrigatório'>*</span></label>
          <div className="radio-option">
            <input type="radio" id="produto" name="tipo" value="produto" />
            <label htmlFor="produto">Produto</label>
          </div>
          <div className="radio-option">
            <input type="radio" id="servico" name="tipo" value="servico" />
            <label htmlFor="servico">Serviço</label>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="item">Selecione o produto/serviço <span className='campo-obrigatório'>*</span></label>
            <input id="item" type="text" placeholder="Selecione" />
          </div>
          <div className="form-group">
            <label htmlFor="quantidade">Quantidade <span className='campo-obrigatório'>*</span></label>
            <input id="quantidade" type="text" placeholder="Digite a quantidade de itens" />
          </div>
        </div>
        <div className="form-row full">
          <div className="form-group">
            <label htmlFor="info">Informação complementar</label>
            <input
              id="info"
              type="text"
              placeholder="Informação complementar no rodapé da nota (opcional)"
            />
          </div>
        </div>
      </section>

      <section className="form-section">
        <div className="section-header">
          <span className="icon"><i className={icons.transporte}></i></span>
          <h3>Transporte</h3>
        </div>
        <hr className="divider" />
        <div className="form-row radio-group">
          <label className="label-radio">Frete por conta? <span className='campo-obrigatório'>*</span></label>
          <div className="radio-option">
            <input type="radio" id="sim" name="frete" value="sim" />
            <label htmlFor="sim">Sim</label>
          </div>
          <div className="radio-option">
            <input type="radio" id="nao" name="frete" value="nao" />
            <label htmlFor="nao">Não</label>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="trans-nome">Nome Social</label>
            <input id="trans-nome" type="text" placeholder="Nome da Empresa" />
          </div>
          <div className="form-group">
            <label htmlFor="trans-cpf">CPF/CNPJ</label>
            <input id="trans-cpf" type="text" placeholder="CPF ou CNPJ da Empresa" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="placa">Placa do veículo</label>
            <input id="placa" type="text" placeholder="000-0000" />
          </div>
          <div className="form-group input-suffix">
            <label htmlFor="peso-bruto">Peso Bruto</label>
            <input id="peso-bruto" type="number" placeholder="0" />
            <span className="suffix">Kg</span>
          </div>
          <div className="form-group input-suffix">
            <label htmlFor="peso-liquido">Peso Líquido</label>
            <input id="peso-liquido" type="number" placeholder="0" />
            <span className="suffix">Kg</span>
          </div>
        </div>
        <div className="form-row full">
          <div className="form-group">
            <label htmlFor="info-transporte">Informação complementar</label>
            <input
              id="info-transporte"
              type="text"
              placeholder="Informação complementar no rodapé da nota (opcional)"
            />
          </div>
        </div>
      </section>

      <section className="form-section">
        <div className="section-header">
          <span className="icon"><i className={icons.moeda}></i></span>
          <h3>Valores</h3>
        </div>
        <hr className="divider" />
        <div className="form-row">
          <div className="form-group input-prefix">
            <label htmlFor="desc-incond">Desconto incondicionado</label>
            <span className="prefix">R$</span>
            <input id="desc-incond" type="number" placeholder="0,00" />
          </div>
          <div className="form-group input-prefix">
            <label htmlFor="desc-cond">Desconto condicionado</label>
            <span className="prefix">R$</span>
            <input id="desc-cond" type="number" placeholder="0,00" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group input-prefix">
            <label htmlFor="valor-total">Valor Total</label>
            <span className="prefix">R$</span>
            <input id="valor-total" type="number" placeholder="0,00" />
          </div>
        </div>
      </section>

      <div className="form-footer-avancar">
        <Link to="/emitir-nota/Finalizar">
          <a>AVANÇAR</a>{" "}
          <i className="bi bi-chevron-double-right"></i>
          <i className="bi bi-chevron-double-right"></i>
        </Link>
      </div>
    </main>
  );
}

export default Tela_1_emitir_nota;
