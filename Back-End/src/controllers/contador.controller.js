import { supabase } from "../services/supabase";

export async function listarPlanos(req, res) {
  const { data, error } = await supabase
    .from("planos")
    .select("*")
    .order("valor", { ascending: true });

  if (error) return res.status(400).json({ error });

  res.json(data);
}

export async function criarPlano(req, res) {
  const {
    tipo_plano,
    limite_contadores,
    limite_clientes,
    limite_produtos,
    limite_servicos,
    limite_notas,
    valor,
    detalhes
  } = req.body;

  const { data, error } = await supabase
    .from("planos")
    .insert([{
      tipo_plano,
      limite_contadores,
      limite_clientes,
      limite_produtos,
      limite_servicos,
      limite_notas,
      valor,
      detalhes
    }])
    .select()
    .single();

  if (error) return res.status(400).json({ error });

  res.status(201).json(data);
}

export async function atualizarPlano(req, res) {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("planos")
    .update(req.body)
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(400).json({ error });

  res.json(data);
}

export async function deletarPlano(req, res) {
  const { id } = req.params;

  const { error } = await supabase
    .from("planos")
    .delete()
    .eq("id", id);

  if (error) return res.status(400).json({ error });

  res.json({ message: "Plano deletado com sucesso" });
}
