import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "./styles/TelaInicial.css"; // importa o CSS

function HomeTelaInicial() {
  useEffect(() => {
    const root = document.querySelector(".tela-inicial");
    const scrollTimeout = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, 0);

    // Splash
    const splash = root?.querySelector("#splash");
    const splashTimeout = splash ? setTimeout(() => (splash.style.display = "none"), 2000) : null;

    // Scroll Animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("show");
        });
      },
      { threshold: 0.3 }
    );

    const scrollFadeEls = root ? Array.from(root.querySelectorAll(".scroll-fade")) : [];
    scrollFadeEls.forEach((el) => observer.observe(el));

    // Logo Scroll
    const logo = root?.querySelector("header .navbar img");
    const onLogoClick = (e) => {
      e.preventDefault();
      root.querySelector("#secao-hero-texto")?.scrollIntoView({ behavior: "smooth" });
    };
    if (logo) logo.addEventListener("click", onLogoClick);

    // Carrossel
    const items = root ? Array.from(root.querySelectorAll(".carossel-item")) : [];
    const prevBtn = root?.querySelector(".btn-prev");
    const nextBtn = root?.querySelector(".btn-next");
    let currentIndex = 0;

    function showSlide(index) {
      if (!items || items.length === 0) return;
      items.forEach((item, i) => {
        item.classList.remove("active");
        if (i === index) item.classList.add("active");
      });

      if (prevBtn) prevBtn.classList.toggle("disabled", index === 0);
      if (nextBtn) nextBtn.classList.toggle("disabled", index === items.length - 1);
    }

    const onPrevClick = () => {
      if (currentIndex > 0) {
        currentIndex--;
        showSlide(currentIndex);
      }
    };
    const onNextClick = () => {
      if (currentIndex < items.length - 1) {
        currentIndex++;
        showSlide(currentIndex);
      }
    };

    if (prevBtn) prevBtn.addEventListener("click", onPrevClick);
    if (nextBtn) nextBtn.addEventListener("click", onNextClick);

    showSlide(currentIndex);

    
    return () => {
      clearTimeout(scrollTimeout);
      if (splashTimeout) clearTimeout(splashTimeout);
      observer.disconnect();
      if (logo) logo.removeEventListener("click", onLogoClick);
      if (prevBtn) prevBtn.removeEventListener("click", onPrevClick);
      if (nextBtn) nextBtn.removeEventListener("click", onNextClick);
    };
  }, []);

  return (
    <div className="tela-inicial">
      {/* Splash */}
      <div id="splash">
        <img src="/Images/1.png" alt="Splash Screen" />
      </div>


      {/* Hero */}
      <section className="secao-hero">
        <div className="fundo">
          <img src="/Images/Fundo-Tela-Inicial.png" alt="Foto de fundo" />
        </div>


        <div className="hero-textos" id="secao-hero-texto">
          <div className="frase-um fade-in delay-1">
            <p>
              Com a <span>FINC</span>, você deixa o <br />
              financeiro mais
            </p>
            <h2>simples.</h2>
          </div>

          <div className="frase-dois fade-in delay-2">
            <h2>
              Emissão automática de notas <br />
              boletos... e muito mais
            </h2>
            <p>
              soluções integradas com bancos e <br />
              plataformas de e-commerce por <br />
              um preço justo
            </p>
          </div>

          <hr className="linha fade-in delay-3" />

          <div className="plano fade-in delay-4">
            <p>planos a partir de</p>
            <h2>R$ 19,90</h2>
          </div>

        </div>
      </section>

      {/* Seção vídeo */}
      <section className="secao-video" id="funcionalidades">
        <div className="conteudo-video scroll-fade">
          <h2>
            A FINC te permite emitir notas com <br /> os <span>recursos essenciais</span> que melhoram <br /> a performance do seu negócio
          </h2>
          <hr className="linha" />
          <div className="print scroll-fade delay-1">
            <img src="/Images/print.png" alt="Print da plataforma" />
            <a href="https://drive.google.com/file/d/1MZ0AMvsA2O6vZ5ZWFwJj96cHy3g-xcZz/view?usp=drive_link" target="_blank" rel="noopener noreferrer">
              <i className="bi bi-play-circle-fill"></i>
            </a>
          </div>
        </div>
      </section>

      {/* Seção destaque */}
      <section className="secao-destaque">
        <div className="lado-esquerdo scroll-fade">
          <div className="circulo">
            <div className="item">Vendas</div>
            <div className="item">Estoque</div>
            <div className="item">Logística</div>
            <div className="item">Integrações</div>
            <div className="item">Gestão financeira</div>
            <div className="item">Automação</div>
            <div className="item">Dashboards</div>
            <div className="item">Conta Digital</div>
          </div>
        </div>

        <div className="lado-direito scroll-fade delay-1">
          <h2>
            Automatize processos e <br />
            <span>ganhe tempo</span> para focar no crescimento do negócio
          </h2>
          <p>
            Com o sistema FINC você automatiza tarefas, como emissão de notas fiscais, controle fiscal, gestão financeira e dashboards inteligentes, conectando todas as informações ao seu e-commerce ou loja física.
          </p>
          <a href="/TelaInicial/Login/Criar-Conta/index.html" className="botao-destaque scroll-fade delay-2">
            Comece agora
          </a>
        </div>
      </section>

      {/* Seção Carrossel */}
      <section className="secao-carrossel">
        <section className="form-section">
          <div className="section-header scroll-fade">
            <h3>Cadastro simples e seguro de seus dados e de seus clientes.</h3>
          </div>
          <hr className="divider scroll-fade delay-1" />
          <p className="scroll-fade delay-2">
            Dados que são utilizados para agilizar a emissão manual no plano BÁSICO.
          </p>
        </section>

        <section className="carossel scroll-fade delay-3">
          <button className="btn-prev"><i className="bi bi-caret-left"></i></button>
          <div className="carossel-container">
            <img src="/Images/print-dados.png" className="carossel-item active" alt="Meus dados" />
            <img src="/Images/print-clientes.png" className="carossel-item" alt="Meus clientes" />
          </div>
          <button className="btn-next"><i className="bi bi-caret-right"></i></button>
        </section>
      </section>

      {/* Seção Sobre */}
      <section className="secao-sobre">
        <div className="fundo-2">
            <img src="/Images/Fundo-Tela-Inicial-2.png" alt="Foto de fundo" />
        </div>
        <div className="conteudo-sobre">
          <div className="lado-esquerdo scroll-fade">
            <h2>pensada<br />para os<br />pequenos<br />empreendedores.</h2>
          </div>
          <hr className="linha" />
          <div className="lado-direito scroll-fade delay-1">
            <p>
              a <span className="bold">finc</span> surgiu com o intuito de ser<br />
              uma plataforma <span className="bold">acessível</span>, que<br />
              integra emissão de notas fiscais,<br />
              geração de boletos, controle<br />
              financeiro de pequenos e médios<br />
              negócios.<br /><br />
              <span className="bold">
                Modernizando o<br />
                empreendedorismo nacional.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Seção App */}
      <section className="secao-app" id="secao-app">
        <div className="conteudo-app">
          <div className="texto-app scroll-fade">
            <h2>Baixe nosso app</h2>
            <p>Emita notas com agilidade e eficiência de <br />qualquer lugar</p>
            <div className="botoes-app scroll-fade delay-1">
              <a href="https://play.google.com/store/apps?hl=pt_BR&pli=1" target="_blank" rel="noopener noreferrer">
                <button className="btn-app">Playstore</button>
              </a>
              <a href="https://www.apple.com/br/app-store/" target="_blank" rel="noopener noreferrer">
                <button className="btn-app">Appstore</button>
              </a>
            </div>
          </div>

          <div className="celular-app scroll-fade delay-2">
            <div className="status-bar">
              <i className="bi bi-reception-4"></i>
              <i className="bi bi-wifi"></i>
              <i className="bi bi-battery-half"></i>
            </div>
            <div className="tela">
              <img src="/Images/FINC.png" alt="Logo FINC" />
              <i className="bi bi-phone"></i>
              <p>trabalhe de<br />qualquer lugar</p>
            </div>
          </div>
        </div>

        <div className="footer-app">
          <img src="/Images/a project by R2M WHITE.png" alt="R2M" />
        </div>
      </section>

    </div>
  );
}

export default HomeTelaInicial;
