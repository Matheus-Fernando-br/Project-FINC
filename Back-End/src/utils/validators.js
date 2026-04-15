/**
 * Validações server-side para cadastro (não confiar no frontend).
 */

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const s = email.trim();
  if (s.length > 254) return false;
  return EMAIL_RE.test(s);
}

/** Senha forte: mín. 8, pelo menos uma letra e um número */
export function isStrongPassword(senha) {
  if (!senha || typeof senha !== "string") return false;
  if (senha.length < 8 || senha.length > 128) return false;
  if (!/[a-zA-Z]/.test(senha)) return false;
  if (!/\d/.test(senha)) return false;
  return true;
}

export function validarCPF(cpf) {
  const s = String(cpf).replace(/\D/g, "");
  if (s.length !== 11 || /^(\d)\1{10}$/.test(s)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(s.charAt(i), 10) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(s.charAt(9), 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(s.charAt(i), 10) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(s.charAt(10), 10);
}

export function validarCNPJ(cnpj) {
  const s = String(cnpj).replace(/\D/g, "");
  if (s.length !== 14 || /^(\d)\1{13}$/.test(s)) return false;

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let soma = 0;
  for (let i = 0; i < 12; i++) soma += parseInt(s.charAt(i), 10) * pesos1[i];
  let resto = soma % 11;
  const d1 = resto < 2 ? 0 : 11 - resto;
  if (d1 !== parseInt(s.charAt(12), 10)) return false;

  soma = 0;
  for (let i = 0; i < 13; i++) soma += parseInt(s.charAt(i), 10) * pesos2[i];
  resto = soma % 11;
  const d2 = resto < 2 ? 0 : 11 - resto;
  return d2 === parseInt(s.charAt(13), 10);
}

export function normalizeDigits(str) {
  return String(str || "").replace(/\D/g, "");
}
