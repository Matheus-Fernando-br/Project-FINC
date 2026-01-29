import icons from "../../components/Icons";
import { useState, useEffect } from "react";
import "./MeusDados.css";

function MeusDados() {
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const [userData, setUserData] = useState({
    social_name: "",
    email: "",
    cpf_cnpj: "",
    telefone: "",
    tipo_pessoa: "",
    cep: "",
    uf: "",
    cidade: "",
    logradouro: "",
    numero: "",
    complemento: ""
  });

  const [backupData, setBackupData] = useState(null);

  const [senhaAtual, setSenhaAtual] = useState("");
  const [senha, setSenha] = useState("");
  const [repetirSenha, setRepetirSenha] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setUserData({
      social_name: user.social_name || "",
      email: user.email || "",
      cpf_cnpj: user.cpf_cnpj || "",
      telefone: user.telefone || "",
      tipo_pessoa: user.tipo_pessoa || "",
      cep: user.cep || "",
      uf: user.uf || "",
      cidade: user.cidade || "",
      logradouro: user.logradouro || "",
      numero: user.numero || "",
      complemento: user.complemento || ""
    });
  }, []);

  const salvarAlteracoes = async () => {
    setFeedback("");
    setLoading(true);

    try {
      // 🔐 troca de senha
      if (senha || repetirSenha || senhaAtual) {
        if (!senhaAtual) {
          setFeedback("Informe a senha atual");
          setLoading(false);
          return;
        }

        if (senha !== repetirSenha) {
          setFeedback("As senhas não coincidem!");
          setLoading(false);
          return;
        }

        setFeedback("Alterando senha...");

        const resSenha = await fetch(
          "https://project-finc.onrender.com/api/profile/password",
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({
              senhaAtual,
              novaSenha: senha
            })
          }
        );

        const dataSenha = await resSenha.json();

        if (!resSenha.ok) {
          setFeedback(dataSenha.error || "Erro ao alterar senha");
          setLoading(false);
          return;
        }
      }

      // 📦 update profile
      setFeedback("Salvando dados do perfil...");

      const res = await fetch(
        "https://project-finc.onrender.com/api/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify(userData)
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setFeedback(data.error || "Erro ao salvar dados");
        setLoading(false);
        return;
      }

      localStorage.setItem("user", JSON.stringify(userData));
      setFeedback("Perfil atualizado com sucesso ✅");
      setEditando(false);
      setSenha("");
      setSenhaAtual("");
      setRepetirSenha("");
    } catch (err) {
      setFeedback("Erro de conexão com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const disabled = !editando || loading;

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
            <label>E-mail</label>
            <input value={userData.email} disabled />
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
                    cpf_cnpj: ""
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
              onChange={(e) =>
                setUserData({ ...userData, cpf_cnpj: e.target.value })
              }
            />
          </div>
        </div>

        {editando && (
          <div className="form-row">
            <div className="form-group">
              <label>Senha Atual</label>
              <input
                type="password"
                value={senhaAtual}
                disabled={loading}
                onChange={(e) => setSenhaAtual(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Nova Senha</label>
              <input
                type="password"
                value={senha}
                disabled={loading}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Repita a Nova Senha</label>
              <input
                type="password"
                value={repetirSenha}
                disabled={loading}
                onChange={(e) => setRepetirSenha(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>CEP</label>
            <input
              value={userData.cep}
              disabled={disabled}
              onChange={(e) =>
                setUserData({ ...userData, cep: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>UF</label>
            <input
              value={userData.uf}
              disabled={disabled}
              onChange={(e) =>
                setUserData({ ...userData, uf: e.target.value })
              }
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
              <button type="button" onClick={salvarAlteracoes} disabled={loading}>
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
