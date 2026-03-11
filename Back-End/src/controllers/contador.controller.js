import { supabase } from "../services/supabase.js";

export async function listarContadores(req, res) {
  try {
    const profileId = req.user?.id;

    const { data, error } = await supabase
      .from("contadores")
      .select("*")
      .eq("profile_id", profileId)
      .order("criado_em", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json(data || []);
  } catch (err) {
    console.error("Erro listarContadores:", err);
    return res.status(500).json({ error: "Erro ao listar contadores" });
  }
}

export async function criarContador(req, res) {
  try {
    const profileId = req.user?.id;
    const { nome, email, cpf, telefone } = req.body;

    if (!nome?.trim() || !email?.trim()) {
      return res.status(400).json({
        error: "Nome e e-mail são obrigatórios",
      });
    }

    const { data, error } = await supabase
      .from("contadores")
      .insert([
        {
          profile_id: profileId,
          nome: nome.trim(),
          email: email.trim(),
          cpf: cpf?.trim() || null,
          telefone: telefone?.trim() || null,
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error("Erro criarContador:", err);
    return res.status(500).json({ error: "Erro ao criar contador" });
  }
}

export async function editarContador(req, res) {
  try {
    const profileId = req.user?.id;
    const { id } = req.params;
    const { nome, email, cpf, telefone } = req.body;

    if (!nome?.trim() || !email?.trim()) {
      return res.status(400).json({
        error: "Nome e e-mail são obrigatórios",
      });
    }

    const { data, error } = await supabase
      .from("contadores")
      .update({
        nome: nome.trim(),
        email: email.trim(),
        cpf: cpf?.trim() || null,
        telefone: telefone?.trim() || null,
      })
      .eq("id", id)
      .eq("profile_id", profileId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json(data);
  } catch (err) {
    console.error("Erro editarContador:", err);
    return res.status(500).json({ error: "Erro ao editar contador" });
  }
}

export async function excluirContador(req, res) {
  try {
    const profileId = req.user?.id;
    const { id } = req.params;

    const { error } = await supabase
      .from("contadores")
      .delete()
      .eq("id", id)
      .eq("profile_id", profileId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ message: "Contador excluído com sucesso" });
  } catch (err) {
    console.error("Erro excluirContador:", err);
    return res.status(500).json({ error: "Erro ao excluir contador" });
  }
}