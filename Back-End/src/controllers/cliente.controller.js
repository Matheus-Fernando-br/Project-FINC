import { supabase } from "../services/supabase.js";

/* LISTAR */
export async function getClientes(req, res) {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("user_id", userId)
      .order("nome", { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
}

/* BUSCAR POR ID */
export async function getClienteById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
}

/* CRIAR */
export async function createCliente(req, res) {
  try {
    const userId = req.user.id;

    const { nome, email, telefone, cpf_cnpj, endereco } = req.body;

    if (!nome) {
      return res.status(400).json({ error: "Nome é obrigatório" });
    }

    const { data, error } = await supabase
      .from("clientes")
      .insert({
        user_id: userId,
        nome,
        email,
        telefone,
        cpf_cnpj,
        endereco
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({
      message: "Cliente criado com sucesso",
      cliente: data
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
}

/* ATUALIZAR */
export async function updateCliente(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { nome, email, telefone, cpf_cnpj, endereco } = req.body;

    const { error } = await supabase
      .from("clientes")
      .update({
        nome,
        email,
        telefone,
        cpf_cnpj,
        endereco
      })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ message: "Cliente atualizado com sucesso" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
}

/* DELETAR */
export async function deleteCliente(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { error } = await supabase
      .from("clientes")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ message: "Cliente deletado com sucesso" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
