import Layout from "./app/Layout";
import icons from "../components/Icons";
import { useState } from "react";
import { Link } from 'react-router-dom';
import * as XLSX from "xlsx";
import '..//styles/global.css';
import axios from "axios"; // Garanta que o axios esteja instalado
import { useNavigate } from "react-router-dom";

function ImportSheetBase({ type }) {

    const [previewData, setPreviewData] = useState([]);
    const [isImporting, setIsImporting] = useState(false); // Para mostrar carregamento
    const navigate = useNavigate();
    const [error, setError] = useState("");

    function normalizeHeader(text) {
        return text
            .toString()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9]/g, "_")
            .replace(/_+/g, "_")
            .toLowerCase()
            .trim();
    }

    // Normaliza o "type" recebido da rota
    const normalizedType = normalizeHeader(type); 
    // ex: "serviços" → "servicos"

    const expectedColumns = {
        clientes: [
            "nome",
            "tipopessoa",
            "cpf_cnpj",
            "email",
            "telefone",
            "whatsapp",
            "cep",
            "uf",
            "cidade",
            "rua",
            "numero",
            "complemento"
        ],

        produtos: [
            "name",
            "manufacturer",
            "category",
            "description",
            "sku",
            "unittype",
            "unitprice",
            "ncm",
            "cfop",
            "icms",
            "cofins",
            "productorigin"
        ],

        servicos: [
            "name",
            "category",
            "description",
            "sku",
            "unittype",
            "amount",
            "unitprice",
            "cnae",
            "servicecod",
            "iss",
            "cofins",
            "specialtaxregime",
            "municipality"
        ]
    };

    const downloadModel = () => {
        const fileMap = {
            clientes: "/ImportSheet/modelo-clientes.xlsx",
            servicos: "/ImportSheet/modelo-servico.xlsx",
            produtos: "/ImportSheet/modelo-produto.xlsx",
        };

        const fileUrl = fileMap[normalizedType];

        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = fileUrl.split("/").pop();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError("");
        setPreviewData([]);

        const reader = new FileReader();

        reader.onload = (event) => {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: "array" });

            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            if (jsonData.length === 0) {
                setError("A planilha está vazia.");
                return;
            }

            const header = jsonData[0].map(col => normalizeHeader(col));

            const expected = expectedColumns[normalizedType];

            if (!expected) {
                setError("Erro interno: tipo não reconhecido.");
                return;
            }

            const isValid = expected.every(col => header.includes(col));

            if (!isValid) {
                setError(
                    `❌ A planilha carregada não corresponde ao modelo de "${type}". Esperado: ${expected.join(", ")}`
                );
                return;
            }

            const normalized = jsonData.slice(1).map(row => {
                let obj = {};
                expected.forEach((col, index) => {
                    obj[col] = row[index] || "";
                });
                return obj;
            });

            setPreviewData(normalized);
        };

        reader.readAsArrayBuffer(file);
    };

    const handleImport = async () => {
        if (previewData.length === 0) return;
        setIsImporting(true);
        const token = localStorage.getItem("token");

        try {
            let dadosMapeados = [];

            if (normalizedType === "clientes") {
                dadosMapeados = previewData.map(item => ({
                    nome_social: item.nome,
                    tipo_pessoa: item.tipopessoa === "PF" ? "PFisica" : "PJuridica",
                    cpf_cnpj: item.cpf_cnpj, email: item.email, telefone: item.telefone,
                    whatsapp: item.whatsapp, cep: item.cep, uf: item.uf, cidade: item.cidade,
                    logradouro: item.rua, numero: item.numero, complemento: item.complemento
                }));
            } 
            else if (normalizedType === "produtos") {
                dadosMapeados = previewData.map(item => ({
                    nome: item.name,
                    fabricante: item.manufacturer,
                    categoria: item.category,
                    descricao: item.description,
                    sku: item.sku,
                    unidade_medida: item.unittype, // Ajustado para bater com o DB
                    preco_unitario: parseFloat(item.unitprice.toString().replace(',', '.')) || 0,
                    ncm: item.ncm,
                    cfop: item.cfop,
                    icms: item.icms,
                    pis_cofins: item.cofins, // Ajustado
                    origem: item.productorigin.split(' ')[0], // Pega apenas o "0" de "0 - Nacional"
                }));
            } 
            else if (normalizedType === "servicos") {
                dadosMapeados = previewData.map(item => ({
                    nome: item.name,
                    categoria: item.category,
                    descricao_detalhada: item.description, // Ajustado
                    codigo_interno: item.sku, // Ajustado
                    unidade_medida: item.unittype, // Ajustado
                    preco: parseFloat(item.unitprice.toString().replace(',', '.')) || 0,
                    cnae: item.cnae,
                    quantidade: parseInt(item.amount) || 1,
                    municipio: item.municipality,
                    codigo_servico: item.servicecod,
                    aliquota_iss: item.iss, // Ajustado
                    cst_pis_cofins: item.cofins, // Ajustado
                    regime_especial: item.specialtaxregime
                }));
            }

            // Usando PUT conforme seu router definiu para a rota de importação
            await axios.put(`https://project-finc.onrender.com/${normalizedType}`, dadosMapeados, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert("Importação concluída com sucesso!");
            navigate(`/${normalizedType}`);
        } catch (err) {
            console.error(err);
            alert("Erro ao importar dados. Verifique o console.");
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <Layout>
            <main className="content import-sheet">

                <section className="form-section">
                    <div className="form-footer-voltar">
                        <Link to="/produtos" className="previous-step">
                            Voltar <i className="bi bi-chevron-double-left"></i><i className="bi bi-chevron-double-left"></i>
                        </Link>
                    </div>

                    <div className="section-header">
                        <span className="icon"><i className={icons.clientesAdd}></i></span>
                        <h3>Cadastrar novos {type}</h3>
                    </div>

                    <hr className="divider" />
                    <label>Baixe o modelo, preencha e carregue abaixo.</label>
                
                    <section className="botoes">
                        <button className="btn btn-azul" onClick={downloadModel}>
                            Baixar Modelo
                        </button>

                        <button className="btn btn-verde">
                            <input type="file" accept=".xlsx" onChange={handleFileUpload} />
                        </button>
                    </section>

                    {error && (
                        <p style={{ color: "red", marginTop: "15px" }}>
                            {error}
                        </p>
                    )}
                </section>

                <section className="form-section">
                    <div className="section-header">
                        <span className="icon"><i className={icons.feedback}></i></span>
                        <h3>Pré-Visualização</h3>
                    </div>

                    <hr className="divider" />

                    {!previewData.length && (
                        <label>Carregue uma planilha válida para ver a pré-visualização.</label>
                    )}

                    {!!previewData.length && (
                    <section className="tabela-planilha">
                        {previewData.length > 0 ? (
                            <div className="preview-wrapper">
                                <table className="preview-table">
                                    <thead>
                                        <tr>
                                            {Object.keys(previewData[0]).map((col, index) => (
                                                <th key={index}>{col}</th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {previewData.map((row, rowIndex) => (
                                            <tr key={rowIndex}>
                                                {Object.keys(row).map((col, colIndex) => (
                                                    <td key={colIndex}>{row[col]}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p>Nenhum dado carregado ainda.</p>
                        )}
                    </section>

                    )}

                    <section className="botoes">
                        <button 
                            className="btn-vermelho" 
                            onClick={() => setPreviewData([])}
                            disabled={isImporting}
                        >
                            Cancelar
                        </button>
                        <div className="botao_geral">
                            <button 
                                className="btn" 
                                onClick={handleImport} 
                                disabled={previewData.length === 0 || isImporting}
                            >
                                {isImporting ? "Importando..." : `Salvar novos ${type}`}
                            </button>
                        </div>
                    </section>
                </section>

            </main>
        </Layout>
    );
}

export default ImportSheetBase;
