import icons from "../../components/Icons";
import { useState, useEffect } from "react";
import "./MeusDados.css";
import { apiFetch } from "../../utils/api.js";

function MeusDados() {
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const [userData, setUserData] = useState({
    social_name: "",
    email: "",
    cpf_cnpj: "",
    inscricao: "",
    telefone: "",
    tipo_pessoa: "",
    cep: "",
    uf: "",
    cidade: "",
    logradouro: "",
    bairro: "",
    numero: "",
    complemento: "",
  });

  const [backupData, setBackupData] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setUserData({
      social_name: user.social_name || "",
      email: user.email || "",
      cpf_cnpj: user.cpf_cnpj || "",
      inscricao: user.inscricao || "",
      telefone: user.telefone || "",
      tipo_pessoa: user.tipo_pessoa || "",
      cep: user.cep || "",
      uf: user.uf || "",
      cidade: user.cidade || "",
      logradouro: user.logradouro || "",
      numero: user.numero || "",
      complemento: user.complemento || "",
    });
  }, []);

  const salvarAlteracoes = async () => {
    setFeedback("");
    setLoading(true);

    try {
      setFeedback("Salvando dados do perfil...");

      await apiFetch("/api/profile", {
        method: "PUT",
        body: JSON.stringify(userData),
      });

      const userLocal = JSON.parse(localStorage.getItem("user") || "{}");
      const novoUser = { ...userLocal, ...userData };
      localStorage.setItem("user", JSON.stringify(novoUser));

      setFeedback("Perfil atualizado com sucesso ✅");
      setEditando(false);
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
      setFeedback(err.message || "Erro ao salvar perfil");
    } finally {
      setLoading(false);
    }
  };

  const disabled = !editando || loading;

  const maskCpfCnpj = (value, tipoPessoa) => {
    let v = value.replace(/\D/g, "");

    if (tipoPessoa === "PFisica") {
      return v
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }

    if (tipoPessoa === "PJuridica") {
      return v
        .slice(0, 14)
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return value;
  };

  const buscarCEP = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, "");

    if (cepLimpo.length !== 8) return;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();

      if (!data.erro) {
        setUserData((prev) => ({
          ...prev,
          cep: cep,
          uf: data.uf || "",
          cidade: data.localidade || "",
          logradouro: data.logradouro || "",
          bairro: data.bairro || "",
        }));
      }
    } catch (err) {
      console.error("Erro ao buscar CEP", err);
    }
  };

  return (
    <main className="content MeusDados">
      <section className="titulo-secao">
        <h1>
          <i className={icons.clientePerson}></i> Meu Perfil
        </h1>
      </section>

      <div className="perfil">
        <i className="bi bi-person-circle"></i>
        <h2>{userData.social_name}</h2>
      </div>

      <section className="form-section">
        <div className="section-header">
          <span className="icon">
            <i className={icons.clientePerson}></i>
          </span>
          <h3>Dados pessoais</h3>
        </div>
        <hr />
        <div className="form-row">
          <div className="form-group">
            <label>Nome</label>
            <input
              value={userData.social_name}
              disabled={disabled}
              onChange={(e) =>
                setUserData({ ...userData, social_name: e.target.value })
              }
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Tipo de Pessoa</label>
            {editando ? (
              <select
                value={userData.tipo_pessoa}
                disabled={loading}
                onChange={(e) =>
                  setUserData({
                    ...userData,
                    tipo_pessoa: e.target.value,
                    cpf_cnpj: "",
                  })
                }
              >
                <option value="">Selecione</option>
                <option value="PFisica">Pessoa Física</option>
                <option value="PJuridica">Pessoa Jurídica</option>
              </select>
            ) : (
              <input value={userData.tipo_pessoa} disabled />
            )}
          </div>

          <div className="form-group">
            <label>CPF / CNPJ</label>
            <input
              value={userData.cpf_cnpj}
              disabled={disabled}
              maxLength={userData.tipo_pessoa === "PFisica" ? 14 : 18}
              onChange={(e) =>
                setUserData({
                  ...userData,
                  cpf_cnpj: maskCpfCnpj(e.target.value, userData.tipo_pessoa),
                })
              }
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Inscrição Estadual</label>
            <input
              value={userData.inscricao}
              disabled={disabled}
              onChange={(e) =>
                setUserData({ ...userData, inscricao: e.target.value })
              }
            />
          </div>
        </div>
      </section>

      <section className="form-section">
        <div className="section-header">
          <span className="icon">
            <i className={icons.celular}></i>
          </span>
          <h3>Contato</h3>
        </div>
        <hr />
        <div className="form-row">
          <div className="form-group">
            <label>E-mail</label>
            <input value={userData.email} disabled={disabled} />
          </div>

          <div className="form-group">
            <label>Telefone</label>
            <input
              value={userData.telefone}
              disabled={disabled}
              onChange={(e) =>
                setUserData({ ...userData, telefone: e.target.value })
              }
            />
          </div>
        </div>
      </section>

      <section className="form-section">
        <div className="section-header">
          <span className="icon">
            <i className={icons.mapa}></i>
          </span>
          <h3>Endereço Fiscal</h3>
        </div>
        <hr />
        <div className="form-row">
          <div className="form-group">
            <label>CEP</label>
            <input
              type="text"
              value={userData.cep || ""}
              disabled={disabled}
              onChange={(e) => {
                let valor = e.target.value
                  .replace(/\D/g, "")
                  .replace(/^(\d{5})(\d)/, "$1-$2")
                  .slice(0, 9);

                setUserData({ ...userData, cep: valor });

                if (valor.length === 9) {
                  buscarCEP(valor);
                }
              }}
            />
          </div>

          <div className="form-group">
            <label>UF</label>
            <input
              value={userData.uf}
              disabled={disabled}
              onChange={(e) => setUserData({ ...userData, uf: e.target.value })}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Cidade</label>
            <input
              value={userData.cidade}
              disabled={disabled}
              onChange={(e) =>
                setUserData({ ...userData, cidade: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Logradouro</label>
            <input
              value={userData.logradouro}
              disabled={disabled}
              onChange={(e) =>
                setUserData({ ...userData, logradouro: e.target.value })
              }
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Número</label>
            <input
              value={userData.numero}
              disabled={disabled}
              onChange={(e) =>
                setUserData({ ...userData, numero: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Complemento</label>
            <input
              value={userData.complemento}
              disabled={disabled}
              onChange={(e) =>
                setUserData({ ...userData, complemento: e.target.value })
              }
            />
          </div>
        </div>

        <div className="botao_geral">
          {!editando ? (
            <button
              type="button"
              onClick={() => {
                setBackupData(userData);
                setEditando(true);
                setFeedback("");
              }}
            >
              Editar
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={salvarAlteracoes}
                disabled={loading}
              >
                {loading && <span className="spinner"></span>}
                {loading ? "" : "Salvar Alterações"}
              </button>

              <button
                type="button"
                className="btn-vermelho"
                disabled={loading}
                onClick={() => {
                  if (backupData) setUserData(backupData);
                  setEditando(false);
                  setFeedback("");
                }}
              >
                Cancelar
              </button>
            </>
          )}
        </div>

        {feedback && <p className="feedback">{feedback}</p>}
      </section>
    </main>
  );
}

export default MeusDados;
