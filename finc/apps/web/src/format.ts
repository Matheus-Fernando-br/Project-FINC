export { formatBRL, formatCpfCnpj, formatTelefone, formatCEP } from "@finc/shared";

/** Preferências de exibição do usuário (Configurações › Geral), aplicadas após o login. */
const exibicao = { formato: "dd/MM/yyyy", fuso: "America/Sao_Paulo" };
export function configurarExibicao(formato?: string, fuso?: string) {
  if (formato) exibicao.formato = formato;
  if (fuso) exibicao.fuso = fuso;
}

function montar(y: string, m: string, d: string) {
  if (exibicao.formato === "yyyy-MM-dd") return `${y}-${m}-${d}`;
  if (exibicao.formato === "MM/dd/yyyy") return `${m}/${d}/${y}`;
  return `${d}/${m}/${y}`;
}

function partes(date: Date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: exibicao.fuso,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((x) => [x.type, x.value]),
  );
  return p as Record<string, string>;
}

export const dataBR = (v: string | null | undefined) => {
  if (!v) return "—";
  // Datas "YYYY-MM-DD" (sem horário) são exibidas sem conversão de fuso.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (m) return montar(m[1]!, m[2]!, m[3]!);
  const p = partes(new Date(v));
  return montar(p.year!, p.month!, p.day!);
};

export const dataHoraBR = (v: string | null | undefined) => {
  if (!v) return "—";
  const p = partes(new Date(v));
  return `${montar(p.year!, p.month!, p.day!)} ${p.hour}:${p.minute}`;
};

export const numeroNota = (n: number | null) => (n ? String(n).padStart(9, "0") : "Rascunho");

export const hojeISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
