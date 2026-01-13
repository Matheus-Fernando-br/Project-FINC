import { supabase } from "../services/supabase.js";

// Listar apenas clientes do usuário logado
export async function getClientes(req, res) {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("user_id", userId)
      .order("social_name", { ascending: true });

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  }
  catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return res.status(500).json({ error: "Erro interno" });
  }
}

// Criar cliente vinculado ao usuário
export async function createCliente(req, res) {
  try {
    const { nome_social, email, cpf_cnpj, telefone, tipo_pessoa, cep, uf, cidade, logradouro, bairro, numero, complemento, whatsapp } = req.body;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from("clientes")
      .insert({
        social_name: nome_social,
        email,
        cpf_cnpj: cpf_cnpj.replace(/\D/g, ""),
        telefone,
        tipo_pessoa,
        cep,
        uf,
        cidade,
        logradouro,
        bairro,
        numero,
        complemento,
        whatsapp,
        user_id: userId
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  } catch(error) {
    console.error("Erro ao criar cliente:", error);
    return res.status(500).json({ error: "Erro interno" });
  }
}

// Excluir cliente
export async function deleteCliente(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { error } = await supabase
      .from("clientes")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ message: "Cliente excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir cliente:", error);
    return res.status(500).json({ error: "Erro interno" });
  }
}

// Atualizar cliente
export async function updateCliente(req, res) {
  try {
    const { id } = req.params;
    const { nome_social, email, cpf_cnpj, telefone, tipo_pessoa, cep, uf, cidade, logradouro, bairro, numero, complemento, whatsapp } = req.body;
    const userId = req.user.id;

    const { error } = await supabase
      .from("clientes")
      .update({ 
        social_name: nome_social, 
        email, 
        cpf_cnpj: cpf_cnpj.replace(/\D/g, ""), 
        telefone,
        tipo_pessoa,
        cep,
        uf,
        cidade,
        logradouro,
        bairro,
        numero,
        complemento,
        whatsapp
      })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ message: "Cliente atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    return res.status(500).json({ error: "Erro interno" });
  }
}