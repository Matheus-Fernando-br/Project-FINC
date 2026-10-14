export type CodigoPlano = "basico" | "black";

export type RecursoLimitado = "clientes" | "produtos" | "servicos" | "contadores" | "notas_mes";

export interface LimitesPlano {
  clientes: number | null;
  produtos: number | null;
  servicos: number | null;
  contadores: number | null;
  notas_mes: number | null;
}

export interface Plano {
  id: string;
  codigo: CodigoPlano;
  nome: string;
  valor: number;
  limites: LimitesPlano;
  detalhes: string[];
}

/** null = ilimitado */
export function dentroDoLimite(limite: number | null | undefined, usoAtual: number, acrescimo = 1): boolean {
  if (limite === null || limite === undefined) return true;
  return usoAtual + acrescimo <= limite;
}
