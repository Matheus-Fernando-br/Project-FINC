import Layout from '../../components/Layout';
import icons from "../../components/Icons";
import { Link } from 'react-router-dom';
import React, { useState } from "react";

function Tela_Cadastro_Produto() {
    return (
        <main className="content">
            {/* Título */}
            <section className='titulo-secao'>
                <h1><i className={icons.produtosAdd}></i> Cadastro de um novo Produto</h1>
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
                    <div className="form-group">
                        <label>Nome: <span className="campo-obrigatório">*</span></label>
                        <input type="text" placeholder="Digite o nome do produto" />
                    </div>
                    <div className="form-group">
                        <label>Marca/Fabricante:</label>
                        <input type="text" placeholder="Digite a marca ou fabricante" />
                    </div>
                </div>

                <div className='form-row'>
                    <div className="form-group">
                        <label>Categoria: <span className="campo-obrigatório">*</span></label>
                        <input type="text" placeholder="Digite a categoria" />
                    </div>
                    <div className="form-group">
                        <label>
                            Que tipo de nota deseja para esse produto?:
                            <span className="campo-obrigatório"> *</span>
                        </label>
                        <select defaultValue="">
                            <option value="" disabled>Selecione o Tipo</option>
                            <option value="nfe">NF-e (Produto)</option>
                            <option value="nfce">NFC-e (Consumidor)</option>
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Descrição:</label>
                        <input type="text" placeholder="Digite a descrição do produto" />
                    </div>
                </div>
            </section>

            {/* Seção 2 - Identificação */}
            <section className="form-section">
                <div className="section-header">
                    <span className="icon"><i className={icons.produtoIdentidade}></i></span>
                    <h3>Identificação</h3>
                </div>
                <hr className="divider" />

                <div className="form-row">
                    <div className="form-group">
                        <label>Código interno / SKU: <span className="campo-obrigatório">*</span></label>
                        <input type="text" placeholder="Digite o código ou SKU" />
                    </div>
                    <div className="form-group">
                        <label>Unidade de Medida: <span className="campo-obrigatório">*</span></label>
                        <input type="text" placeholder="Ex: UN, KG, CX" />
                    </div>
                    <div className="form-group">
                        <label>Preço Unitário: <span className="campo-obrigatório">*</span></label>
                        <input type="text" placeholder="Digite o valor unitário" />
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
                        <label>NCM: <span className="campo-obrigatório">*</span></label>
                        <input type="text" placeholder="Digite o código NCM" />
                    </div>
                    <div className="form-group">
                        <label>CFOP: <span className="campo-obrigatório">*</span></label>
                        <input type="text" placeholder="Digite o código CFOP" />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>CST/CSOSN ICMS: <span className="campo-obrigatório">*</span></label>
                        <input type="text" placeholder="Digite o código ICMS" />
                    </div>
                    <div className="form-group">
                        <label>CST IPI:</label>
                        <input type="text" placeholder="Digite o código IPI" />
                    </div>
                    <div className="form-group">
                        <label>E-CST PIS/COFINS: <span className="campo-obrigatório">*</span></label>
                        <input type="text" placeholder="Digite o código PIS/COFINS" />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Alíquotas de Impostos: <span className="campo-obrigatório">*</span></label>
                        <input type="text" placeholder="ICMS, IPI, PIS, COFINS" />
                    </div>
                    <div className="form-group">
                        <label>Origem do Produto: <span className="campo-obrigatório">*</span></label>
                        <input type="text" placeholder="0 = Nacional, 1 = Estrangeira" />
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

export default Tela_Cadastro_Produto;
