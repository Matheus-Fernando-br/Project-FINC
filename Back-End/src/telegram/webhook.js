// Back-End/src/telegram/webhook.js
import { supabase } from "../services/supabase.js";
import {
  editarTecladoTelegram,
  responderCallbackQuery,
} from "./telegram.js";

/**
 * Guarda "modo responder" por usuário do Telegram:
 * - clicou RESPONDER em um chamado → próximo texto que ele digitar vai para esse chamado
 */
const responderPendenciaPorUsuario = new Map(); // key: telegram_user_id, value: chamadoId

export async function telegramWebhook(req, res) {
  try {
    const update = req.body;

    /* =========================================================
       1) CLIQUE EM BOTÕES (callback_query)
    ========================================================= */
    if (update.callback_query) {
      const cq = update.callback_query;
      const data = cq.data || "";
      const [acao, chamadoId] = data.split(":");

      if (!chamadoId) return res.sendStatus(200);

      const chatId = cq.message?.chat?.id;
      const messageId = cq.message?.message_id;
      const tgUserId = cq.from?.id;

      // Teclados
      const tecladoAguardando = {
        inline_keyboard: [
          [
            { text: "✅ Aceitar", callback_data: `ACEITAR:${chamadoId}` },
            { text: "🔒 Encerrar", callback_data: `FECHAR:${chamadoId}` },
          ],
        ],
      };

      const tecladoAceito = {
        inline_keyboard: [
          [
            { text: "📝 Responder", callback_data: `RESPONDER:${chamadoId}` },
            { text: "🔒 Encerrar", callback_data: `FECHAR:${chamadoId}` },
          ],
        ],
      };

      if (acao === "ACEITAR") {
        await supabase
          .from("chamados")
          .update({ status: "aceito" })
          .eq("id", chamadoId);

        await supabase.from("mensagens").insert({
          chamado_id: chamadoId,
          autor: "admin",
          mensagem: "✅ Chamado aceito pelo atendente.",
        });

        // Troca teclado do card (sem mandar mensagem)
        if (chatId && messageId) {
          await editarTecladoTelegram(chatId, messageId, tecladoAceito);
        }

        // Toast
        await responderCallbackQuery(cq.id, "Chamado aceito ✅");
        return res.sendStatus(200);
      }

      if (acao === "FECHAR") {
        await supabase
          .from("chamados")
          .update({ status: "fechado" })
          .eq("id", chamadoId);

        await supabase.from("mensagens").insert({
          chamado_id: chamadoId,
          autor: "admin",
          mensagem: "🔒 Chamado encerrado pelo atendente.",
        });

        // Remove teclado do card (opcional)
        if (chatId && messageId) {
          await editarTecladoTelegram(chatId, messageId, { inline_keyboard: [] });
        }

        // limpa pendência caso estivesse respondendo esse chamado
        if (tgUserId && responderPendenciaPorUsuario.get(tgUserId) === chamadoId) {
          responderPendenciaPorUsuario.delete(tgUserId);
        }

        await responderCallbackQuery(cq.id, "Chamado encerrado 🔒");
        return res.sendStatus(200);
      }

      if (acao === "RESPONDER") {
        // ativa modo resposta: próximo texto vira resposta no chamado
        if (tgUserId) responderPendenciaPorUsuario.set(tgUserId, chamadoId);

        // Toast curto, sem mensagem brega
        await responderCallbackQuery(cq.id, "Digite sua resposta agora 😉");
        return res.sendStatus(200);
      }

      // default
      await responderCallbackQuery(cq.id, "");
      return res.sendStatus(200);
    }

    /* =========================================================
       2) MENSAGEM DIGITADA NO CHAT DO BOT (message.text)
       - se estiver em modo responder: salva como resposta do chamado
       - senão: mantém comandos /aceitar /fechar /responder (opcional)
    ========================================================= */
    const msg = update.message;
    if (!msg?.text) return res.sendStatus(200);

    const texto = msg.text.trim();
    const tgUserId = msg.from?.id;

    // ✅ Se está em modo "responder", o texto vai pro chamado pendente
    const chamadoIdPend = tgUserId ? responderPendenciaPorUsuario.get(tgUserId) : null;

    if (chamadoIdPend) {
      const { data: chamado } = await supabase
        .from("chamados")
        .select("*")
        .eq("id", chamadoIdPend)
        .single();

      if (chamado && chamado.status !== "fechado") {
        await supabase.from("mensagens").insert({
          chamado_id: chamadoIdPend,
          autor: "admin",
          mensagem: texto,
        });
      }

      // limpa após 1 envio
      if (tgUserId) responderPendenciaPorUsuario.delete(tgUserId);
      return res.sendStatus(200);
    }

    // ====== (Opcional) comandos clássicos ainda funcionam ======
    const parts = texto.split(" ");
    const cmd = parts[0];
    const protocolo = parts[1];

    if (!cmd || !protocolo) return res.sendStatus(200);

    const { data: chamado } = await supabase
      .from("chamados")
      .select("*")
      .eq("protocolo", protocolo)
      .single();

    if (!chamado) return res.sendStatus(200);

    if (cmd === "/aceitar") {
      await supabase.from("chamados").update({ status: "aceito" }).eq("id", chamado.id);

      await supabase.from("mensagens").insert({
        chamado_id: chamado.id,
        autor: "admin",
        mensagem: "✅ Chamado aceito pelo atendente.",
      });

      return res.sendStatus(200);
    }

    if (cmd === "/fechar") {
      await supabase.from("chamados").update({ status: "fechado" }).eq("id", chamado.id);

      await supabase.from("mensagens").insert({
        chamado_id: chamado.id,
        autor: "admin",
        mensagem: "🔒 Chamado encerrado pelo atendente.",
      });

      return res.sendStatus(200);
    }

    if (cmd === "/responder") {
      const resposta = parts.slice(2).join(" ").trim();
      if (!resposta) return res.sendStatus(200);

      await supabase.from("mensagens").insert({
        chamado_id: chamado.id,
        autor: "admin",
        mensagem: resposta,
      });

      return res.sendStatus(200);
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("telegramWebhook error:", err);
    return res.sendStatus(200);
  }
}