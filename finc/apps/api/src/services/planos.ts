import { dentroDoLimite, type LimitesPlano, type Plano, type RecursoLimitado } from "@finc/shared";
import type { Queryable } from "../db/index.js";
import { AppError } from "../http/errors.js";

export interface PlanoRow {
  id: string;
  codigo: "basico" | "black";
  nome: string;
  valor: number;
  limite_clientes: number | null;
  limite_produtos: number | null;
  limite_servicos: number | null;
  limite_contadores: number | null;
  limite_notas_mes: number | null;
  detalhes: string[];
}

export function mapPlano(p: PlanoRow): Plano {
  return {
    id: p.id,
    codigo: p.codigo,
    nome: p.nome,
    valor: Number(p.valor),
    limites: {
      clientes: p.limite_clientes,
      produtos: p.limite_produtos,
      servicos: p.limite_servicos,
      contadores: p.limite_contadores,
      notas_mes: p.limite_notas_mes,
    },
    detalhes: Array.isArray(p.detalhes) ? p.detalhes : [],
  };
}

export async function planoDoUsuario(q: Queryable, usuarioId: string): Promise<Plano> {
  const { rows } = await q.query<PlanoRow>(
    "SELECT p.* FROM planos p JOIN usuarios u ON u.plano_id = p.id WHERE u.id = $1",
    [usuarioId],
  );
  if (!rows[0]) throw new AppError("NAO_ENCONTRADO", "Plano do usuário não encontrado.");
  return mapPlano(rows[0]);
}

const CONTAGEM: Record<RecursoLimitado, string> = {
  clientes: "SELECT count(*)::int AS n FROM clientes WHERE usuario_id = $1",
  produtos: "SELECT count(*)::int AS n FROM produtos WHERE usuario_id = $1",
  servicos: "SELECT count(*)::int AS n FROM servicos WHERE usuario_id = $1",
  contadores: "SELECT count(*)::int AS n FROM contadores WHERE usuario_id = $1",
  notas_mes: `SELECT count(*)::int AS n FROM notas WHERE usuario_id = $1 AND numero IS NOT NULL
               AND data_emissao >= date_trunc('month', now())`,
};

export async function usoAtual(
  q: Queryable,
  usuarioId: string,
): Promise<Record<RecursoLimitado, number>> {
  const entries = await Promise.all(
    (Object.keys(CONTAGEM) as RecursoLimitado[]).map(async (k) => {
      const { rows } = await q.query<{ n: number }>(CONTAGEM[k], [usuarioId]);
      return [k, rows[0]?.n ?? 0] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<RecursoLimitado, number>;
}

const NOMES: Record<RecursoLimitado, string> = {
  clientes: "clientes",
  produtos: "produtos",
  servicos: "serviços",
  contadores: "contadores",
  notas_mes: "documentos fiscais neste mês",
};

/** Garante, no servidor, que a operação respeita o limite do plano (antes só existia no front). */
export async function assertLimite(
  q: Queryable,
  usuarioId: string,
  recurso: RecursoLimitado,
  acrescimo = 1,
) {
  const plano = await planoDoUsuario(q, usuarioId);
  const limite = plano.limites[recurso as keyof LimitesPlano];
  if (limite === null) return;
  const { rows } = await q.query<{ n: number }>(CONTAGEM[recurso], [usuarioId]);
  const atual = rows[0]?.n ?? 0;
  if (!dentroDoLimite(limite, atual, acrescimo)) {
    throw new AppError(
      "LIMITE_PLANO",
      `Seu plano ${plano.nome} permite até ${limite} ${NOMES[recurso]} (em uso: ${atual}). Faça upgrade para o plano BLACK.`,
      { recurso, limite, atual },
    );
  }
}
