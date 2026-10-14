import type { AppContext } from "../context.js";
import type { Queryable } from "../db/index.js";
import { escapeHtml } from "./email.js";

export interface NovaNotificacao {
  tipo: string;
  titulo: string;
  mensagem: string;
  link?: string;
}

/**
 * Cria a notificação interna e, se o usuário optou e o SMTP estiver configurado, envia também por e-mail.
 * O envio de e-mail é assíncrono e falhas são registradas em log sem afetar a operação principal.
 */
export async function notificar(
  ctx: AppContext,
  q: Queryable,
  usuarioId: string,
  n: NovaNotificacao,
) {
  await q.query(
    "INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, link) VALUES ($1, $2, $3, $4, $5)",
    [usuarioId, n.tipo, n.titulo, n.mensagem, n.link ?? null],
  );
  if (!ctx.mailer.enabled) return;
  const { rows } = await q.query<{ email: string; notificar: boolean | null }>(
    `SELECT u.email, (p.dados->>'notificar_email')::boolean AS notificar
       FROM usuarios u LEFT JOIN preferencias p ON p.usuario_id = u.id WHERE u.id = $1`,
    [usuarioId],
  );
  const dest = rows[0];
  if (!dest?.notificar) return;
  const link = n.link ? `${ctx.cfg.APP_URL}${n.link}` : ctx.cfg.APP_URL;
  ctx.mailer
    .send({
      to: dest.email,
      subject: `FINC — ${n.titulo}`,
      text: `${n.mensagem}\n\nAcesse: ${link}`,
      html: `<p>${escapeHtml(n.mensagem)}</p><p><a href="${escapeHtml(link)}">Abrir na FINC</a></p>`,
    })
    .catch((err) => ctx.logger.warn({ err }, "falha ao enviar notificação por e-mail"));
}
