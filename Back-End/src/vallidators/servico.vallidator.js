import { supabase } from "../services/supabase.js";

export async function getServicos(req, res) {
  try {
    const { data, error } = await supabase.from("servicos").select("*").eq("user_id", req.user.id).order("nome", { ascending: true });
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) { return res.status(500).json({ error: "Erro interno" }); }
}

export async function getServicoById(req, res) {
  try {
    const { data, error } = await supabase.from("servicos").select("*").eq("id", req.params.id).eq("user_id", req.user.id).single();
    if (error || !data) return res.status(404).json({ error: "Serviço não encontrado" });
    return res.json(data);
  } catch (err) { return res.status(500).json({ error: "Erro interno" }); }
}

export async function createServico(req, res) {
  try {
    const { data, error } = await supabase.from("servicos").insert([{ ...req.body, user_id: req.user.id }]).select().single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  } catch (err) { return res.status(500).json({ error: "Erro interno" }); }
}

export async function updateServico(req, res) {
  try {
    const { error } = await supabase.from("servicos").update(req.body).eq("id", req.params.id).eq("user_id", req.user.id);
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ message: "Serviço atualizado" });
  } catch (err) { return res.status(500).json({ error: "Erro interno" }); }
}

export async function deleteServico(req, res) {
  try {
    const { error } = await supabase.from("servicos").delete().eq("id", req.params.id).eq("user_id", req.user.id);
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ message: "Serviço deletado" });
  } catch (err) { return res.status(500).json({ error: "Erro interno" }); }
}

export async function importServico(req, res) {
  try {
    const dados = req.body.map(item => ({ ...item, user_id: req.user.id }));
    const { data, error } = await supabase.from("servicos").insert(dados).select();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ message: "Serviços importados!", count: data.length });
  } catch (err) { return res.status(500).json({ error: "Erro na importação" }); }
}