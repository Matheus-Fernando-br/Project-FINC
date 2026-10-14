import { randomInt } from "node:crypto";
import { Router, type Request } from "express";
import { chamadoSchema, feedbackSchema, mensagemSchema } from "@finc/shared";
import { z } from "zod";
import type { AppContext } from "../context.js";
import type { Queryable } from "../db/index.js";
import { AppError, naoEncontrado, parse, regra } from "../http/errors.js";
import { uid } from "../middleware/auth.js";
import { safeEqual } from "../security/tokens.js";
import { audit } from "../services/audit.js";
import { notificar } from "../services/notificacoes.js";
import type { InlineKeyboard } from "../services/telegram.js";
import { UUID_RE } from "./crud.js";

/**
 * Suporte por chamados. Todas as rotas exigem autenticação e verificam o dono do chamado
 * (na FINC original elas eram públicas — falha de IDOR). A equipe responde pelo painel
 * administrativo da FINC ou, opcionalmente, pelo bot do Telegram.
 */

type Status = "aberto" | "aceito" | "fechado";

function teclado(id: string, status: Status): InlineKeyboard {
  if (status === "fechado") return { inline_keyboard: [] };
  const primeiro =
    status === "aceito"
      ? { text: "📝 Responder", callback_data: `RESPONDER:${id}` }
      : { text: "✅ Aceitar", callback_data: `ACEITAR:${id}` };
  return { inline_keyboard: [[primeiro, { text: "🔒 Encerrar", callback_data: `FECHAR:${id}` }]] };
}

async function avisarTelegram(ctx: AppContext, texto: string, keyboard?: InlineKeyboard) {
  if (!ctx.telegram.enabled) return;
  await ctx.telegram
    .sendMessage(texto, keyboard)
    .catch((err) => ctx.logger.warn({ err }, "falha ao notificar Telegram"));
}

async function gerarProtocolo(q: Queryable): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const data = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const protocolo = `${data}${String(randomInt(0, 1_000_000)).padStart(6, "0")}`;
    const { rows } = await q.query("SELECT 1 FROM chamados WHERE protocolo = $1", [protocolo]);
    if (!rows[0]) return protocolo;
  }
  throw new AppError("INTERNO", "Não foi possível gerar o protocolo.");
}

async function chamadoComMensagens(q: Queryable, id: string, userId?: string) {
  if (!UUID_RE.test(id)) throw naoEncontrado("Chamado");
  const { rows } = await q.query<Record<string, unknown>>(
    `SELECT c.*, u.nome AS usuario_nome, u.email AS usuario_email FROM chamados c JOIN usuarios u ON u.id = c.usuario_id
      WHERE c.id = $1 ${userId ? "AND c.usuario_id = $2" : ""}`,
    userId ? [id, userId] : [id],
  );
  const c = rows[0];
  if (!c) throw naoEncontrado("Chamado");
  c.mensagens = (
    await q.query(
      "SELECT id, autor, mensagem, criado_em FROM chamado_mensagens WHERE chamado_id = $1 ORDER BY criado_em",
      [id],
    )
  ).rows;
  return c;
}

/** Ações da equipe de suporte (compartilhadas entre painel admin e bot do Telegram). */
export async function acaoSuporte(
  ctx: AppContext,
  q: Queryable,
  req: Request | null,
  chamadoId: string,
  acao: "aceitar" | "fechar" | "responder",
  texto?: string,
) {
  const { rows } = await q.query<{
    id: string;
    usuario_id: string;
    status: Status;
    protocolo: string;
  }>("SELECT id, usuario_id, status, protocolo FROM chamados WHERE id = $1 FOR UPDATE", [
    chamadoId,
  ]);
  const c = rows[0];
  if (!c) throw naoEncontrado("Chamado");
  if (c.status === "fechado") throw regra("Chamado encerrado.");
  let mensagem: string;
  if (acao === "aceitar") {
    await q.query("UPDATE chamados SET status='aceito', atualizado_em=now() WHERE id=$1", [
      chamadoId,
    ]);
    mensagem = "✅ Chamado aceito pelo atendente.";
  } else if (acao === "fechar") {
    await q.query("UPDATE chamados SET status='fechado', atualizado_em=now() WHERE id=$1", [
      chamadoId,
    ]);
    mensagem = "🔒 Chamado encerrado pelo atendente.";
  } else {
    if (!texto?.trim()) throw regra("Mensagem vazia.");
    if (c.status === "aberto")
      await q.query("UPDATE chamados SET status='aceito', atualizado_em=now() WHERE id=$1", [
        chamadoId,
      ]);
    else await q.query("UPDATE chamados SET atualizado_em=now() WHERE id=$1", [chamadoId]);
    mensagem = texto.trim().slice(0, 4000);
  }
  await q.query(
    "INSERT INTO chamado_mensagens (chamado_id, autor, mensagem) VALUES ($1, 'suporte', $2)",
    [chamadoId, mensagem],
  );
  await notificar(ctx, q, c.usuario_id, {
    tipo: "suporte",
    titulo: `Chamado ${c.protocolo} atualizado`,
    mensagem: acao === "responder" ? "O suporte respondeu ao seu chamado." : mensagem,
    link: `/suporte/${chamadoId}`,
  });
  await audit(q, req, req?.auth?.userId ?? null, `suporte.${acao}`, "chamados", chamadoId);
  return acao === "fechar" ? "fechado" : "aceito";
}

export function suporteRoutes(ctx: AppContext) {
  const r = Router();
  const { db } = ctx;

  r.get("/chamados", async (req, res) => {
    const { rows } = await db.query(
      `SELECT c.id, c.protocolo, c.categoria, c.assunto, c.status, c.criado_em, c.atualizado_em,
              (SELECT count(*)::int FROM chamado_mensagens m WHERE m.chamado_id = c.id) AS mensagens
         FROM chamados c WHERE c.usuario_id = $1 ORDER BY c.atualizado_em DESC`,
      [uid(req)],
    );
    res.json(rows);
  });

  r.post("/chamados", async (req, res) => {
    const input = parse(chamadoSchema, req.body);
    const chamado = await db.tx(async (q) => {
      const protocolo = await gerarProtocolo(q);
      const { rows } = await q.query<{ id: string; protocolo: string }>(
        "INSERT INTO chamados (usuario_id, protocolo, categoria, assunto) VALUES ($1,$2,$3,$4) RETURNING id, protocolo",
        [uid(req), protocolo, input.categoria, input.assunto],
      );
      await q.query(
        "INSERT INTO chamado_mensagens (chamado_id, autor, mensagem) VALUES ($1, 'cliente', $2)",
        [rows[0]!.id, input.mensagem],
      );
      await audit(q, req, uid(req), "suporte.abrir", "chamados", rows[0]!.id);
      return rows[0]!;
    });
    await avisarTelegram(
      ctx,
      `🆕 Novo chamado #${chamado.protocolo}\n👤 ${req.auth!.nome} <${req.auth!.email}>\n📂 ${input.categoria}\n📌 ${input.assunto}\n\n💬 ${input.mensagem}`,
      teclado(chamado.id, "aberto"),
    );
    res.status(201).json(await chamadoComMensagens(db, chamado.id, uid(req)));
  });

  r.get("/chamados/:id", async (req, res) =>
    res.json(await chamadoComMensagens(db, req.params.id, uid(req))),
  );

  r.post("/chamados/:id/mensagens", async (req, res) => {
    const { mensagem } = parse(mensagemSchema, req.body);
    const c = await chamadoComMensagens(db, req.params.id, uid(req));
    if (c.status === "fechado") throw regra("Chamado encerrado. Abra um novo chamado se precisar.");
    await db.query(
      "INSERT INTO chamado_mensagens (chamado_id, autor, mensagem) VALUES ($1, 'cliente', $2)",
      [req.params.id, mensagem],
    );
    await db.query("UPDATE chamados SET atualizado_em = now() WHERE id = $1", [req.params.id]);
    await avisarTelegram(
      ctx,
      `📩 Nova mensagem no chamado #${c.protocolo}\n👤 ${req.auth!.nome}\n\n💬 ${mensagem}`,
      teclado(req.params.id, c.status as Status),
    );
    res.status(201).json(await chamadoComMensagens(db, req.params.id, uid(req)));
  });

  r.post("/chamados/:id/encerrar", async (req, res) => {
    const c = await chamadoComMensagens(db, req.params.id, uid(req));
    if (c.status !== "fechado") {
      await db.query("UPDATE chamados SET status='fechado', atualizado_em=now() WHERE id=$1", [
        req.params.id,
      ]);
      await db.query(
        "INSERT INTO chamado_mensagens (chamado_id, autor, mensagem) VALUES ($1, 'cliente', $2)",
        [req.params.id, "🔒 Chamado encerrado pelo cliente."],
      );
      await avisarTelegram(ctx, `🔒 Chamado #${c.protocolo} encerrado pelo cliente.`);
      await audit(db, req, uid(req), "suporte.encerrar", "chamados", req.params.id);
    }
    res.json(await chamadoComMensagens(db, req.params.id, uid(req)));
  });

  r.post("/feedback", async (req, res) => {
    const { mensagem } = parse(feedbackSchema, req.body);
    await db.query("INSERT INTO feedbacks (usuario_id, mensagem) VALUES ($1, $2)", [
      uid(req),
      mensagem,
    ]);
    await avisarTelegram(
      ctx,
      `💡 FEEDBACK\n👤 ${req.auth!.nome} <${req.auth!.email}>\n\n${mensagem}`,
    );
    res.status(201).json({ ok: true, message: "Obrigado! Seu feedback foi registrado." });
  });

  return r;
}

/** Painel da equipe de suporte (usuários com papel "admin"). */
export function adminRoutes(ctx: AppContext) {
  const r = Router();
  const { db } = ctx;

  r.get("/chamados", async (req, res) => {
    const status = z
      .enum(["aberto", "aceito", "fechado"])
      .optional()
      .parse(req.query.status || undefined);
    const { rows } = await db.query(
      `SELECT c.id, c.protocolo, c.categoria, c.assunto, c.status, c.criado_em, c.atualizado_em, u.nome AS usuario_nome, u.email AS usuario_email
         FROM chamados c JOIN usuarios u ON u.id = c.usuario_id ${status ? "WHERE c.status = $1" : ""}
        ORDER BY c.atualizado_em DESC LIMIT 500`,
      status ? [status] : [],
    );
    res.json(rows);
  });

  r.get("/chamados/:id", async (req, res) =>
    res.json(await chamadoComMensagens(db, req.params.id)),
  );

  r.post("/chamados/:id/:acao", async (req, res) => {
    const acao = z.enum(["aceitar", "fechar", "responder"]).parse(req.params.acao);
    const texto = acao === "responder" ? parse(mensagemSchema, req.body).mensagem : undefined;
    await db.tx((q) => acaoSuporte(ctx, q, req, req.params.id, acao, texto));
    res.json(await chamadoComMensagens(db, req.params.id));
  });

  r.get("/feedbacks", async (_req, res) => {
    const { rows } = await db.query(
      "SELECT f.id, f.mensagem, f.criado_em, u.nome AS usuario_nome, u.email AS usuario_email FROM feedbacks f LEFT JOIN usuarios u ON u.id = f.usuario_id ORDER BY f.criado_em DESC LIMIT 200",
    );
    res.json(rows);
  });
  return r;
}

/**
 * Webhook do bot do Telegram. Exige o header X-Telegram-Bot-Api-Secret-Token
 * (configurado em setWebhook com secret_token = TELEGRAM_WEBHOOK_SECRET).
 */
export function telegramWebhookRoutes(ctx: AppContext) {
  const r = Router();
  // Modo "responder": próximo texto do atendente vai para o chamado escolhido (expira em 15 min).
  const pendentes = new Map<number, { chamadoId: string; expira: number }>();

  r.post("/", async (req, res) => {
    const secret = ctx.cfg.TELEGRAM_WEBHOOK_SECRET;
    if (!secret || !ctx.cfg.TELEGRAM_BOT_TOKEN) throw new AppError("INTEGRACAO_NAO_CONFIGURADA");
    if (!safeEqual(req.get("x-telegram-bot-api-secret-token") ?? "", secret))
      throw new AppError("PROIBIDO");
    const update = req.body ?? {};
    // Só aceita comandos vindos do chat configurado da equipe.
    const chatOrigem = String(
      update.callback_query?.message?.chat?.id ?? update.message?.chat?.id ?? "",
    );
    if (ctx.cfg.TELEGRAM_CHAT_ID && chatOrigem !== String(ctx.cfg.TELEGRAM_CHAT_ID))
      return res.json({ ok: true, ignorado: true });

    try {
      if (update.callback_query) {
        const cq = update.callback_query;
        const [acao, chamadoId] = String(cq.data ?? "").split(":");
        if (!chamadoId || !UUID_RE.test(chamadoId)) return res.json({ ok: true });
        if (acao === "RESPONDER") {
          pendentes.set(cq.from?.id, { chamadoId, expira: Date.now() + 15 * 60 * 1000 });
          await ctx.telegram.answerCallback(cq.id, "Digite a resposta no chat");
          return res.json({ ok: true });
        }
        const mapa = { ACEITAR: "aceitar", FECHAR: "fechar" } as const;
        const a = mapa[acao as keyof typeof mapa];
        if (!a) return res.json({ ok: true });
        const novo = await ctx.db.tx((q) => acaoSuporte(ctx, q, null, chamadoId, a));
        if (cq.message?.chat?.id && cq.message?.message_id) {
          await ctx.telegram.editKeyboard(
            cq.message.chat.id,
            cq.message.message_id,
            teclado(chamadoId, novo),
          );
        }
        await ctx.telegram.answerCallback(
          cq.id,
          a === "aceitar" ? "Chamado aceito ✅" : "Chamado encerrado 🔒",
        );
        return res.json({ ok: true });
      }
      const msg = update.message;
      if (msg?.text && msg.from?.id) {
        const p = pendentes.get(msg.from.id);
        if (p && p.expira > Date.now()) {
          pendentes.delete(msg.from.id);
          await ctx.db.tx((q) => acaoSuporte(ctx, q, null, p.chamadoId, "responder", msg.text));
        }
      }
    } catch (err) {
      // O Telegram reenvia updates com erro; respondemos 200 e registramos o problema.
      ctx.logger.warn({ err }, "webhook Telegram: atualização não processada");
    }
    return res.json({ ok: true });
  });
  return r;
}
