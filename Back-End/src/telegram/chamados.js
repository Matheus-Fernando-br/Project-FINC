import { supabase } from "../services/supabase.js";
import { enviarTelegram } from "./telegram.js";

/* ================= */
/* CRIAR CHAMADO */
/* ================= */
export async function criarChamado(req, res) {

  try {

    const { assunto, categoria, mensagem, user } = req.body;

    const protocolo =
      "FINC-" +
      new Date().getFullYear() +
      "-" +
      String(Math.floor(Math.random() * 9999)).padStart(4, "0");

    const { data, error } = await supabase
      .from("chamados")
      .insert({
        protocolo,
        user_id: user.id,
        assunto,
        categoria,
        mensagem_inicial: mensagem,
        status: "aguardando"
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from("mensagens").insert({
      chamado_id: data.id,
      autor: "user",
      mensagem
    });

    await enviarTelegram(
`🆕 Novo chamado ${protocolo}

👤 Usuário: ${user.nome}
📧 Email: ${user.email}

📂 Categoria: ${categoria}
📌 Assunto: ${assunto}

💬 Mensagem inicial:
${mensagem}

──────────────
Comandos:
/aceitar #${protocolo}
/responder #${protocolo} mensagem
/fechar #${protocolo}`
);

    res.json(data);

  } catch (err) {
    console.log(err);
    res.status(500).json({ erro: "Erro ao criar chamado" });
  }
}


/* ================= */
/* ENVIAR MENSAGEM */
/* ================= */
export async function enviarMensagem(req, res) {

  try {

    const { chamado_id, mensagem } = req.body;

    /* ===== BUSCAR CHAMADO ===== */
    const { data: chamado } = await supabase
      .from("chamados")
      .select("*")
      .eq("id", chamado_id)
      .single();

    if (!chamado) {
      return res.status(404).json({ erro: "Chamado não encontrado" });
    }

    if (chamado.status === "fechado") {
      return res.status(400).json({ erro: "Chamado encerrado" });
    }

    /* ===== SALVAR MENSAGEM ===== */
    await supabase.from("mensagens").insert({
      chamado_id,
      autor: "user",
      mensagem
    });

    /* ===== BUSCAR USUÁRIO ===== */
    const { data: usuario } = await supabase
      .from("users")
      .select("*")
      .eq("id", chamado.user_id)
      .single();

    /* ===== ENVIAR TELEGRAM ===== */
    await enviarTelegram(
`📩 Nova mensagem no chamado ${chamado.protocolo}

👤 Usuário: ${usuario?.nome || "Desconhecido"}
📧 Email: ${usuario?.email || "-"}

📂 Categoria: ${chamado.categoria}
📌 Assunto: ${chamado.assunto}

💬 Mensagem:
${mensagem}

──────────────
Comandos:
/responder #${chamado.protocolo} mensagem
/fechar #${chamado.protocolo}`
    );

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
    .order("created_at", { ascending: true });

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

    await supabase
      .from("chamados")
      .update({ status: "fechado" })
      .eq("id", id);

    res.json({ ok: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao encerrar chamado" });
  }
}

