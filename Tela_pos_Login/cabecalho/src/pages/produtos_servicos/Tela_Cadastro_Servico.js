import Layout from '../../components/Layout';
import { Link } from 'react-router-dom';
import React, { useState } from "react";

function Tela_Cadastro_Servico() {

    return (
            <main className="content">
                    <div className="form-footer-voltar">
                        <Link to="/produtos/cadastro" className="previous-step">
                             Voltar <i className="bi bi-chevron-double-left"></i><i className="bi bi-chevron-double-left"></i>
                        </Link>
                    </div>
                <section className="form-section">
                    <div className="section-header">
                        <span className="icon"><i className="bi bi-journal-plus"></i></span>
                        <h3>Cadastrar novo Serviço</h3>
                    </div>
                    <hr />
                    <div className="form-row">
                        <input type="text" placeholder="Nome do Serviço" />
                        <input type="text" placeholder="Categoria (ex.: Consultoria, Manutenção, Transporte, etc.)" />
                        <input type="text" placeholder="Código interno (opcional)" />
                    </div>
                    <div className="form-row">
                        <input type="text" placeholder="Descrição detalhada" />
                    </div>
                    <div className="form-row">
                        <input type="text" placeholder="Preço" />
                        <input type="text" placeholder="Unidade de medida (ex.: hora, mês, diária, projeto)" />
                    </div>
                    <div className="form-row">
                        <input type="text" placeholder="CNAE (Classificação Nacional de Atividades Econômicas)" />
                        <input type="text" placeholder="Código do Serviço na lista da Lei Complementar 116/2003" />
                        <input type="text" placeholder="Item da Lista de Serviços" />
                    </div>
                    <div className="form-row">
                        <input type="text" placeholder="Alíquota de ISS (Imposto Sobre Serviços)" />
                        <input type="text" placeholder="CST PIS/COFINS" />
                        <input type="text" placeholder="Regime Especial de Tributação (se aplicável) (opcional)" />
                    </div>
                    <div className="botao_geral">
                     <button className="btn">Cadastrar </button>
                    </div>
                </section>
            </main>
    );
}

export default Tela_Cadastro_Servico;