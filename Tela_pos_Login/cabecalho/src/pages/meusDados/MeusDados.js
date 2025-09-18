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
                <h2>Gabriel Moreninho Tupinambá</h2>
            </div>

             <section className="form-section">
                <hr/>

                <div className="form-row">
                    <input type="text" placeholder="Nome"/>
                    <input type="text" placeholder="E-mail"/>
                    <input type="text" placeholder="Data de Nascimento"/>
                </div>
                <div className="form-row">
                    <input type="text" placeholder="CNPJ/CPF"/>
                    <input type="email" placeholder="CEP"/>

                </div>
                <div className="form-row">
                    <input type="text" placeholder="Logradouro"/>
                    <input type="text" placeholder="Número"/>
                    <input type="text" placeholder="Complemento?"/>
                </div>
                <div className="form-row">
                    <input type="text" placeholder="Bairro"/>
                    <input type="text" placeholder="Município"/>
                    <input type="text" placeholder="UF"/>
                </div>
                <div className="form-row">
                    <input type="text" placeholder="Telefone"/>
                    <input type="text" placeholder="Whatssap"/>
                    <input type="text" placeholder="Sexo"/>
                </div>
                <div className="form-row">
                    <input type="text" placeholder="Apelido"/>
                    <input type="text" placeholder="Categoria"/>
                    <input type="text" placeholder="Foto"/>
                </div>
            
                <div className="botao_geral">
                    <button type="submit" className="btn-atualizar">Editar</button>
                </div>
            </section>
               
            
        </main> 
    );
}

export default MeusDados;