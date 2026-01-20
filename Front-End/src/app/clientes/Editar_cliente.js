import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import icons from "../../components/Icons";
import "./cliente.css";
import axios from "axios";

function Editar_cliente() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tipoPessoa, setTipoPessoa] = useState("");
  const [form, setForm] = useState({});
  const [formOriginal, setFormOriginal] = useState({});
  
  useEffect(() => {
    const fetchCliente = async () => {
      try {
        const response = await axios.get(`/api/clientes/${id}`);
        setForm(response.data);
        setFormOriginal(response.data);
      } catch (error) {
        console.error("Erro ao carregar cliente:", error);
        alert("Erro ao carregar cliente. Tente novamente mais tarde."); // Mensagem de erro
      }
    };

    fetchCliente();
  }, [id]);

  const maskTelefone = (value) =>
    value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 15);

  const cancelarAlteracoes = () => {
    if (!window.confirm("Deseja cancelar todas as alterações?")) return;
    setForm(formOriginal);
    setTipoPessoa(formOriginal.tipo_pessoa);
  };

  async function handleSubmit() {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `https://project-finc.onrender.com/clientes/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(form)
        }
      );

      if (!response.ok) throw new Error();

      alert("Cliente atualizado com sucesso!");
      navigate("/clientes");
    } catch {
      alert("Erro ao salvar alterações");
    }
  }

  return (
    <main className="content">
      <section className="titulo-secao">
        <h1>
          <i className={icons.clientesAdd}></i> Editar Cliente
        </h1>
      </section>

      <div className="form-footer voltar">
        <Link to="/clientes" className="previous-step">
          Voltar <i className="bi bi-chevron-double-left"></i>
        </Link>
      </div>

      {/* ================= DADOS PESSOAIS ================= */}
      <section className="form-section">
        <div className="section-header">
          <span className="icon">
            <i className={icons.relatorioAdd}></i>
          </span>
          <h3>Dados Pessoais</h3>
        </div>
        <hr className="divider" />

        <div className="form-row">
          <div className="form-group">
            <label>Nome Social *</label>
            <input
              type="text"
              value={form.nome_social || ""}
              onChange={(e) => setForm({ ...form, nome_social: e.target.value })}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Tipo de Pessoa *</label>
            <select
              value={tipoPessoa}
              onChange={(e) => {
                setTipoPessoa(e.target.value);
                setForm({
                  ...form,
                  tipo_pessoa: e.target.value,
                  cpf_cnpj: ""
                });
              }}
            >
              <option value="">Selecione</option>
              <option value="PFisica">Pessoa Física</option>
              <option value="PJuridica">Pessoa Jurídica</option>
            </select>
          </div>

          <div className="form-group">
            <label>{tipoPessoa === "PFisica" ? "CPF" : "CNPJ"} *</label>
            <input
              type="text"
              value={form.cpf_cnpj || ""}
              onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* ================= ENDEREÇO ================= */}
      <section className="form-section">
        <div className="section-header">
          <span className="icon">
            <i className={icons.mapa}></i>
          </span>
          <h3>Endereço</h3>
        </div>
        <hr className="divider" />

        <div className="form-row">
          <div className="form-group">
            <label>CEP *</label>
            <input
              type="text"
              value={form.cep || ""}
              onChange={(e) => setForm({ ...form, cep: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>UF *</label>
            <input
              type="text"
              value={form.uf || ""}
              onChange={(e) => setForm({ ...form, uf: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Cidade *</label>
            <input
              type="text"
              value={form.cidade || ""}
              onChange={(e) => setForm({ ...form, cidade: e.target.value })}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Logradouro *</label>
            <input
              type="text"
              value={form.logradouro || ""}
              onChange={(e) => setForm({ ...form, logradouro: e.target.value })}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Bairro *</label>
            <input
              type="text"
              value={form.bairro || ""}
              onChange={(e) => setForm({ ...form, bairro: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Número *</label>
            <input
              type="text"
              value={form.numero || ""}
              onChange={(e) => setForm({ ...form, numero: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Complemento</label>
            <input
              type="text"
              value={form.complemento || ""}
              onChange={(e) => setForm({ ...form, complemento: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* ================= CONTATO ================= */}
      <section className="form-section">
        <div className="section-header">
          <span className="icon">
            <i className={icons.feedbackTel}></i>
          </span>
          <h3>Contato</h3>
        </div>
        <hr className="divider" />

        <div className="form-row">
          <div className="form-group">
            <label>E-mail *</label>
            <input
              type="email"
              value={form.email || ""}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value.toLowerCase() })
              }
            />
          </div>

          <div className="form-group">
            <label>Telefone *</label>
            <input
              type="text"
              value={form.telefone || ""}
              onChange={(e) =>
                setForm({ ...form, telefone: maskTelefone(e.target.value) })
              }
            />
          </div>

          <div className="form-group">
            <label>WhatsApp</label>
            <input
              type="text"
              value={form.whatsapp || ""}
              onChange={(e) =>
                setForm({ ...form, whatsapp: maskTelefone(e.target.value) })
              }
            />
          </div>
        </div>
      </section>

      {/* ================= BOTÕES ================= */}
      <div className="botao_geral">
        <button className="btn btn-cancelar" onClick={cancelarAlteracoes}>
          Cancelar Alterações
        </button>

        <button className="btn" onClick={handleSubmit}>
          Salvar Alterações
        </button>
      </div>
    </main>
  );
}

export default Editar_cliente;
