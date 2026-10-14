import { normalizarEmail, normalizarTelefone, onlyDigits } from "./validators.js";

/**
 * Máscaras progressivas para campos brasileiros: formatam enquanto o usuário digita e aceitam
 * texto colado com ou sem pontuação. Antes de enviar à API, `normalizarCampo` devolve só o dado
 * (dígitos ou e-mail em minúsculas); a API valida e normaliza de novo com os schemas Zod.
 */
export type Mascara = "cpf" | "cnpj" | "cpfCnpj" | "telefone" | "cep" | "email";

function aplicarPadrao(digitos: string, padrao: string): string {
  let out = "";
  let i = 0;
  for (const ch of padrao) {
    if (i >= digitos.length) break;
    if (ch === "#") out += digitos[i++];
    else out += ch;
  }
  return out;
}

export const mascaraCpf = (v: unknown) =>
  aplicarPadrao(onlyDigits(v).slice(0, 11), "###.###.###-##");

export const mascaraCnpj = (v: unknown) =>
  aplicarPadrao(onlyDigits(v).slice(0, 14), "##.###.###/####-##");

/** Até 11 dígitos usa o formato de CPF; acima disso, o de CNPJ. */
export const mascaraCpfCnpj = (v: unknown) => {
  const d = onlyDigits(v);
  return d.length <= 11 ? mascaraCpf(d) : mascaraCnpj(d);
};

/** (31) 3333-4444 para fixo e (31) 99999-8888 para celular. Aceita +55 colado. */
export const mascaraTelefone = (v: unknown) => {
  const bruto = onlyDigits(v);
  const d = (bruto.length > 11 ? normalizarTelefone(bruto) : bruto).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  return aplicarPadrao(d, d.length === 11 ? "(##) #####-####" : "(##) ####-####");
};

export const mascaraCep = (v: unknown) => aplicarPadrao(onlyDigits(v).slice(0, 8), "#####-###");

/** E-mail não tem máscara visual: apenas impede espaços enquanto digita. */
export const mascaraEmail = (v: unknown) => String(v ?? "").replace(/\s/g, "");

export function aplicarMascara(tipo: Mascara, valor: unknown): string {
  switch (tipo) {
    case "cpf":
      return mascaraCpf(valor);
    case "cnpj":
      return mascaraCnpj(valor);
    case "cpfCnpj":
      return mascaraCpfCnpj(valor);
    case "telefone":
      return mascaraTelefone(valor);
    case "cep":
      return mascaraCep(valor);
    case "email":
      return mascaraEmail(valor);
  }
}

/** Valor pronto para a API: só dígitos (documentos, telefone, CEP) ou e-mail normalizado. */
export function normalizarCampo(tipo: Mascara, valor: unknown): string {
  if (tipo === "email") return normalizarEmail(valor);
  if (tipo === "telefone") return normalizarTelefone(valor);
  return onlyDigits(valor);
}

/** Normaliza vários campos de um objeto de uma vez, preservando os demais. */
export function normalizarCampos<T extends Record<string, unknown>>(
  dados: T,
  mascaras: Partial<Record<keyof T, Mascara>>,
): T {
  const out: Record<string, unknown> = { ...dados };
  for (const [campo, tipo] of Object.entries(mascaras) as [string, Mascara | undefined][]) {
    if (!tipo) continue;
    const v = out[campo];
    if (v === null || v === undefined || v === "") continue;
    out[campo] = normalizarCampo(tipo, v);
  }
  return out as T;
}
