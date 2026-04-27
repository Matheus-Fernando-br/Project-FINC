import { supabase } from "../services/supabase.js";

export async function getProdutos(req, res) {
  try {
    const { data, error } = await supabase.from("produtos").select("*").eq("user_id", req.user.id).order("nome", { ascending: true });
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) { return res.status(500).json({ error: "Erro interno" }); }
}

export async function getProdutoById(req, res) {
  try {
    const { data, error } = await supabase.from("produtos").select("*").eq("id", req.params.id).eq("user_id", req.user.id).single();
    if (error || !data) return res.status(404).json({ error: "Produto não encontrado" });
    return res.json(data);
  } catch (err) { return res.status(500).json({ error: "Erro interno" }); }
}

export async function createProduto(req, res) {
  try {
    const { data, error } = await supabase.from("produtos").insert([{ ...req.body, user_id: req.user.id }]).select().single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  } catch (err) { return res.status(500).json({ error: "Erro interno" }); }
}

export async function updateProduto(req, res) {
  try {
    const { error } = await supabase.from("produtos").update(req.body).eq("id", req.params.id).eq("user_id", req.user.id);
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ message: "Produto atualizado" });
  } catch (err) { return res.status(500).json({ error: "Erro interno" }); }
}

export async function deleteProduto(req, res) {
  try {
    const { error } = await supabase.from("produtos").delete().eq("id", req.params.id).eq("user_id", req.user.id);
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ message: "Produto deletado" });
  } catch (err) { return res.status(500).json({ error: "Erro interno" }); }
}

export async function importProduto(req, res) {
  try {
    const dados = req.body.map(item => ({ ...item, user_id: req.user.id }));
    const { data, error } = await supabase.from("produtos").insert(dados).select();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json({ message: "Produtos importados!", count: data.length });
  } catch (err) { return res.status(500).json({ error: "Erro na importação" }); }
}