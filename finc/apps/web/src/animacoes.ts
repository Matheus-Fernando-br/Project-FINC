/**
 * Configuração única das animações da FINC. Ajuste os tempos aqui (em milissegundos).
 *
 * - `DURACAO_PADRAO`: tempo de exibição padrão das splash screens (3 segundos).
 * - `entrada` / `saida`: fade-in e fade-out (com leve efeito de escala) de cada splash.
 * - Quem pede menos movimento no sistema (prefers-reduced-motion) não vê as splash screens.
 */
export const DURACAO_PADRAO = 3000;

export const ANIMACOES = {
  /** Splash com a logo antes da página inicial: uma vez por sessão do navegador. */
  splashInicial: { duracao: DURACAO_PADRAO, entrada: 700, saida: 600 },
  /** Splash depois do login (ou do cadastro), antes de abrir o aplicativo. */
  splashLogin: { duracao: DURACAO_PADRAO, entrada: 500, saida: 600 },
  /** Saída rápida da tela de carregamento quando não há splash (outras páginas, sessão restaurada). */
  saidaCarregamento: 250,
} as const;

export type SplashTipo = "splashInicial" | "splashLogin";

const CHAVE_SPLASH_INICIAL = "finc:splash-inicial-vista";

export function menosMovimento(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** A splash inicial aparece só na página inicial, na primeira visita da sessão. */
export function deveMostrarSplashInicial(caminho: string): boolean {
  if (caminho !== "/" || menosMovimento()) return false;
  try {
    return sessionStorage.getItem(CHAVE_SPLASH_INICIAL) !== "1";
  } catch {
    return true;
  }
}

export function marcarSplashInicialVista() {
  try {
    sessionStorage.setItem(CHAVE_SPLASH_INICIAL, "1");
  } catch {
    /* sem armazenamento: a splash pode reaparecer, sem prejuízo */
  }
}

/** Publica os tempos como variáveis CSS, usadas pelas transições de index.html e global.css. */
export function aplicarTemposCss(raiz: HTMLElement = document.documentElement) {
  const { splashInicial, splashLogin, saidaCarregamento } = ANIMACOES;
  raiz.style.setProperty("--splash-inicial-entrada", `${splashInicial.entrada}ms`);
  raiz.style.setProperty("--splash-inicial-saida", `${splashInicial.saida}ms`);
  raiz.style.setProperty("--splash-login-entrada", `${splashLogin.entrada}ms`);
  raiz.style.setProperty("--splash-login-saida", `${splashLogin.saida}ms`);
  raiz.style.setProperty("--carregamento-saida", `${saidaCarregamento}ms`);
}
