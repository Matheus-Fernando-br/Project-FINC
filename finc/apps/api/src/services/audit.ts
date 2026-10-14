import type { Request } from "express";
import type { Queryable } from "../db/index.js";

/** Trilha de auditoria (quem fez o quê, quando e de onde). */
export async function audit(
  q: Queryable,
  req: Request | null,
  usuarioId: string | null,
  acao: string,
  entidade?: string,
  entidadeId?: string | null,
  detalhes?: Record<string, unknown>,
) {
  await q.query(
    "INSERT INTO auditoria (usuario_id, acao, entidade, entidade_id, ip, detalhes) VALUES ($1, $2, $3, $4, $5, $6)",
    [usuarioId, acao, entidade ?? null, entidadeId ?? null, req?.ip ?? null, detalhes ? JSON.stringify(detalhes) : null],
  );
}
