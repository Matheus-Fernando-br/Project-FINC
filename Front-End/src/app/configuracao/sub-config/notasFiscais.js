// NotasFiscais.jsx
import "../config.css";
import icons from "../../../components/Icons";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function NotasFiscais() {

  const navigate = useNavigate();

  const [config, setConfig] = useState({
    ambiente: "homologacao",
    tipoEmissao: "normal",
    naturezaOperacao: "",
    cfop: "",
    serie: "1",
    numeroInicial: "1",
    numeracaoAutomatica: "sim"
  });

  function handleChange(e) {
    setConfig({ ...config, [e.target.name]: e.target.value });
  }

  return (
    <main className="content configuracao">

      {/* ===== TITULO ===== */}
      <section className="titulo-secao">
        <h1>
          <i className={icons.emitirNota}></i> Notas Fiscais
        </h1>
      </section>

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

      {/* ===== EMISSÃO ===== */}
      <section className="form-section">
        
        <h2 className="config-subtitulo">Emissão</h2>
        <hr className="divider"/>

        <div className="config-options-2">

          {/* Ambiente */}
          <div className="config-item row">
            <div className="menu-esquerda">
              <i className="bi bi-globe"></i>
              <div>
                <h3>Ambiente</h3>
                <p>Defina o ambiente de emissão</p>
              </div>
            </div>

            <div className="menu-direita">
              <select
                className="select-config"
                name="ambiente"
                value={config.ambiente}
                onChange={handleChange}
              >
                <option value="homologacao">Homologação</option>
                <option value="producao">Produção</option>
              </select>
            </div>
          </div>

          {/* Tipo emissão */}
          <div className="config-item row">
            <div className="menu-esquerda">
              <i className="bi bi-receipt"></i>
              <div>
                <h3>Tipo de emissão</h3>
                <p>Tipo padrão para envio das notas</p>
              </div>
            </div>

            <div className="menu-direita">
              <select
                className="select-config"
                name="tipoEmissao"
                value={config.tipoEmissao}
                onChange={handleChange}
              >
                <option value="normal">Normal</option>
                <option value="contingencia">Contingência</option>
              </select>
            </div>
          </div>

        </div>
      </section>

      {/* ===== NATUREZA ===== */}
      <section className="form-section">

        <h2 className="config-subtitulo">Natureza e CFOP</h2>
        <hr className="divider"/>

        <div className="config-options-2">

          {/* Natureza operação */}
          <div className="config-item row">
            <div className="menu-esquerda">
              <i className="bi bi-journal-text"></i>
              <div>
                <h3>Natureza da operação</h3>
                <p>Descrição padrão da operação</p>
              </div>
            </div>

            <div className="menu-direita">
              <input
                className="input-config"
                name="naturezaOperacao"
                value={config.naturezaOperacao}
                onChange={handleChange}
                placeholder="Ex: Venda de mercadoria"
              />
            </div>
          </div>

          {/* CFOP */}
          <div className="config-item row">
            <div className="menu-esquerda">
              <i className="bi bi-list-check"></i>
              <div>
                <h3>CFOP padrão</h3>
                <p>Código fiscal padrão</p>
              </div>
            </div>

            <div className="menu-direita">
              <input
                className="input-config"
                name="cfop"
                value={config.cfop}
                onChange={handleChange}
                placeholder="Ex: 5102"
              />
            </div>
          </div>

        </div>
      </section>

      {/* ===== SÉRIES ===== */}
      <section className="form-section">

        <h2 className="config-subtitulo">Séries e Numeração</h2>
        <hr className="divider"/>

        <div className="config-options-2">

          {/* Série */}
          <div className="config-item row">
            <div className="menu-esquerda">
              <i className="bi bi-hash"></i>
              <div>
                <h3>Série da nota</h3>
                <p>Série padrão da emissão</p>
              </div>
            </div>

            <div className="menu-direita">
              <input
                className="input-config"
                name="serie"
                value={config.serie}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Número inicial */}
          <div className="config-item row">
            <div className="menu-esquerda">
              <i className="bi bi-123"></i>
              <div>
                <h3>Número inicial</h3>
                <p>Número inicial da sequência</p>
              </div>
            </div>

            <div className="menu-direita">
              <input
                className="input-config"
                name="numeroInicial"
                value={config.numeroInicial}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Numeração automática */}
          <div className="config-item row">
            <div className="menu-esquerda">
              <i className="bi bi-arrow-repeat"></i>
              <div>
                <h3>Numeração automática</h3>
                <p>Controle automático da sequência</p>
              </div>
            </div>

            <div className="menu-direita">
              <select
                className="select-config"
                name="numeracaoAutomatica"
                value={config.numeracaoAutomatica}
                onChange={handleChange}
              >
                <option value="sim">Ativado</option>
                <option value="nao">Desativado</option>
              </select>
            </div>
          </div>

        </div>
      </section>

    </main>
  );
}
