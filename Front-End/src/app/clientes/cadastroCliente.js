import icons from "../../components/Icons";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import './cliente.css'
import { apiFetch } from "../../utils/api.js"

function Cadastro_cliente() {
  const navigate = useNavigate();
  const [tipoPessoa, setTipoPessoa] = useState("");

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

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


  async function handleSubmit() {
    setFeedback("");

    if (!form.nome_social || !form.tipo_pessoa || !form.cpf_cnpj || !form.cep || !form.numero || !form.email || !form.telefone) {
      setFeedback("Preencha os campos obrigatórios");
      return;
    }

    setLoading(true);
    setFeedback("Cadastrando cliente...");

    try {
      const response = await apiFetch("/clientes", {
        method: "POST",
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setFeedback(data.error || "Erro ao cadastrar cliente");
        return;
      }

      setFeedback("Cliente cadastrado com sucesso!");
      setTimeout(() => {
        navigate("/clientes");
      }, 2000);
    } catch (error) {
      console.error("Erro ao cadastrar cliente:", error);
      setFeedback("Erro de conexão ao cadastrar cliente");
    }
  }

  const maskTelefone = (value) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 15);
  };

  const buscarCEP = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, "");

    if (cepLimpo.length !== 8) return;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();

      if (!data.erro) {
        setForm((prev) => ({
          ...prev,
          cep: cep,
          uf: data.uf || "",
          cidade: data.localidade || "",
          logradouro: data.logradouro || "",
          bairro: data.bairro || ""
        }));
      }
    } catch {
      console.error("Erro ao buscar CEP");
    }
  };

  return (
    <main className="content">
      <section className="titulo-secao">
        <h1>
          <i className={icons.clientesAdd}></i> Cadastro de um novo cliente
        </h1>
      </section>
      <div className="form-footer voltar">
        <Link to="/clientes" className="previous-step">
          Voltar <i className="bi bi-chevron-double-left"></i>
          <i className="bi bi-chevron-double-left"></i>
        </Link>
      </div>
      <section className="form-section">
        <p className="frase-campo-asterisco">
          Os campos que contêm um asterisco (
          <span className="campo-obrigatório">*</span>) são de preenchimento
          obrigatório.
        </p>
        <div className="section-header">
          <span className="icon">
            <i className={icons.relatorioAdd}></i>
          </span>
          <h3>Dados Pessoais</h3>
        </div>
        <hr className="divider" />
        <div className="form-row">
          <div className="form-group">
            <label>
              Nome Social <span className="campo-obrigatório">*</span>
            </label>
            <input
              type="text"
              placeholder="Digite o nome completo do cliente"
              value={form.nome_social}
              onChange={(e) => setForm({ ...form, nome_social: e.target.value })}
              disabled={loading}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="label-radio">
              Selecione o tipo de Pessoa:{" "}
              <span className="campo-obrigatório">*</span>
            </label>
              <select
                value={tipoPessoa}
                onChange={(e) => {
                  setTipoPessoa(e.target.value);
                  setForm({ ...form, tipo_pessoa: e.target.value, cpf_cnpj: "" });
                }}
                disabled={loading}
              >
                <option value="" disabled>Selecione o Tipo</option>
                <option value="PFisica">Pessoa Física</option>
                <option value="PJuridica">Pessoa Jurídica</option>
              </select>
          </div>

          {tipoPessoa === "PFisica" && (
            <div className="form-group fade-in">
              <label>
                CPF: <span className="campo-obrigatório">*</span>
              </label>
              <input
                type="text"
                placeholder="Informe o CPF do cliente"
                maxLength={14}
                value={form.cpf_cnpj}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, "");
                  value = value
                    .slice(0, 11)
                    .replace(/(\d{3})(\d)/, "$1.$2")
                    .replace(/(\d{3})(\d)/, "$1.$2")
                    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                  setForm({ ...form, cpf_cnpj: value });
                }}
                disabled={loading}
              />
            </div>
          )}

          {tipoPessoa === "PJuridica" && (
            <div className="form-group fade-in">
              <label>
                CNPJ: <span className="campo-obrigatório">*</span>
              </label>
              <input
                type="text"
                placeholder="Informe o CNPJ do cliente"
                maxLength={18}
                value={form.cpf_cnpj}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, "");
                  value = value
                    .slice(0, 14)
                    .replace(/^(\d{2})(\d)/, "$1.$2")
                    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
                    .replace(/\.(\d{3})(\d)/, ".$1/$2")
                    .replace(/(\d{4})(\d)/, "$1-$2");
                  setForm({ ...form, cpf_cnpj: value });
                }}
                disabled={loading}
              />
            </div>
          )}
        </div>
      </section>

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
            <label>
              CEP: <span className="campo-obrigatório">*</span>
            </label>
            <input
              type="text"
              placeholder="00000-000"
              value={form.cep || ""}
              onChange={(e) => {
                const valor = e.target.value
                  .replace(/\D/g, "")
                  .replace(/^(\d{5})(\d)/, "$1-$2")
                  .slice(0, 9);
                setForm({ ...form, cep: valor });
                if (valor.length === 9) buscarCEP(valor);
              }}
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>
              UF: <span className="campo-obrigatório">*</span>
            </label>
            <select
              value={form.uf || ""}
              onChange={(e) => setForm({ ...form, uf: e.target.value })}
              disabled={loading}
            >
              <option value="">Selecione</option>
              {[
                "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
                "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
                "RS","RO","RR","SC","SP","SE","TO"
              ].map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>
              Cidade: <span className="campo-obrigatório">*</span>
            </label>
            <input
              type="text"
              placeholder="Cidade"
              value={form.cidade}
              onChange={(e) => setForm({ ...form, cidade: e.target.value })}
              disabled={loading}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>
              Logradouro: <span className="campo-obrigatório">*</span>
            </label>
            <input
              type="text"
              placeholder="Digite o nome da rua"
              value={form.logradouro}
              onChange={(e) => setForm({ ...form, logradouro: e.target.value })}
              disabled={loading}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>
              Bairro: <span className="campo-obrigatório">*</span>
            </label>
            <input
              type="text"
              placeholder="Digite o nome do bairro"
              value={form.bairro}
              onChange={(e) => setForm({ ...form, bairro: e.target.value })}
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>
              Número: <span className="campo-obrigatório">*</span>
            </label>
            <input
              type="text"
              placeholder="Informe o número"
              value={form.numero}
              onChange={(e) => setForm({ ...form, numero: e.target.value })}
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Complemento:</label>
            <input
              type="text"
              placeholder="Informe o complemento"
              value={form.complemento}
              onChange={(e) => setForm({ ...form, complemento: e.target.value })}
              disabled={loading}
            />
          </div>
        </div>
      </section>

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
            <label>
              E-mail: <span className="campo-obrigatório">*</span>
            </label>
            <input
              type="email"
              placeholder="Informe o e-mail do cliente"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value.toLowerCase() })}
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>
              Telefone: <span className="campo-obrigatório">*</span>
            </label>
            <input
              type="text"
              placeholder="Informe o número de Telefone"
              value={form.telefone || ""}
              onChange={(e) => setForm({ ...form, telefone: maskTelefone(e.target.value) })}
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>WhatsApp:</label>
            <input
              type="text"
              placeholder="Informe o número de WhatsApp"
              value={form.whatsapp || ""}
              onChange={(e) => setForm({ ...form, whatsapp: maskTelefone(e.target.value) })}
              disabled={loading}
            />
          </div>
        </div>
      </section>
      {feedback && <p className="feedback">{feedback}</p>}
      <div className="botao_geral">
        <button className="btn" onClick={handleSubmit} disabled={loading}>
          {loading && <span className="spinner"></span>}
          {loading ? "" : "Cadastrar"}
        </button>
      </div>
    </main>
  );
}

export default Cadastro_cliente;