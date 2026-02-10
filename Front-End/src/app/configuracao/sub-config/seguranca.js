import "../config.css";
import icons from "../../../components/Icons";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Seguranca() {
  const navigate = useNavigate();

  const [abrirSenha, setAbrirSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [feedback, setFeedback] = useState("");

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const alterarSenha = async () => {
    setFeedback("");

    if (!senhaAtual) return setFeedback("Informe a senha atual");
    if (novaSenha !== confirmarSenha)
      return setFeedback("As senhas não coincidem");

    setLoading(true);
    setFeedback("Alterando senha...");
    try {
      const res = await fetch(
        "https://project-finc.onrender.com/api/profile/password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            senhaAtual,
            novaSenha
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setFeedback(data.error || "Erro ao alterar senha");
        return;
      }

      setFeedback("Senha alterada com sucesso ✅");
      setTimeout(() => {
        setFeedback("");
        setAbrirSenha(false);
        navigate("/configuracao/seguranca");
      }, 2000);
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      setAbrirSenha(false);
    } catch {
      setFeedback("Erro de conexão com servidor");
    } finally {
      setLoading(false);
    }
  };

   const cancelarAlteracoes = () => {
    if (!window.confirm("Deseja cancelar todas as alterações?")) return;
    setLoadingCancel(true);
    setFeedback("Operação cancelada!");
    setTimeout(() => {
      setLoadingCancel(false);
      setAbrirSenha(false);
      navigate("/configuracao/seguranca");
    }, 1000);
  };

  return (
    <main className="content configuracao">
      <section className='titulo-secao'>
        <h1><i className={icons.seguranca}></i> Segurança</h1>
      </section> 
      <section className="form-section">
        <section className="form-section">
          <div className="search-bar">
            <input type="text" placeholder="Pesquisar configurações..." />
            <i className="bi bi-search"></i>
          </div>

          <hr />

          <div className="config-back">
            <button
              className="config-voltar"
              onClick={() => navigate("/configuracao")}
            >
              <i className="bi bi-arrow-left"></i> Voltar
            </button>
          </div>
        </section>

        <div className="config-options-2">

          {/* ALTERAR SENHA */}
          <div className="config-item">
            <div className="menu-esquerda">
              <i className={icons.cadeado}></i>
              <div>
                <h3>Alterar senha</h3>
                <p>Atualize sua senha de acesso</p>
              </div>
            </div>

            <div className="menu-direita">
              <button
                className="btn"
                onClick={() => setAbrirSenha(!abrirSenha)}
              >
                Alterar Senha
              </button>
            </div>
          </div>

          {/* DROPDOWN SENHA */}
          {abrirSenha && (
            <div
              className="modal-overlay"
              onClick={() => setAbrirSenha(false)}
            >
              <section
                className="dropdown form-section modal-container"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="modal-close"
                  onClick={() => setAbrirSenha(false)}
                >
                  ✕
                </button>

                <div className="section-header">
                  <span className="icon">
                    <i className={icons.chave}></i>
                  </span>
                  <h2 className="dropdown-title">Alterar Senha</h2>
                </div>

                <hr className="divider" />

                <div className="form-row">
                  <div className="form-group">
                    <p className="dropdown-description">
                      Informe a senha atual e depois a nova senha
                    </p>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <input
                      type="password"
                      placeholder="Senha Atual"
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <input
                      type="password"
                      placeholder="Nova Senha"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <input
                      type="password"
                      placeholder="Confirmar Nova Senha"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="botao_geral">
                  <button
                    className="btn btn-cancelar"
                    onClick={cancelarAlteracoes}
                    disabled={loading}
                  >
                    {loadingCancel && <span className="spinner"></span>}
                    {loadingCancel ? "" : "Cancelar Alterações"}
                  </button>

                  <button
                    className="btn btn-salvar"
                    disabled={loading}
                    onClick={alterarSenha}
                  >
                    {loading && <span className="spinner"></span>}
                    {loading ? "" : "Salvar Nova Senha"}
                  </button>
                </div>

                {feedback && <p className="feedback">{feedback}</p>}
              </section>
            </div>
          )}

          {/* 2FA */}
          <div className="config-item">
            <div className="menu-esquerda">
              <i className={icons.seguranca}></i>
              <div>
                <h3>Autenticação em 2 fatores</h3>
                <p>Segurança adicional na conta</p>
              </div>
            </div>

            <div className="menu-direita">
              <select className="select-config">
                <option>Ativada</option>
                <option>Desativada</option>
              </select>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
