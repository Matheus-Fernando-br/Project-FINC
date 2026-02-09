import "../config.css";
import icons from "../../../components/Icons";
import { useNavigate } from "react-router-dom";

export default function Pagamento() {
    const navigate = useNavigate();
  return (
    <main className="content configuracao">

      <section className="form-section">
        <h2 className="config-subtitulo">Pagamento</h2>
         <section className="form-section">
            <div className="search-bar">
            <input type="text" placeholder="Pesquisar configurações..."/>
            <i className="bi bi-search"></i>
            </div>
            <hr />
            <div className="config-back">
                <button className="config-voltar" onClick={() => navigate("/configuracao")}>
                    <i className="bi bi-arrow-left"></i> Voltar
                </button>
            </div>
        </section>

        <div className="config-options-2">

          <div className="config-item">
            <div className="menu-esquerda">
              <i className="bi bi-credit-card"></i>
              <div>
                <h3>Método de pagamento</h3>
                <p>Forma padrão de cobrança</p>
              </div>
            </div>
            <div className="menu-direita">
              <select className="select-config">
                <option>Cartão de crédito</option>
                <option>Boleto</option>
                <option>PIX</option>
              </select>
            </div>
          </div>

        </div>
      </section>
      <section className="form-section">
         <div className="pagamento-container">
        {/* Cartão atual */}
        <div className="cartao-atual">
          <h3>Cartão de crédito atual</h3>
          <div className="cartao-visual">
            <div className="cartao-header">Cartão PJ</div>
            <div className="cartao-numero">*** 123-456-7890</div>
            <div className="cartao-footer">Fev 2025</div>
          </div>
        </div>

        {/* Selecionar novo cartão */}
        <div className="novo-cartao">
          <h3>Selecionar novo cartão para pagamento</h3>
          <label>
            <input type="checkbox" /> (nº do cartão)
          </label>
          <label>
            <input type="checkbox" /> (nº do cartão)
          </label>
          <label>
            <input type="checkbox" /> (nº do cartão)
          </label>
        </div>
      </div>

      {/* Cadastrar novo cartão */}
      <div className="cadastro-cartao">
          <h3>Cadastrar novo cartão de crédito</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Titular do cartão </label>
                <input type="text" placeholder="Informe o nome completo do titular" />
            </div>
            <div className="form-group">
              <label>Número do cartão </label>
                <input type="text" placeholder="Informe o número do cartão" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Validade </label>
                <input type="text" placeholder="MM/AA" />
            </div>
            <div className="form-group">
              <label>Agência </label>
                <input type="text" placeholder="Informe a agência" />
            </div>
            <div className="form-group">
              <label>Código de segurança </label>
                <input type="text" placeholder="CVV" />
            </div>
          </div>
          <div className="botao_geral">
          <button className="btn-cadastrar">Cadastrar Cartão</button>
          </div>
      </div>
      </section>

    </main>
  );
}
