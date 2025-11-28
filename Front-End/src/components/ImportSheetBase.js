import Layout from "./app/Layout";
import icons from "../components/Icons";
import { useState } from "react";
import { Link } from 'react-router-dom';
import '..//styles/global.css';

function ImportSheetBase({ type }) {

    const downloadModel = () => {
        const fileMap = {
            "clientes": "/ImportSheet/modelo-clientes.xlsx",
            "serviços": "/ImportSheet/modelo-servicos.xlsx",
            "produtos": "/ImportSheet/modelo-produtos.xlsx",
        };

        const fileUrl = fileMap[type];

        // Força download
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = fileUrl.split("/").pop();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Layout>
            <main className="content import-sheet">
                <section className="form-section">
                    <div className="form-footer-voltar">
                        <Link to="/produtos" className="previous-step">
                            Voltar <i className="bi bi-chevron-double-left"></i>
                            <i className="bi bi-chevron-double-left"></i>
                        </Link>
                    </div>
                    <div className="section-header">
                        <span className="icon"><i className={icons.clientesAdd}></i></span>
                        <h3>Cadastrar novos {type}</h3>
                    </div>
                    <hr className="divider" />
                    <label>Baixe abaixo o modelo da planilha (.xlsx), preencha com os novos dados dos clientes e, em seguida, clique em Carregar Planilha para enviar as informações ao sistema.</label>
                
                    <section className="botoes">
                        <button className="btn btn-azul" onClick={downloadModel}>
                            Baixar Modelo
                        </button>

                        <button className="btn btn-verde">
                            <input type="file" />
                        </button>
                    </section>
                </section>

                <section className="form-section">
                    <div className="section-header">
                    <span className="icon"><i className={icons.feedback}></i></span>
                    <h3>Pré-Vizualização</h3>
                    </div>

                    <hr className="divider" />

                    <label>Confira atentamente os dados na pré-visualização antes de salvar. Certifique-se de que todas as informações dos clientes estão corretas.</label>
                    <div className="form-row">
                    <section className="tabela-planilha">
                        
                    </section>

                    </div>

                    <section className="botoes">
                        <button className="btn-vermelho">
                            Cancelar
                        </button>
                        <div className="botao_geral">
                        <button className="btn">
                            Salvar novos {type}
                        </button>
                        </div>
                    </section>
                </section>

            </main>
        </Layout>
    );
}
export default ImportSheetBase;