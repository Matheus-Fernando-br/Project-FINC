import icons from "../../components/Icons";
import { Link, useParams, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import './cliente.css'

function Editar_cliente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tipoPessoa, setTipoPessoa] = useState("");
  const [form, setForm] = useState({
    nome_social: "",
    tipo_pessoa: "",
    cpf_cnpj: "",
    cep: "",
    uf: "",
    cidade: "",
    logradouro: "",
    bairro: "",
    numero: "",
    complemento: "",
    email: "",
    telefone: "",
    whatsapp: ""
  });

  useEffect(() => {
    async function buscarCliente() {
      const token = localStorage.getItem("token");
      const response = await fetch(`https://project-finc.onrender.com/clientes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setForm(data);
        setTipoPessoa(data.tipo_pessoa);
      }
    }
    buscarCliente();
  }, [id]);

  async function handleSubmit() {
    const token = localStorage.getItem("token");
    const response = await fetch(`https://project-finc.onrender.com/clientes/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(form)
    });

    if (response.ok) {
      alert("Cliente atualizado com sucesso!");
      navigate("/clientes");
    } else {
      alert("Erro ao atualizar cliente");
    }
  }

  const maskTelefone = (value) => {
    return value.replace(/\D/g, "").replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 15);
  };

  return (
    <main className="content">
      <section className="titulo-secao">
        <h1><i className={icons.clientesAdd}></i> Editar Cliente</h1>
      </section>
      <div className="form-footer voltar">
        <Link to="/clientes" className="previous-step">
          Voltar <i className="bi bi-chevron-double-left"></i>
        </Link>
      </div>
      <section className="form-section">
        <div className="form-row">
          <div className="form-group">
            <label>Nome Social *</label>
            <input type="text" value={form.nome_social} onChange={(e) => setForm({ ...form, nome_social: e.target.value })} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Tipo de Pessoa *</label>
            <select value={tipoPessoa} onChange={(e) => { setTipoPessoa(e.target.value); setForm({ ...form, tipo_pessoa: e.target.value }); }}>
              <option value="PFisica">Pessoa Física</option>
              <option value="PJuridica">Pessoa Jurídica</option>
            </select>
          </div>
          <div className="form-group">
            <label>{tipoPessoa === "PFisica" ? "CPF" : "CNPJ"} *</label>
            <input type="text" value={form.cpf_cnpj} onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>E-mail *</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Telefone *</label>
            <input type="text" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: maskTelefone(e.target.value) })} />
          </div>
        </div>
      </section>
      <div className="botao_geral">
        <button className="btn" onClick={handleSubmit}>Salvar Alterações</button>
      </div>
    </main>
  );
}

export default Editar_cliente;