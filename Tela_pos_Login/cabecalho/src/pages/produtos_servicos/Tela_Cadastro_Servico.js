import Layout from '../../components/Layout';
import icons from "../../components/Icons";
import { Link } from 'react-router-dom';
import React, { useState } from "react";

function Tela_Cadastro_Servico() {
    return (
        <main className="content">
            {/* Título */}
            <section className="titulo-secao">
                <h1><i className={icons.produtosAdd}></i> Cadastro de um novo Serviço</h1>
            </section>

            {/* Botão Voltar */}
            <div className="form-footer voltar">
                <Link to="/produtos/cadastro" className="previous-step">
                    Voltar <i className="bi bi-chevron-double-left"></i><i className="bi bi-chevron-double-left"></i>
                </Link>
            </div>

            {/* Seção 1 - Informações Básicas */}
            <section className="form-section">
                <p className="frase-campo-asterisco">
                    Os campos que contêm um asterisco (<span className="campo-obrigatório">*</span>) são de preenchimento obrigatório.
                </p>
                <div className="section-header">
                    <span className="icon"><i className={icons.produtos}></i></span>
                    <h3>Informações Básicas</h3>
                </div>
                <hr className="divider" />

                <div className="form-row">
                    <div className='form-group'>
                        <label>Nome do Serviço: <span className="campo-obrigatório">*</span></label>
                        <input type="text" placeholder="Digite o nome do serviço" />
                    </div>
                </div>
                <div className='form-row'>
                    <div className="form-group">
                        <label>Tipo de nota:</label>
                        <select defaultValue="nfs">
                            <option value="nfs">NFS-e (Serviço)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Categoria: <span className="campo-obrigatório">*</span></label>
                        <input type="text" placeholder="Ex.: Consultoria, Manutenção, Transporte, etc." />
                    </div>
                    <div className="form-group">
                        <label>Código Interno:</label>
                        <input type="text" placeholder="Digite o código interno" />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Descrição Detalhada: <span className="campo-obrigatório">*</span></label>
                        <input type="text" placeholder="Digite a descrição detalhada do serviço" />
                    </div>
                </div>
            </section>

            {/* Seção 2 - Precificação */}
            <section className="form-section">
                <div className="section-header">
                    <span className="icon"><i className={icons.cash}></i></span>
                    <h3>Precificação</h3>
                </div>
                <hr className="divider" />

                <div className="form-row">
                    <div className="form-group">
                        <label>Preço: <span className="campo-obrigatório">*</span></label>
                        <input type="text" placeholder="Digite o preço do serviço" />
                    </div>
                    <div className="form-group">
                        <label>Unidade de Medida: <span className="campo-obrigatório">*</span></label>
                        <input type="text" placeholder="Ex.: hora, mês, diária, projeto" />
                    </div>
                </div>
            </section>

            {/* Seção 3 - Tributação */}
            <section className="form-section">
                <div className="section-header">
                    <span className="icon"><i className={icons.moeda}></i></span>
                    <h3>Tributação</h3>
                </div>
                <hr className="divider" />

                <div className="form-row">
                    <div className="form-group">
                        <label>CNAE: <span className="campo-obrigatório">*</span></label>
                        <input type="text" placeholder="Digite o código CNAE" />
                    </div>
                    <div className="form-group">
                        <label>Código do Serviço (Lei 116/2003): <span className="campo-obrigatório">*</span></label>
                        <input type="text" placeholder="Digite o código do serviço na lista da lei" />
                    </div>
                    <div className="form-group">
                        <label>Item da Lista de Serviços: <span className="campo-obrigatório">*</span></label>
                        <input type="text" placeholder="Digite o item da lista de serviços" />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Alíquota de ISS: <span className="campo-obrigatório">*</span></label>
                        <input type="text" placeholder="Digite a alíquota do ISS" />
                    </div>
                    <div className="form-group">
                        <label>CST PIS/COFINS: <span className="campo-obrigatório">*</span></label>
                        <input type="text" placeholder="Digite o código CST PIS/COFINS" />
                    </div>
                    <div className="form-group">
                        <label>Regime Especial de Tributação:</label>
                        <input type="text" placeholder="Informe caso aplicável" />
                    </div>
                </div>
            </section>

            {/* Botão Final */}
            <div className="botao_geral">
                <button className="btn">Cadastrar</button>
            </div>
        </main>
    );
}

export default Tela_Cadastro_Servico;
