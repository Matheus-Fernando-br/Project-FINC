import type { TipoNota } from "./catalogos.js";

/**
 * Cálculo dos totais de um documento fiscal.
 *
 * Regra herdada da FINC original (tela2EmitirNota.js): o total soma valor dos itens,
 * ICMS, ISS e PIS/COFINS e subtrai os descontos condicionais e incondicionais.
 * A opção `somarImpostos` (padrão: true, comportamento original) permite desligar a soma
 * dos tributos ao total — adequado quando o preço já embute os impostos ("por dentro").
 */

export interface ItemCalculo {
  tipo: "produto" | "servico";
  quantidade: number;
  valorUnitario: number;
  icms?: number | null;
  pisCofins?: number | null;
  aliquotaIss?: number | null;
}

export interface TotaisNota {
  valorProdutos: number;
  valorServicos: number;
  baseIcms: number;
  valorIcms: number;
  baseIss: number;
  valorIss: number;
  valorPisCofins: number;
  descontoIncondicional: number;
  descontoCondicional: number;
  valorTributos: number;
  totalNota: number;
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function pct(v: number | null | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n / 100 : 0;
}

export function calcularTotais(
  itens: ItemCalculo[],
  descontoIncondicional = 0,
  descontoCondicional = 0,
  somarImpostos = true,
): TotaisNota {
  let valorProdutos = 0;
  let valorServicos = 0;
  let valorIcms = 0;
  let valorIss = 0;
  let valorPisCofins = 0;

  for (const item of itens) {
    const subtotal = (Number(item.quantidade) || 0) * (Number(item.valorUnitario) || 0);
    if (item.tipo === "produto") {
      valorProdutos += subtotal;
      valorIcms += subtotal * pct(item.icms);
      valorPisCofins += subtotal * pct(item.pisCofins);
    } else {
      valorServicos += subtotal;
      valorIss += subtotal * pct(item.aliquotaIss);
    }
  }

  const descI = Math.max(0, Number(descontoIncondicional) || 0);
  const descC = Math.max(0, Number(descontoCondicional) || 0);
  const valorTributos = valorIcms + valorIss + valorPisCofins;
  const bruto = valorProdutos + valorServicos + (somarImpostos ? valorTributos : 0);
  const totalNota = Math.max(0, bruto - descI - descC);

  return {
    valorProdutos: round2(valorProdutos),
    valorServicos: round2(valorServicos),
    baseIcms: round2(valorProdutos),
    valorIcms: round2(valorIcms),
    baseIss: round2(valorServicos),
    valorIss: round2(valorIss),
    valorPisCofins: round2(valorPisCofins),
    descontoIncondicional: round2(descI),
    descontoCondicional: round2(descC),
    valorTributos: round2(valorTributos),
    totalNota: round2(totalNota),
  };
}

/** NFS-e aceita apenas serviços; NF-e e NFC-e apenas produtos (regra da FINC original). */
export function tipoItemPermitido(tipoNota: TipoNota, tipoItem: "produto" | "servico"): boolean {
  return tipoNota === "NFS-e" ? tipoItem === "servico" : tipoItem === "produto";
}
