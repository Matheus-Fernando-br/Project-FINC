import icons from "../../components/Icons";
import { useState, useEffect } from "react";
import "./MeusDados.css";
import { apiFetch } from "../../utils/api.js";

function MeusDados() {
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);
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

  const [formOriginal, setFormOriginal] = useState({});
  const [tipoPessoa, setTipoPessoa] = useState("");

  // ✅ carrega do backend (fonte da verdade)
  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        setFeedback("");

        // ✅ GET /api/profile/me (precisa existir no backend)
        const profile = await apiFetch("/api/profile/me", { method: "GET" });

        // email geralmente vem do auth; pega do localStorage se você salva lá
        const userLocal = JSON.parse(localStorage.getItem("user") || "{}");

        const dadosMapeados = {
          ...profile,
          email: userLocal.email || profile.email || "",
          cep: profile.cep || "",
          uf: profile.uf || "",
          cidade: profile.cidade || "",
          logradouro: profile.logradouro || "",
          bairro: profile.bairro || "",
          numero: profile.numero || "",
          complemento: profile.complemento || "",
          inscricao: profile.inscricao || "",
        };

        setUserData(dadosMapeados);
        setFormOriginal(dadosMapeados);
        setTipoPessoa(dadosMapeados.tipo_pessoa || "");
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        setFeedback(error.message || "Erro ao carregar dados do usuário.");
      }
    };

    fetchUsuario();
  }, []);

  const cancelarAlteracoes = () => {
    if (!window.confirm("Deseja cancelar todas as alterações?")) return;
    setLoadingCancel(true);
    setFeedback("Operação cancelada!");
    setTimeout(() => {
      setUserData(formOriginal);
      setTipoPessoa(formOriginal.tipo_pessoa || "");
      setEditando(false);
      setLoadingCancel(false);
    }, 800);
  };

  const salvarAlteracoes = async () => {
    setFeedback("");
    setLoading(true);
    setFeedback("Salvando dados do perfil...");

    try {
      // ✅ PUT /api/profile
      await apiFetch("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          social_name: userData.social_name,
          telefone: userData.telefone,
          tipo_pessoa: userData.tipo_pessoa,
          cpf_cnpj: userData.cpf_cnpj,
          inscricao: userData.inscricao,
          cep: userData.cep,
          uf: userData.uf,
          cidade: userData.cidade,
          logradouro: userData.logradouro,
          bairro: userData.bairro,
          numero: userData.numero,
          complemento: userData.complemento,
        }),
      });

      // ✅ refaz GET do perfil pra confirmar que gravou no banco
      const refreshed = await apiFetch("/api/profile/me", { method: "GET" });

      const userLocal = JSON.parse(localStorage.getItem("user") || "{}");
      const novoUser = { ...userLocal, ...refreshed };

      localStorage.setItem("user", JSON.stringify(novoUser));

      setFormOriginal({
        ...novoUser,
        email: novoUser.email || userLocal.email || "",
      });
      setUserData({
        ...novoUser,
        email: novoUser.email || userLocal.email || "",
      });

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

  const maskCpfCnpj = (value, tipoPessoaAtual) => {
    let v = (value || "").replace(/\D/g, "");

    if (tipoPessoaAtual === "PFisica") {
      return v
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }

    if (tipoPessoaAtual === "PJuridica") {
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
    const cepLimpo = (cep || "").replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setUserData((prev) => ({
          ...prev,
          cep,
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

      {/* ================= DADOS PESSOAIS ================= */}
      <section className="form-section">
        <div className="section-header">
          <span className="icon">
            <i className={icons.clientePerson}></i>
          </span>
          <h3>Dados pessoais</h3>
        </div>
        <hr className="divider" />

        <div className="form-row">
          <div className="form-group">
            <label>Nome</label>
            <input
              value={userData.social_name || ""}
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
                value={tipoPessoa}
                disabled={loading}
                onChange={(e) => {
                  const v = e.target.value;
                  setTipoPessoa(v);
                  setUserData({ ...userData, tipo_pessoa: v, cpf_cnpj: "" });
                }}
              >
                <option value="">Selecione</option>
                <option value="PFisica">Pessoa Física</option>
                <option value="PJuridica">Pessoa Jurídica</option>
              </select>
            ) : (
              <input value={userData.tipo_pessoa || ""} disabled />
            )}
          </div>

          <div className="form-group">
            <label>{tipoPessoa === "PFisica" ? "CPF" : "CNPJ"}</label>
            <input
              value={userData.cpf_cnpj || ""}
              disabled={disabled}
              maxLength={tipoPessoa === "PFisica" ? 14 : 18}
              onChange={(e) =>
                setUserData({
                  ...userData,
                  cpf_cnpj: maskCpfCnpj(e.target.value, tipoPessoa),
                })
              }
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Inscrição Estadual</label>
            <input
              value={userData.inscricao || ""}
              disabled={disabled}
              onChange={(e) =>
                setUserData({ ...userData, inscricao: e.target.value })
              }
            />
          </div>
        </div>
      </section>

      {/* ================= CONTATO ================= */}
      <section className="form-section">
        <div className="section-header">
          <span className="icon">
            <i className={icons.celular}></i>
          </span>
          <h3>Contato</h3>
        </div>
        <hr className="divider" />

        <div className="form-row">
          <div className="form-group">
            <label>E-mail</label>
            <input value={userData.email || ""} disabled />
          </div>

          <div className="form-group">
            <label>Telefone</label>
            <input
              value={userData.telefone || ""}
              disabled={disabled}
              onChange={(e) =>
                setUserData({ ...userData, telefone: e.target.value })
              }
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
          <h3>Endereço Fiscal</h3>
        </div>
        <hr className="divider" />

        <div className="form-row">
          <div className="form-group">
            <label>CEP</label>
            <input
              value={userData.cep || ""}
              disabled={disabled}
              onChange={(e) => {
                let valor = e.target.value
                  .replace(/\D/g, "")
                  .replace(/^(\d{5})(\d)/, "$1-$2")
                  .slice(0, 9);

                setUserData({ ...userData, cep: valor });
                if (valor.length === 9) buscarCEP(valor);
              }}
            />
          </div>

          <div className="form-group">
            <label>UF</label>
            <input
              value={userData.uf || ""}
              disabled={disabled}
              onChange={(e) => setUserData({ ...userData, uf: e.target.value })}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Cidade</label>
            <input
              value={userData.cidade || ""}
              disabled={disabled}
              onChange={(e) =>
                setUserData({ ...userData, cidade: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Logradouro</label>
            <input
              value={userData.logradouro || ""}
              disabled={disabled}
              onChange={(e) =>
                setUserData({ ...userData, logradouro: e.target.value })
              }
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Bairro</label>
            <input
              value={userData.bairro || ""}
              disabled={disabled}
              onChange={(e) =>
                setUserData({ ...userData, bairro: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Número</label>
            <input
              value={userData.numero || ""}
              disabled={disabled}
              onChange={(e) =>
                setUserData({ ...userData, numero: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Complemento</label>
            <input
              value={userData.complemento || ""}
              disabled={disabled}
              onChange={(e) =>
                setUserData({ ...userData, complemento: e.target.value })
              }
            />
          </div>
        </div>

        {feedback && <p className="feedback">{feedback}</p>}

        <div className="botao_geral">
          {!editando ? (
            <button
              type="button"
              onClick={() => {
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
                onClick={cancelarAlteracoes}
                disabled={loading}
              >
                {loadingCancel && <span className="spinner"></span>}
                {loadingCancel ? "" : "Cancelar Alterações"}
              </button>

              <button
                type="button"
                onClick={salvarAlteracoes}
                disabled={loading}
              >
                {loading && <span className="spinner"></span>}
                {loading ? "" : "Salvar Alterações"}
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default MeusDados;
