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
`Novo chamado #${protocolo}

Usuário: ${user.nome}
Email: ${user.email}

Use:
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

    const { data: chamado } = await supabase
      .from("chamados")
      .select("status")
      .eq("id", chamado_id)
      .single();

    if (chamado?.status === "fechado") {
      return res.status(400).json({ erro: "Chamado encerrado" });
    }

    await supabase.from("mensagens").insert({
      chamado_id,
      autor: "user",
      mensagem
    });

    res.sendStatus(200);

  } catch {
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


