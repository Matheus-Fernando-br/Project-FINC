/** Preferências de aparência por dispositivo (tema, tamanho da fonte, negrito) — como na FINC original. */
export type Tema = "auto" | "light" | "dark";

function ler(k: string, padrao: string) {
  try {
    return localStorage.getItem(k) ?? padrao;
  } catch {
    return padrao;
  }
}
function gravar(k: string, v: string) {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* armazenamento indisponível: preferência vale só nesta sessão */
  }
}

export const aparencia = {
  tema: () => ler("finc.tema", "auto") as Tema,
  fonte: () => Number(ler("finc.fonte", "100")) || 100,
  negrito: () => ler("finc.negrito", "false") === "true",
  aplicar() {
    const root = document.documentElement;
    const t = aparencia.tema();
    if (t === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", t);
    root.style.setProperty("--font-scale", String(aparencia.fonte() / 100));
    root.setAttribute("data-bold", String(aparencia.negrito()));
  },
  salvar(t: Tema, fonte: number, negrito: boolean) {
    gravar("finc.tema", t);
    gravar("finc.fonte", String(fonte));
    gravar("finc.negrito", String(negrito));
    aparencia.aplicar();
  },
};
