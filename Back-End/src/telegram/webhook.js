// Back-End/src/telegram/webhook.js
import { supabase } from "../services/supabase.js";
import { enviarTelegram } from "./telegram.js";

export async function telegramWebhook(req, res) {
  try {
    const update = req.body;

    /* =========================================================
       ✅ 1) CLIQUE EM BOTÕES (callback_query)
    ========================================================= */
    if (update.callback_query) {
      const cq = update.callback_query;
      const data = cq.data || ""; // "ACEITAR:<id>" | "FECHAR:<id>"
      const [acao, chamadoId] = data.split(":");

      if (!chamadoId) return res.sendStatus(200);

      if (acao === "ACEITAR") {
        await supabase.from("chamados").update({ status: "aceito" }).eq("id", chamadoId);

        await supabase.from("mensagens").insert({
          chamado_id: chamadoId,
          autor: "admin",
          mensagem: "✅ Chamado aceito pelo atendente.",
        });

        await enviarTelegram(`✅ Chamado aceito (ID: ${chamadoId})`);
      }

      if (acao === "FECHAR") {
        const { data: ch } = await supabase
          .from("chamados")
          .select("protocolo")
          .eq("id", chamadoId)
          .single();

        await supabase.from("chamados").update({ status: "fechado" }).eq("id", chamadoId);

        await supabase.from("mensagens").insert({
          chamado_id: chamadoId,
          autor: "admin",
          mensagem: "🔒 Chamado encerrado pelo atendente.",
        });

        await enviarTelegram(`🔒 Chamado ${ch?.protocolo || chamadoId} encerrado`);
      }

      if (acao === "RESPONDER") {
        const { data: ch } = await supabase
          .from("chamados")
          .select("protocolo")
          .eq("id", chamadoId)
          .single();

        await enviarTelegram(
          `✍️ Responda este chamado (ID: ${chamadoId} | PROTOCOLO: ${ch?.protocolo || "?"})...`
          ,{
            reply_markup: { force_reply: true },
          }
        );
      }

      return res.sendStatus(200);
    }

    /* =========================================================
       ✅ 2) MENSAGEM DIGITADA NO CHAT DO BOT (message.text)
       formatos:
       /aceitar 123456
       /fechar 123456
       /responder 123456 texto aqui
    ========================================================= */
    const msg = update.message;
    if (!msg?.text) return res.sendStatus(200);

    const texto = msg.text.trim();
    // ✅ Resposta via "Force Reply" (clicou RESPONDER e respondeu a msg do bot)
    if (msg.reply_to_message?.text) {
      const base = msg.reply_to_message.text;

      const match = base.match(/PROTOCOLO:\s*(\d{4,10})/i);
      const protocoloReply = match?.[1];

      if (protocoloReply) {
        const { data: chamado } = await supabase
          .from("chamados")
          .select("*")
          .eq("protocolo", protocoloReply)
          .single();

        if (chamado && chamado.status !== "fechado") {
          await supabase.from("mensagens").insert({
            chamado_id: chamado.id,
            autor: "admin",
            mensagem: texto,
          });

          await enviarTelegram(`✅ Resposta enviada no chamado ${protocoloReply}`);
        }

        return res.sendStatus(200);
      }
    }
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

      await enviarTelegram(`✅ Chamado ${protocolo} aceito`);
    }

    if (cmd === "/fechar") {
      await supabase.from("chamados").update({ status: "fechado" }).eq("id", chamado.id);

      await supabase.from("mensagens").insert({
        chamado_id: chamado.id,
        autor: "admin",
        mensagem: "🔒 Chamado encerrado pelo atendente.",
      });

      await enviarTelegram(`🔒 Chamado ${protocolo} encerrado`);
    }

    if (cmd === "/responder") {
      const resposta = parts.slice(2).join(" ").trim();
      if (!resposta) return res.sendStatus(200);

      await supabase.from("mensagens").insert({
        chamado_id: chamado.id,
        autor: "admin",
        mensagem: resposta,
      });

      await enviarTelegram(`💬 Resposta enviada no chamado ${protocolo}`);
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("telegramWebhook error:", err);
    return res.sendStatus(200);
  }
}