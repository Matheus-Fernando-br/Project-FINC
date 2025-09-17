import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Planos.css";


function Planos() {

    const [planoAtivo, setPlanoAtivo] = useState(null);

  const togglePlano = (index) => {
    setPlanoAtivo(planoAtivo === index ? null : index);
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
                <div
                    className={`plano ${planoAtivo === 0 ? "ativo" : ""}`}
                    onClick={() => togglePlano(0)}
                >
                    <div className="plano-header">
                    <h3>BÁSICO</h3>
                    <span className="preco">R$ 19,90</span>
                    </div>
                    <p>até 80 notas/boletos mensais</p>
                    {planoAtivo === 0 && (
                    <div className="detalhes">
                        <p>• Emissão MANUAL agilizada de notas e boletos</p>
                        <p>• Auxílio da IA para preenchimento</p>
                        <p>• Cobrança extra de R$1,50 por nota adicional</p>
                        <p>• 300MB de armazenamento</p>
                    </div>
                    )}
                </div>

                <div
                    className={`plano ${planoAtivo === 1 ? "ativo" : ""}`}
                    onClick={() => togglePlano(1)}
                >
                    <div className="plano-header">
                    <h3>PREMIUM</h3>
                    <span className="preco">R$ 45,50</span>
                    </div>
                    <p>até 1.500 notas/boletos mensais</p>
                    {planoAtivo === 1 && (
                    <div className="detalhes">
                        <p>• Tudo do Básico +</p>
                        <p>• Maior limite de emissão</p>
                        <p>• Mais espaço de armazenamento</p>
                    </div>
                    )}
                </div>

                <div
                    className={`plano ${planoAtivo === 2 ? "ativo" : ""}`}
                    onClick={() => togglePlano(2)}
                >
                    <div className="plano-header">
                    <h3>BLACK</h3>
                    <span className="preco">R$ 185,60</span>
                    </div>
                    <p>emissões ilimitadas</p>
                    {planoAtivo === 2 && (
                    <div className="detalhes">
                        <p>• Tudo do Premium +</p>
                        <p>• Emissões ilimitadas</p>
                        <p>• Armazenamento ampliado</p>
                    </div>
                    )}
                </div>
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
                            Voltar para Tela Inicial <i className="bi bi-chevron-double-left"></i><i className="bi bi-chevron-double-left"></i>
                        </Link>
                    </div>

                </div>
            </section>
        </main>
  );
}

export default Planos;