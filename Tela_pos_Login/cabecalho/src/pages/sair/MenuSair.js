import Layout from '../../components/Layout';
import { Link } from 'react-router-dom';
import './sair.css';

function MenuSair() {
    return (
            <main className="content">
                <section className="form-section">
                    <div className="section-header">
                        <span className="icon"><i class="bi bi-box-arrow-right"></i></span>
                        <h3>Loggof</h3>
                    </div>
                    <hr className="divider" />
                    <h4>Tem certeza de que deseja sair agora?</h4>
                </section>

                <section className="form-section">
                    <div className="botoes">
                        <Link to='/app'>
                            <button className="verde">Voltar para a Página Inicial</button>
                        </Link>
                        <Link to='/'>
                            <button className="vermelho">Fazer Logout / Sair</button>
                        </Link>
                    </div>
                </section>
            </main>
    );
}

export default MenuSair;