// Back-End/src/telegram/chamados.js
import { supabase } from "../services/supabase.js";
import { enviarTelegram } from "./telegram.js";

/* ================= */
/* CRIAR CHAMADO */
/* ================= */
export async function criarChamado(req, res) {
  try {
    const { categoria, assunto, mensagem, user } = req.body;

    /* ===== GERAR PROTOCOLO ===== */
    const protocolo = Math.floor(100000 + Math.random() * 900000).toString();

    /* ===== CRIAR CHAMADO ===== */
    const { data: chamado, error: erroChamado } = await supabase
      .from("chamados")
      .insert({
        protocolo,
        user_id: user.id,
        categoria,
        assunto,
      })
      .select()
      .single();

    if (erroChamado) {
      console.error(erroChamado);
      return res.status(500).json(erroChamado);
    }

    /* ===== CRIAR PRIMEIRA MENSAGEM ===== */
    const { error: erroMsg } = await supabase.from("mensagens").insert({
      chamado_id: chamado.id,
      autor: "cliente",
      mensagem,
    });

    if (erroMsg) {
      console.error(erroMsg);
      return res.status(500).json(erroMsg);
    }

    res.json(chamado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: err.message });
  }

  /* ===== BUSCAR USER (pra mostrar nome/email) ===== */
const { data: usuario } = await supabase
  .from("users")
  .select("*")
  .eq("id", user.id)
  .single();

/* ===== TELEGRAM: NOVO CHAMADO (COM BOTÕES) ===== */
try {
  const textoTelegram = `🆕 Novo chamado aberto!

🧾 Protocolo: ${chamado.protocolo}
👤 Usuário: ${usuario?.nome || "Desconhecido"}
📧 Email: ${usuario?.email || "-"}

📂 Categoria: ${categoria}
📌 Assunto: ${assunto}

💬 Primeira mensagem:
${mensagem}

➡️ Para responder pelo Telegram:
 /responder ${chamado.protocolo} sua resposta aqui`;

  await enviarTelegram(textoTelegram, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ Aceitar", callback_data: `ACEITAR:${chamado.id}` },
          { text: "🔒 Encerrar", callback_data: `FECHAR:${chamado.id}` },
        ],
      ],
    },
  });
} catch (e) {
  console.error("Telegram erro (novo chamado):", e);
}
}

/* ================= */
/* ENVIAR MENSAGEM */
/* ================= */
export async function enviarMensagem(req, res) {
  try {
    const { chamado_id, mensagem } = req.body;

    const { data: chamado } = await supabase
      .from("chamados")
      .select("*")
      .eq("id", chamado_id)
      .single();

    if (!chamado) return res.status(404).json({ erro: "Chamado não encontrado" });

    if (chamado.status === "fechado")
      return res.status(400).json({ erro: "Chamado encerrado" });

    /* SALVAR */
    const { error } = await supabase.from("mensagens").insert({
      chamado_id,
      autor: "cliente",
      mensagem,
    });

    if (error) return res.status(500).json(error);

    /* BUSCAR USER */
    const { data: usuario } = await supabase
      .from("users")
      .select("*")
      .eq("id", chamado.user_id)
      .single();

    /* TELEGRAM (COM BOTÕES) */
    try {
      const textoTelegram = `📩 Nova mensagem no chamado #${chamado.protocolo}

👤 Usuário: ${usuario?.nome || "Desconhecido"}
📧 Email: ${usuario?.email || "-"}

📂 Categoria: ${chamado.categoria}
📌 Assunto: ${chamado.assunto}

💬 Mensagem:
${mensagem}`;

      await enviarTelegram(textoTelegram, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ Aceitar", callback_data: `ACEITAR:${chamado.id}` },
              { text: "🔒 Encerrar", callback_data: `FECHAR:${chamado.id}` },
            ],
          ],
        },
      });
    } catch (e) {
      console.error("Telegram erro:", e);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao enviar mensagem" });
  }
}

/* ================= */
/* LISTAR MENSAGENS */
/* ================= */
export async function listarMensagens(req, res) {
  const { chamado_id } = req.params;

  const { data } = await supabase
    .from("mensagens")
    .select("*")
    .eq("chamado_id", chamado_id)
    .order("criado_em", { ascending: true });

  res.json(data || []);
}

export async function buscarChamado(req, res) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("chamados")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ erro: "Chamado não encontrado" });
    }

    res.json(data);
  } catch {
    res.status(500).json({ erro: "Erro ao buscar chamado" });
  }
}

/* ================= */
/* ENCERRAR CHAMADOS */
/* ================= */
export async function encerrarChamado(req, res) {
  try {
    const { id } = req.params;

    const { data } = await supabase
      .from("chamados")
      .select("*")
      .eq("id", id)
      .single();

    if (!data) {
      return res.status(404).json({ erro: "Chamado não encontrado" });
    }

    if (data.status === "fechado") {
      return res.json({ ok: true });
    }

    await supabase.from("chamados").update({ status: "fechado" }).eq("id", id);

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao encerrar chamado" });
  }
}