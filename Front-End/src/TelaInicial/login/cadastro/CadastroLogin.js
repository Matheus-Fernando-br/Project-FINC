import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/Cadastro.css";

function CadastroLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nome_social: "",
    tipoPessoa: "",
    cpf: "",
    email: "",
    telefone: "",
    senha: "",
    repitaSenha: "",
    termos: false,
  });

  const validarFormulario = () => {
    const { nome_social, tipoPessoa, cpf, email, telefone, senha, repitaSenha , termos } = formData;

    if (!nome_social || !tipoPessoa || !cpf || !email || !telefone || !senha || !repitaSenha) {
      alert("Preencha todos os campos!");
      return false;
    }

    if (!termos) {
      alert("Você precisa aceitar os Termos e Serviços.");
      return false;
    }
    
    if (senha !== repitaSenha) {
      alert("As senhas não coincidem! Verifique e tente novamente.");
      return false;
    }

    if (senha.length < 8) {
      alert("A senha deve ter pelo menos 8 caracteres.");
      return false;
    }

    const cpfLimpo = cpf.replace(/\D/g, "");
    if (tipoPessoa === "FISICA" && cpfLimpo.length !== 11) {
      alert("CPF inválido. Verifique e tente novamente.");
      return false;
    }
    if (tipoPessoa === "JURIDICA" && cpfLimpo.length !== 14) {
      alert("CNPJ inválido. Verifique e tente novamente.");
      return false;
    }
    
    return true;
  };

  const labelTipo =
  formData.tipoPessoa === "FISICA"
    ? "CPF"
    : formData.tipoPessoa === "JURIDICA"
    ? "CNPJ"
    : "CPF/CNPJ";
    
    const formatarDocumento = (valor, tipoPessoa) => {
      valor = valor.replace(/\D/g, "");
      
      if (tipoPessoa === "FISICA") {
      return valor
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
        .slice(0, 14);
    }
    
    if (tipoPessoa === "JURIDICA") {
      return valor
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
        .slice(0, 18);
      }

    return valor;
  };

  const formatarTelefone = (valor) => {
    valor = valor.replace(/\D/g, "");

    return valor
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 15);
    };

    const handleChange = (e) => {
      const { id, value, type, checked } = e.target;
  
      let novoValor = type === "checkbox" ? checked : value;
  
      if (id === "cpf") {
        if (!formData.tipoPessoa) {
          alert("Selecione o Tipo de Pessoa antes de digitar o CPF/CNPJ.");
          return;
        }
        novoValor = formatarDocumento(novoValor, formData.tipoPessoa);
      }
  
      if (id === "telefone") {
        novoValor = formatarTelefone(novoValor);
      }
  
      setFormData((prev) => ({
        ...prev,
        [id]: novoValor,
      }));
    };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      const response = await fetch("https://project-finc.onrender.com/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          senha: formData.senha,
          nome_social: formData.nome_social,
          tipoPessoa: formData.tipoPessoa,
          cpfCnpj: formData.cpf.replace(/\D/g, ""),
          telefone: formData.telefone
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Conta criada com sucesso!");
        navigate("/TelaInicial/Login");
      } else {
        alert(data.error || "Erro ao criar conta no servidor.");
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
      alert("Falha de conexão com o servidor.");
    }
  };

  return (
    <section className="CadastroLogin">
      <div className="Fundo">
        <img src="/Images/Fundo-Login-teste.png" alt="Fundo" />
      </div>

      <div className="rodape form-footer voltar">
        <Link
          to="/TelaInicial/Login"
          state={{ direction: "left" }}
        >
          Voltar para Tela de Login
        </Link>
      </div>

      <div className="wrapper">
        <form id="loginForm" onSubmit={handleSubmit}>
          <h1>CRIE SUA CONTA</h1>

          <section className="formulario">
            <div className="input-box full">
              <div className="label">Nome Social:</div>
              <input
                type="text"
                id="nome_social"
                value={formData.nome_social}
                onChange={handleChange}
                placeholder="Nome Social"
              />
              <i className="bi bi-person-badge"></i>
            </div>

            <div className="input-box">
              <div className="label">Tipo de Pessoa</div>
              <select
                id="tipoPessoa"
                value={formData.tipoPessoa}
                onChange={handleChange}
              >
                <option value="">Selecione...</option>
                <option value="FISICA">Pessoa Física</option>
                <option value="JURIDICA">Pessoa Jurídica</option>
              </select>
            </div>

            <div className="input-box">
              <div className="label">{labelTipo}:</div>
              <input
                type="text"
                id="cpf"
                value={formData.cpf}
                onChange={handleChange}
                placeholder="Digite apenas números"
              />
              <i className="bi bi-person"></i>
            </div>

            <div className="input-box">
              <div className="label">E-mail:</div>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="E-mail"
              />
              <i className="bi bi-envelope"></i>
            </div>

            <div className="input-box">
              <div className="label">Telefone:</div>
              <input
                type="text"
                id="telefone"
                value={formData.telefone}
                onChange={handleChange}
                placeholder="Número de telefone"
              />
              <i className="bi bi-telephone"></i>
            </div>

            <div className="input-box full">
              <div className="label">Senha:</div>
              <input
                type={"password"}
                id="senha"
                value={formData.senha}
                onChange={handleChange}
                placeholder="Digite sua senha"
              />
              <i className="bi bi-lock-fill"></i>
            </div>

          <div className="input-box full">
            <div className="label">Repita sua senha:</div>
            <input
              type={"password"}
              id="repitaSenha"
              value={formData.repitaSenha}
              onChange={handleChange}
              placeholder="Repita a senha digitada anteriormente"
            />
            <i className="bi bi-lock-fill"></i>
          </div>
          </section>

          <div className="acept">
            <label>
              <input
                type="checkbox"
                id="termos"
                checked={formData.termos}
                onChange={handleChange}
              />
              <Link
                to="/TelaInicial/Termos"
                state={{ direction: "right" }}
              >
                Aceito os Termos e Serviços
              </Link>
            </label>
          </div>

          <hr className="divider" />
          <button type="submit" className="btn">Criar Conta</button>
        </form>
      </div>
    </section>
  );
}

export default CadastroLogin;