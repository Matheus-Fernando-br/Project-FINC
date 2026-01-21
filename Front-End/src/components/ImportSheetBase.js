import Layout from "./app/Layout";
import icons from "../components/Icons";
import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import * as XLSX from "xlsx";
import '../styles/global.css';
import '../styles/app.css';
import axios from "axios";

function ImportSheetBase({ type }) {
    const [previewData, setPreviewData] = useState([]);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    function normalizeHeader(text) {
        if (!text) return "";
        return text
            .toString()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9]/g, "_")
            .replace(/_+/g, "_")
            .toLowerCase()
            .trim();
    }

    const normalizedType = normalizeHeader(type);

    const expectedColumns = {
    clientes: [
        "nome","tipopessoa","cpf_cnpj","email","telefone","whatsapp",
        "cep","uf","cidade","rua","bairro","numero","complemento"
    ],

    produtos: [
        "nome",
        "fabricante",
        "categoria",
        "descricao",
        "sku",
        "unidade_de_medida",
        "preco_unitario",
        "ncm",
        "cfop",
        "icms",
        "cofins",
        "origem_do_produto"
    ],

    servicos: [
        "nome",
        "categoria",
        "descricao",
        "sku",
        "unidade_de_medida",
        "item_lista",
        "preco_unitario",
        "cnae",
        "codigo_de_servico",
        "iss",
        "cofins",
        "taxa_de_regime_especial",
        "municipio"
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
                setError(`❌ Modelo inválido. Esperado: ${expected.join(", ")}`);
                return;
            }

            // Mapeia e já filtra linhas onde o campo principal está vazio
            const normalized = jsonData.slice(1)
                .map(row => {
                    let obj = {};
                    expected.forEach((col, index) => {
                        obj[col] = row[index] !== undefined && row[index] !== null ? row[index] : "";
                    });
                    return obj;
                })
                .filter(item => {
                    const val = item.nome || item.name;
                    return val && val.toString().trim() !== "";
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
                    nome_social: item.nome || "",
                    tipo_pessoa: item.tipopessoa === "PF" ? "PFisica" : "PJuridica",
                    cpf_cnpj: item.cpf_cnpj || "",
                    email: item.email || "",
                    telefone: item.telefone || "",
                    whatsapp: item.whatsapp || "",
                    cep: item.cep || "",
                    uf: item.uf || "",
                    cidade: item.cidade || "",
                    logradouro: item.rua || "",
                    bairro: item.bairro || "",
                    numero: item.numero || "",
                    complemento: item.complemento || ""
                }));
            } 
            else if (normalizedType === "produtos") {
            dadosMapeados = previewData.map(item => ({
                nome: item.nome || "",
                fabricante: item.fabricante || "",
                categoria: item.categoria || "",
                descricao: item.descricao || "",
                sku: item.sku || "",
                unidade_medida: item.unidade_de_medida || "Unidade",
                preco_unitario: item.preco_unitario
                ? parseFloat(item.preco_unitario.toString().replace(",", "."))
                : 0,
                ncm: item.ncm || "",
                cfop: item.cfop || "",
                icms: item.icms || "",
                pis_cofins: item.cofins || "",
                origem: item.origem_do_produto
                ? item.origem_do_produto.toString().split(" ")[0]
                : "0"
            }));
            }

            else if (normalizedType === "servicos") {
            dadosMapeados = previewData.map(item => ({
                nome: item.nome || "",
                categoria: item.categoria || "",
                codigo_interno: item.sku || "",
                descricao_detalhada: item.descricao || "",
                preco: item.preco_unitario
                ? parseFloat(item.preco_unitario.toString().replace(",", "."))
                : 0,
                unidade_medida: item.unidade_de_medida || "Unidade",
                cnae: item.cnae || "",
                codigo_servico: item.codigo_de_servico || "",
                item_lista: item.item_lista || "",
                aliquota_iss: item.iss || "",
                cst_pis_cofins: item.cofins || "",
                regime_especial: item.taxa_de_regime_especial || "",
                municipio: item.municipio || ""
            }));
            }


            await axios.put(`https://project-finc.onrender.com/${normalizedType}`, dadosMapeados, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            alert("Importação concluída com sucesso!");
            navigate(normalizedType === 'clientes' ? '/clientes' : '/produtos');

        } catch (err) {
            console.error("Erro na importação:", err.response?.data || err.message);
            const msgErro = err.response?.data?.error || err.response?.data?.message || "Erro desconhecido.";
            alert(`Erro 400: ${msgErro}`);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <Layout>
            <main className="content import-sheet">
                <section className="form-section">
                    <div className="form-footer-voltar">
                        <Link to={normalizedType === 'clientes' ? "/clientes" : "/produtos"} className="previous-step">
                            Voltar <i className="bi bi-chevron-double-left"></i>
                        </Link>
                    </div>
                    <div className="section-header">
                        <span className="icon"><i className={icons.clientesAdd}></i></span>
                        <h3>Cadastrar novos {type}</h3>
                    </div>
                    <hr className="divider" />
                    <label>Baixe o modelo, preencha e carregue abaixo.</label>
                    <section className="botoes" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button className="btn btn-azul" onClick={downloadModel}>Baixar Modelo</button>
                        <button className="btn-upload-wrapper btn-verde">
                            <input type="file" accept=".xlsx" onChange={handleFileUpload} />
                        </button>
                    </section>
                    {error && <p style={{ color: "red", marginTop: "15px" }}>{error}</p>}
                </section>

                <section className="form-section">
                    <div className="section-header">
                        <span className="icon"><i className={icons.feedback}></i></span>
                        <h3>Pré-Visualização ({previewData.length} itens)</h3>
                    </div>
                    <hr className="divider" />
                    {previewData.length > 0 ? (
                        <div className="preview-wrapper" style={{ overflowX: 'auto' }}>
                            <table className="preview-table">
                                <thead>
                                    <tr>
                                        {Object.keys(previewData[0]).map((col, i) => <th key={i}>{col}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.map((row, i) => (
                                        <tr key={i}>
                                            {Object.values(row).map((val, j) => <td key={j}>{val}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <label>Nenhum dado válido encontrado na planilha.</label>}

                    <section className="botoes" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                        <button className="btn-vermelho" onClick={() => setPreviewData([])} disabled={isImporting}>Cancelar</button>
                        <button className="btn btn-verde" onClick={handleImport} disabled={previewData.length === 0 || isImporting}>
                            {isImporting ? "Processando..." : `Salvar ${previewData.length} ${type}`}
                        </button>
                    </section>
                </section>
            </main>
        </Layout>
    );
}

export default ImportSheetBase;