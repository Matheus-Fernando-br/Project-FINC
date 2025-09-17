import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Duvidas.css";

function Duvidas() {
  const [duvidaAtiva, setDuvidaAtiva] = useState(null);

  const toggleDuvida = (index) => {
    setDuvidaAtiva(duvidaAtiva === index ? null : index);
  };

  return (
    <main className="Duvidas">
      {/* Conteúdo principal (lado esquerdo + direito) */}
      <div className="Duvidas-conteudo">
        {/* Lado Esquerdo */}
        <div className="Duvidas-lado-esquerdo">
          <div className="Duvidas-texto">
            <h2>Ficou com alguma dúvida?</h2>
            <p>
              Separamos algumas dúvidas comuns, mas caso essas não te ajudem,
              entre em contato com nosso time pelos canais de contato. Estamos
              prontos para te ajudar!
            </p>
          </div>

          <div className="Duvidas-contato">
            <h3>Nos envie sua dúvida</h3>
            <button className="Duvidas-btn">
              <i className="bi bi-envelope-at"></i> contato@finc.com.br
            </button>
            <button className="Duvidas-btn">
              <i className="bi bi-whatsapp"></i> Whatsapp
            </button>
          </div>
        </div>

        {/* Lado Direito */}
        <div className="Duvidas-lado-direito">
          <div
            className={`Duvidas-item ${duvidaAtiva === 0 ? "ativo" : ""}`}
            onClick={() => toggleDuvida(0)}
          >
            <div className="Duvidas-header">
              <h3>
                <i className="bi bi-1-square"></i> Preciso instalar algum
                programa?
              </h3>
              <span>
                <i className="bi bi-plus-square-fill"></i>
              </span>
            </div>
            {duvidaAtiva === 0 && (
              <div className="Duvidas-detalhes">
                <p>
                  • Não. A FINC é 100% online e pode ser acessada de qualquer
                  dispositivo conectado à internet.
                </p>
              </div>
            )}
          </div>

          <div
            className={`Duvidas-item ${duvidaAtiva === 1 ? "ativo" : ""}`}
            onClick={() => toggleDuvida(1)}
          >
            <div className="Duvidas-header">
              <h3>
                <i className="bi bi-2-square"></i> A plataforma se integra com
                e-commerces?
              </h3>
              <span>
                <i className="bi bi-plus-square-fill"></i>
              </span>
            </div>
            {duvidaAtiva === 1 && (
              <div className="Duvidas-detalhes">
                <p>
                  • Sim, a FINC possui integração com sistemas de e-commerce
                  para automatizar notas e cobranças.
                </p>
              </div>
            )}
          </div>

          <div
            className={`Duvidas-item ${duvidaAtiva === 2 ? "ativo" : ""}`}
            onClick={() => toggleDuvida(2)}
          >
            <div className="Duvidas-header">
              <h3>
                <i className="bi bi-3-square"></i> O contador pode acessar meus
                relatórios?
              </h3>
              <span>
                <i className="bi bi-plus-square-fill"></i>
              </span>
            </div>
            {duvidaAtiva === 2 && (
              <div className="Duvidas-detalhes">
                <p>
                  • Sim. A plataforma oferece acesso exclusivo para contadores
                  acompanharem caixa e relatórios em tempo real.
                </p>
              </div>
            )}
          </div>

          <div
            className={`Duvidas-item ${duvidaAtiva === 3 ? "ativo" : ""}`}
            onClick={() => toggleDuvida(3)}
          >
            <div className="Duvidas-header">
              <h3>
                <i className="bi bi-4-square"></i> E se eu ultrapassar o limite
                de armazenamento?
              </h3>
              <span>
                <i className="bi bi-plus-square-fill"></i>
              </span>
            </div>
            {duvidaAtiva === 3 && (
              <div className="Duvidas-detalhes">
                <p>
                  • A plataforma notifica o usuário e oferece a possibilidade de
                  upgrade para um plano superior, parando de armazenar notas e
                  boletos.
                </p>
              </div>
            )}
          </div>

          <div
            className={`Duvidas-item ${duvidaAtiva === 4 ? "ativo" : ""}`}
            onClick={() => toggleDuvida(4)}
          >
            <div className="Duvidas-header">
              <h3>
                <i className="bi bi-5-square"></i> Por que escolher a FINC?
              </h3>
              <span>
                <i className="bi bi-plus-square-fill"></i>
              </span>
            </div>
            {duvidaAtiva === 4 && (
              <div className="Duvidas-detalhes">
                <p>
                  • Simples, acessível e fácil de usar. Nosso sistema exclusivo
                  de emissão de NFS-e automatiza o trabalho de prestadores de
                  serviço, fornecedores e lojas físicas, garantindo praticidade
                  sem perder o controle.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rodapé fixado no centro inferior */}
      <div className="rodape form-footer voltar">
        <Link to="/">
          Voltar para Tela Inicial{" "}
          <i className="bi bi-chevron-double-left"></i>
          <i className="bi bi-chevron-double-left"></i>
        </Link>
      </div>
    </main>
  );
}

export default Duvidas;
