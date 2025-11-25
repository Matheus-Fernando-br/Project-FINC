import Layout from '../../components/Layout';
import icons from "../../components/Icons";
import { Link, useNavigate } from 'react-router-dom';
import './sair.css';

function MenuSair() {
    const navigate = useNavigate();

    function logout() {
        alert("Usuário Desconectado com Sucesso!");
        navigate('/');
    }

    return (
        <main className="content">
            <section className="form-section">
                <div className="section-header">
                    <span className="icon"><i className={icons.sair}></i></span>
                    <h3>Logout</h3>
                </div>
                <hr className="divider" />
                <h4>Tem certeza de que deseja sair agora?</h4>
            </section>

            <section className="form-section">
                <div className="botoes">
                    
                    <Link to='/app'>
                        <button className="verde">Voltar para a Página Inicial</button>
                    </Link>

                    <button className="vermelho" onClick={logout}>
                        Fazer Logout / Sair
                    </button>

                </div>
            </section>
        </main>
    );
}

export default MenuSair;
