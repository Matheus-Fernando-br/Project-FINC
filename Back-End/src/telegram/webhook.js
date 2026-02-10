import { supabase } from "../services/supabase.js";

export async function telegramWebhook(req, res) {

  const msg = req.body.message;
  if (!msg) return res.sendStatus(200);

  const texto = msg.text;

  const protocolo = texto?.match(/#(FINC-\d{4}-\d+)/)?.[1];
  if (!protocolo) return res.sendStatus(200);

  const { data: chamado } = await supabase
    .from("chamados")
    .select("*")
    .eq("protocolo", protocolo)
    .single();

  if (!chamado) return res.sendStatus(200);

  if (texto.startsWith("/aceitar")) {
    await supabase
      .from("chamados")
      .update({ status: "aceito" })
      .eq("id", chamado.id);
  }

  if (texto.startsWith("/fechar")) {
    await supabase
      .from("chamados")
      .update({ status: "fechado" })
      .eq("id", chamado.id);
  }

  if (texto.startsWith("/responder")) {

    const resposta = texto
      .replace(`/responder #${protocolo}`, "")
      .trim();

    await supabase.from("mensagens").insert({
      chamado_id: chamado.id,
      autor: "admin",
      mensagem: resposta
    });
  }

  res.sendStatus(200);
}
