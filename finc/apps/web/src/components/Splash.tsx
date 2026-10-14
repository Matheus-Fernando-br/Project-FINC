import { useEffect, useState } from "react";
import {
  ANIMACOES,
  deveMostrarSplashInicial,
  marcarSplashInicialVista,
  menosMovimento,
} from "../animacoes";

/**
 * Splash inicial: a tela com a logo já vem pronta no index.html (aparece antes do JavaScript,
 * sem tela branca). Aqui decidimos quanto tempo ela fica: o tempo configurado na página inicial
 * (uma vez por sessão) ou uma saída rápida nas demais páginas.
 */
export function SplashInicial() {
  useEffect(() => {
    const el = document.getElementById("splash-boot");
    if (!el) return;
    const mostrar = deveMostrarSplashInicial(window.location.pathname);
    const { duracao, saida } = ANIMACOES.splashInicial;
    // Conta desde o início do carregamento da página, não desde a montagem do React.
    const restante = mostrar ? Math.max(0, duracao - performance.now()) : 0;
    const tempoSaida = mostrar ? saida : ANIMACOES.saidaCarregamento;
    if (mostrar) marcarSplashInicialVista();
    const t1 = window.setTimeout(() => {
      el.style.transitionDuration = `${tempoSaida}ms`;
      el.classList.add("saindo");
    }, restante);
    const t2 = window.setTimeout(() => el.remove(), restante + tempoSaida + 50);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);
  return null;
}

/** Marca da splash: a bolinha da FINC (escala + brilho) e a palavra "finc". */
export function MarcaSplash() {
  return (
    <div className="splash-marca" aria-hidden>
      <span className="splash-orb" />
      <span className="splash-nome">finc</span>
    </div>
  );
}

/**
 * Splash depois do login: cobre a troca para o aplicativo com fade-in, mantém a logo pelo tempo
 * configurado e sai com fade-out. Não aparece quando a sessão é apenas restaurada.
 */
export function SplashLogin({ ativa, aoTerminar }: { ativa: boolean; aoTerminar: () => void }) {
  const [saindo, setSaindo] = useState(false);
  useEffect(() => {
    if (!ativa) return;
    if (menosMovimento()) {
      aoTerminar();
      return;
    }
    setSaindo(false);
    const { duracao, saida } = ANIMACOES.splashLogin;
    const t1 = window.setTimeout(() => setSaindo(true), Math.max(0, duracao - saida));
    const t2 = window.setTimeout(aoTerminar, duracao);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [ativa, aoTerminar]);
  if (!ativa) return null;
  return (
    <div
      className={`splash splash-login ${saindo ? "saindo" : ""}`}
      role="status"
      aria-label="Abrindo a FINC"
    >
      <MarcaSplash />
      <span className="splash-texto">Preparando seu painel…</span>
    </div>
  );
}
