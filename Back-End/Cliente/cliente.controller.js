import { supabase } from "../services/supabase.js";

// CREATE
export async function criarCliente(req, res) {
  const user = req.user;

  const { nome_social, tipo_pessoa, cpf_cnpj, cep, uf, cidade,
    logradouro, bairro, numero, complemento,
    email, telefone, whatsapp } = req.body;

  const { error } = await supabase
    .from("clientes")
    .insert({
      user_id: user.id,
      nome_social,
      tipo_pessoa,
      cpf_cnpj,
      cep,
      uf,
      cidade,
      logradouro,
      bairro,
      numero,
      complemento,
      email,
      telefone,
      whatsapp
    });

  if (error) return res.status(400).json({ erro: error.message });

  res.status(201).json({ sucesso: true });
}

// READ
export async function listarClientes(req, res) {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ erro: error.message });

  res.json(data);
}

// UPDATE
export async function atualizarCliente(req, res) {
  const { id } = req.params;

  const { error } = await supabase
    .from("clientes")
    .update(req.body)
    .eq("id", id)
    .eq("user_id", req.user.id);

  if (error) return res.status(400).json({ erro: error.message });

  res.json({ sucesso: true });
}

// DELETE
export async function excluirCliente(req, res) {
  const { id } = req.params;

  const { error } = await supabase
    .from("clientes")
    .delete()
    .eq("id", id)
    .eq("user_id", req.user.id);

  if (error) return res.status(400).json({ erro: error.message });

  res.json({ sucesso: true });
}
