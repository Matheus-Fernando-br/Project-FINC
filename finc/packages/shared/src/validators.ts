/**
 * Validadores de documentos e contatos brasileiros.
 * Usados tanto no front-end (feedback imediato) quanto na API (fonte da verdade).
 */

export function onlyDigits(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "");
}

export function isValidCPF(value: unknown): boolean {
  const s = onlyDigits(value);
  if (s.length !== 11 || /^(\d)\1{10}$/.test(s)) return false;
  const digit = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(s[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return digit(9) === Number(s[9]) && digit(10) === Number(s[10]);
}

export function isValidCNPJ(value: unknown): boolean {
  const s = onlyDigits(value);
  if (s.length !== 14 || /^(\d)\1{13}$/.test(s)) return false;
  const calc = (len: number) => {
    const weights =
      len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(s[i]) * (weights[i] ?? 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return calc(12) === Number(s[12]) && calc(13) === Number(s[13]);
}

export function isValidCpfCnpj(value: unknown): boolean {
  const s = onlyDigits(value);
  return s.length === 11 ? isValidCPF(s) : s.length === 14 ? isValidCNPJ(s) : false;
}

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isValidEmail(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const s = value.trim();
  return s.length <= 254 && EMAIL_RE.test(s);
}

/** Senha forte: 8 a 128 caracteres, ao menos uma letra e um número (regra herdada da FINC original). */
export function isStrongPassword(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return value.length >= 8 && value.length <= 128 && /[a-zA-Z]/.test(value) && /\d/.test(value);
}

/**
 * Telefone brasileiro só com dígitos: DDD + número. Remove o código do país (+55) e o zero
 * de discagem interurbana, para que "+55 (31) 99999-9999" e "031 99999-9999" virem "31999999999".
 */
export function normalizarTelefone(value: unknown): string {
  let s = onlyDigits(value);
  if ((s.length === 12 || s.length === 13) && s.startsWith("55")) s = s.slice(2);
  if ((s.length === 11 || s.length === 12) && s.startsWith("0")) s = s.slice(1);
  return s;
}

/** Fixo: DDD + 8 dígitos começando de 2 a 5. Celular: DDD + 9 + 8 dígitos. DDD de 11 a 99, sem zero. */
export function isValidTelefone(value: unknown): boolean {
  const s = normalizarTelefone(value);
  if (!/^[1-9][1-9]/.test(s)) return false;
  if (s.length === 11) return s[2] === "9";
  if (s.length === 10) return /[2-5]/.test(s[2] ?? "");
  return false;
}

/** E-mail como é gravado: sem espaços nas pontas e em minúsculas. */
export function normalizarEmail(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function isValidCEP(value: unknown): boolean {
  return onlyDigits(value).length === 8;
}

export function formatCpfCnpj(value: unknown): string {
  const s = onlyDigits(value);
  if (s.length === 11) return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (s.length === 14) return s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return s;
}

export function formatTelefone(value: unknown): string {
  const s = normalizarTelefone(value);
  if (s.length === 11) return s.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (s.length === 10) return s.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return s;
}

export function formatCEP(value: unknown): string {
  const s = onlyDigits(value);
  return s.length === 8 ? s.replace(/(\d{5})(\d{3})/, "$1-$2") : s;
}

export function formatBRL(value: unknown): string {
  const n = Number(value) || 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
