import Layout from '../../components/Layout';
import { Link } from 'react-router-dom';
import React, { useState } from "react";

function Cadastro_cliente() {

    return (

            <main className="content">
                    <div className="form-footer voltar">
                        <Link to="/clientes" className="previous-step">
                             Voltar <i className="bi bi-chevron-double-left"></i><i className="bi bi-chevron-double-left"></i>
                        </Link>
                    </div>
                <section className="form-section">
                    <div className="section-header">
                        <span className="icon"><i className="bi bi-journal-plus"></i></span>
                        <h3>Cadastrar novo cliente</h3>
                    </div>
                    <hr />
                    <div className="form-row">
                        <input type="text" placeholder="Nome Social" />
                        <input type="text" placeholder="CPF / CNPJ" />
                        <input type="text" placeholder="CEP" />
                    </div>
                    <div className="form-row">
                        <input type="text" placeholder="Logradouro" />
                        <input type="text" placeholder="Número" />
                        <input type="text" placeholder="Bairro" />
                    </div>
                    <div className="form-row">
                        <input type="text" placeholder="Cidade" />
                        <input type="text" placeholder="Estado" />
                        <input type="text" placeholder="Referência (opcional)" />
                    </div>
                    <div className="form-row">
                        <input type="text" placeholder="E-mail" />
                        <input type="text" placeholder="Telefone" />
                        <input type="text" placeholder="Whatssap" />
                    </div>
                    <div className="form-row">
                        <input type="text" placeholder="Apelido (opcional)" />
                        <input type="text" placeholder="Tipo de serviço/Produto que oferece (opcional)" />
                    </div>
                    <div className="botao_geral">
                     <button className="btn">Cadastrar </button>
                    </div>
                </section>
            </main> 
    );
}

export default Cadastro_cliente;