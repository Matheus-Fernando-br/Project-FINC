import React, { useState } from "react";
import icons from "../../../components/Icons";
import { Link, useNavigate } from 'react-router-dom';
import axios from "axios";

function Tela_Cadastro_Produto() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        nome: "", fabricante: "", categoria: "", tipo_nota: "",
        descricao: "", sku: "", unidade_medida: "", preco_unitario: "",
        ncm: "", cfop: "", icms: "", ipi: "", pis_cofins: "", aliquotas: "", origem: ""
    });

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.post("https://project-finc.onrender.com/produtos", form, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Produto cadastrado!");
            navigate("/produtos");
        } catch (err) { alert("Erro ao cadastrar produto"); }
    };

    return (
        <main className="content">
            <section className='titulo-secao'><h1><i className={icons.produtosAdd}></i> Cadastro de Produto</h1></section>
            <div className="form-footer voltar"><Link to="/produtos" className="previous-step">Voltar</Link></div>
            <section className="form-section">
                <div className="form-row">
                    <div className="form-group"><label>Nome *</label><input type="text" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} /></div>
                    <div className="form-group"><label>Fabricante</label><input type="text" value={form.fabricante} onChange={e => setForm({...form, fabricante: e.target.value})} /></div>
                </div>
                <div className='form-row'>
                    <div className="form-group"><label>Categoria *</label><input type="text" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} /></div>
                    <div className="form-group"><label>Tipo Nota *</label>
                        <select value={form.tipo_nota} onChange={e => setForm({...form, tipo_nota: e.target.value})}>
                            <option value="">Selecione</option>
                            <option value="nfe">NF-e</option>
                            <option value="nfce">NFC-e</option>
                        </select>
                    </div>
                </div>
                <div className="form-row">
                   <div className="form-group"><label>SKU *</label><input type="text" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} /></div>
                   <div className="form-group"><label>Unidade *</label><input type="text" value={form.unidade_medida} onChange={e => setForm({...form, unidade_medida: e.target.value})} /></div>
                   <div className="form-group"><label>Preço *</label><input type="number" value={form.preco_unitario} onChange={e => setForm({...form, preco_unitario: e.target.value})} /></div>
                </div>
                <div className="form-row">
                   <div className="form-group"><label>NCM *</label><input type="text" value={form.ncm} onChange={e => setForm({...form, ncm: e.target.value})} /></div>
                   <div className="form-group"><label>CFOP *</label><input type="text" value={form.cfop} onChange={e => setForm({...form, cfop: e.target.value})} /></div>
                </div>
            </section>
            <div className="botao_geral"><button className="btn" onClick={handleSubmit}>Cadastrar</button></div>
        </main>
    );
}
export default Tela_Cadastro_Produto;