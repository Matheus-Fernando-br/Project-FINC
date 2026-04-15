import icons from "../../components/Icons";
import { Link, useNavigate } from "react-router-dom";
import "./sair.css";
import { API_URL } from "../../utils/api.js";

function MenuSair() {
  const navigate = useNavigate();

  async function logout() {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      /* rede */
    }
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("user_name");
    alert("Usuário desconectado com sucesso!");
    navigate("/");
  }

  return (
    <main className="content">
      <section className="form-section">
        <div className="section-header">
          <span className="icon">
            <i className={icons.sair}></i>
          </span>
          <h3>Logout</h3>
        </div>
        <hr className="divider" />
        <h4>Tem certeza de que deseja sair agora?</h4>
      </section>

      <section className="form-section">
        <div className="botoes">
          <Link to="/app">
            <button className="verde">Voltar para a Página Inicial</button>
          </Link>

          <button className="vermelho" onClick={() => void logout()}>
            Fazer Logout / Sair
          </button>
        </div>
      </section>
    </main>
  );
}

export default MenuSair;
