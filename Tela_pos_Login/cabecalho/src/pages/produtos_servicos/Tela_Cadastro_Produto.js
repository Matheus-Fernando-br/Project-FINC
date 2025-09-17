import Layout from '../../components/Layout';
import { Link } from 'react-router-dom';
import React, { useState } from "react";

function Tela_Cadastro_Produto() {

    return (

            <main className="content">
                    <div className="form-footer voltar">
                        <Link to="/produtos/cadastro" className="previous-step">
                             Voltar <i className="bi bi-chevron-double-left"></i><i className="bi bi-chevron-double-left"></i>
                        </Link>
                    </div>
                <section className="form-section">
                    <div className="section-header">
                        <span className="icon"><i className="bi bi-journal-plus"></i></span>
                        <h3>Cadastrar novo Produto</h3>
                    </div>
                    <hr className="divider"/>
                    <div className="form-row">
                        <input type="text" placeholder="Nome" />
                        <input type="text" placeholder="Categoria" />
                        <input type="text" placeholder="Marca/Fabricante" />
                    </div>
                    <div className="form-row">
                        <input type="text" placeholder="Descrição" />
                    </div>
                    <div className="form-row">
                        <input type="text" placeholder="Código interno / SKU" />
                        <input type="text" placeholder="Unidade de Medida" />
                        <input type="text" placeholder="Preço Unitário" />
                    </div>
                    <div className="form-row">
                        <input type="text" placeholder="NCM (Nomenclatura Comum do Mercosul)" />
                        <input type="text" placeholder="CFOP(Código Fiscal de Operações e Prestações)" />
                    </div>
                    <div className="form-row">
                        <input type="text" placeholder="CST/CSOSN ICMS" />
                        <input type="text" placeholder="CST IPI (Opcional)" />
                        <input type="text" placeholder="E-CST PIS/COFINS" />
                    </div>
                    <div className="form-row">
                        <input type="text" placeholder="Alíquotas de impostos (ICMS, IPI, PIS, COFINS)" />
                        <input type="text" placeholder="Origem do produto (0 = Nacional, 1 = Estrangeira)" />
                    </div>
    
                    <div className="botao_geral">
                     <button className="btn">Cadastrar </button>
                    </div>
                </section>
            </main>
    );
}

export default Tela_Cadastro_Produto;