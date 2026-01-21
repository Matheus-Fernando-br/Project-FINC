import React, { useState } from "react";
import icons from "../../../components/Icons";
import { Link, useNavigate } from 'react-router-dom';
import axios from "axios";

function Tela_Cadastro_Servico() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        nome: "", tipo_nota: "nfs", categoria: "", codigo_interno: "",
        descricao_detalhada: "", preco: "", unidade_medida: "",
        cnae: "", codigo_servico: "", item_lista: "", aliquota_iss: "",
        cst_pis_cofins: "", regime_especial: ""
    });

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.post("https://project-finc.onrender.com/servicos", form, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Serviço cadastrado!");
            navigate("/servicos");
        } catch (err) { alert("Erro ao cadastrar serviço"); }
    };

    return (
        <main className="content">
            <section className='titulo-secao'><h1><i className={icons.produtosAdd}></i> Cadastro de Serviço</h1></section>
            <div className="form-footer voltar"><Link to="/servicos" className="previous-step">Voltar</Link></div>
            <section className="form-section">
                <div className="form-row">
                    <div className="form-group"><label>Nome do Serviço *</label><input type="text" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} /></div>
                </div>
                <div className="form-row">
                    <div className="form-group"><label>Categoria *</label><input type="text" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} /></div>
                    <div className="form-group"><label>Preço *</label><input type="number" value={form.preco} onChange={e => setForm({...form, preco: e.target.value})} /></div>
                </div>
                <div className="form-row">
                    <div className="form-group"><label>CNAE *</label><input type="text" value={form.cnae} onChange={e => setForm({...form, cnae: e.target.value})} /></div>
                    <div className="form-group"><label>Cód. Serviço *</label><input type="text" value={form.codigo_servico} onChange={e => setForm({...form, codigo_servico: e.target.value})} /></div>
                </div>
            </section>
            <div className="botao_geral"><button className="btn" onClick={handleSubmit}>Cadastrar</button></div>
        </main>
    );
}
export default Tela_Cadastro_Servico;