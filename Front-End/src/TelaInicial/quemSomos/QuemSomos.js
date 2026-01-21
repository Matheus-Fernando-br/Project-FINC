import { Link } from 'react-router-dom';
import "../../styles/telaInicial.css";

function QuemSomos() {

    return (
        <main>
            <section className="secao-quem-somos">
                <div className="lado-esquerdo">
                    <img src="/Images/Fundo-Quem-Somos.png" alt="Quem Somos" />
                </div>
                <div className="lado-direito">
                    <div className="texto">
                        <p>
                            A <span className="finc">FINC</span> nasceu da iniciativa de alunos de
                            Engenharia da UFMG e do Unileste com um propósito claro: tornar a
                            tecnologia de gestão empresarial acessível a
                            <span className="verde"> pequenos e médios empreendedores</span>. Nossa
                            plataforma automatiza a
                            <span className="destaque"> emissão de notas fiscais e boletos</span>,
                            otimizando o controle financeiro e ajudando negócios a crescer com
                            mais organização, agilidade e eficiência.
                        </p>
                    </div>
                        <div className="rodape form-footer voltar">
                            <Link to="/">
                                Voltar para Tela Inicial <i className="bi bi-chevron-double-left"></i><i className="bi bi-chevron-double-left"></i>
                            </Link>
                        </div>
                </div>
            </section>
        </main>
    );
}

export default QuemSomos;