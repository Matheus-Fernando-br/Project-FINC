import { Link } from 'react-router-dom';
import icons from "../../components/Icons";
import React, { useState } from "react";
import './MeusDados.css'

function MeusDados() {

    return (
        <main className="content MeusDados">
            <section className='titulo-secao'>
                <h1><i className={icons.clientePerson}></i> Meu Perfil</h1>
            </section>            
            <div className="perfil">
                <i class="bi bi-person-circle"></i> {/*foto da pessoa aqui*/}
                <h2>Gabriel Moreira Carvalho</h2>
            </div>

             <section className="form-section">
                <hr/>

                <div className="form-row">
                    <div className="form-group">
                        <label>Nome: </label>
                        <input type="text" placeholder="Informe o nome"/>
                    </div>
                    <div className="form-group">
                        <label>E-mail: </label>
                        <input type="text" placeholder="Informe o e-mail"/>
                    </div>
                    <div className="form-group">
                        <label>Data de Nascimento: </label>
                        <input type="text" placeholder="Informe a data de nascimento"/>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>CNPJ/CPF: </label>
                        <input type="text" placeholder="Informe o CNPJ/CPF"/>
                    </div>
                    <div className="form-group">
                        <label>CEP: </label>
                        <input type="email" placeholder="Informe o CEP"/>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>UF: </label>
                        <input type="text" placeholder="Informe a UF"/>
                    </div>
                    <div className="form-group">
                        <label>Município: </label>
                        <input type="text" placeholder="Informe o município"/>
                    </div>
                    <div className="form-group">
                        <label>Bairro: </label>
                        <input type="text" placeholder="Informe o bairro"/>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Logradouro: </label>
                        <input type="text" placeholder="Informe o logradouro"/>
                    </div>
                    <div className="form-group">
                        <label>Número: </label>
                        <input type="text" placeholder="Informe o número"/>
                    </div>
                    <div className="form-group">
                        <label>Complemento: </label>
                        <input type="text" placeholder="Informe o complemento"/>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Telefone: </label>
                        <input type="text" placeholder="Informe o telefone"/>
                    </div>
                    <div className="form-group">
                        <label>Whatssap: </label>
                        <input type="text" placeholder="Informe o Whatssap"/>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Apelido: </label>
                        <input type="text" placeholder="Informe o apelido"/>
                    </div>
                    <div className="form-group">
                        <label>Categoria: </label>
                        <input type="text" placeholder="Informe a categoria"/>
                    </div>
                </div>
            
                <div className="botao_geral">
                    <button type="submit" className="btn-atualizar">Editar</button>
                </div>
            </section>
               
            
        </main> 
    );
}

export default MeusDados;