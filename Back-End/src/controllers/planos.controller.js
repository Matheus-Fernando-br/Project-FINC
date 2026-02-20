// controllers/planos.controller.js
import { supabase } from "../services/supabase.js";

function mapPlano(p) {
  return {
    id: p.id,
    nome: p.Nome,
    tipo: p.tipo_plano,
    valor: p.valor,
    limites: {
      notas: p.limite_notas,
      clientes: p.limite_clientes,
      produtos: p.limite_produtos,
      servicos: p.limite_servicos,
      contadores: p.limite_contadores,
    },
    detalhes: Array.isArray(p.detalhes) ? p.detalhes : [],
    criado_em: p.criado_em,
  };
}

// ✅ GET /planos (público)
export async function listarPlanosPublico(req, res) {
  try {
    const { data, error } = await supabase
      .from("planos")
      .select("id, Nome, tipo_plano, valor, limite_notas, limite_clientes, limite_produtos, limite_servicos, limite_contadores, detalhes, criado_em")
      .order("valor", { ascending: true });

    if (error) return res.status(500).json({ erro: error.message });

    return res.status(200).json({ planos: (data || []).map(mapPlano) });
  } catch {
    return res.status(500).json({ erro: "Erro ao listar planos." });
  }
}

// ✅ GET /planos/meu (privado)
export async function meuPlano(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ erro: "Não autenticado." });

    // 1) pega id_plan do profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id_plan")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) return res.status(500).json({ erro: profileError.message });
    if (!profile?.id_plan) return res.status(404).json({ erro: "Usuário sem plano definido." });

    // 2) busca plano pelo id
    const { data: plano, error: planoError } = await supabase
      .from("planos")
      .select("id, Nome, tipo_plano, valor, limite_notas, limite_clientes, limite_produtos, limite_servicos, limite_contadores, detalhes, criado_em")
      .eq("id", profile.id_plan)
      .maybeSingle();

    if (planoError) return res.status(500).json({ erro: planoError.message });
    if (!plano) return res.status(404).json({ erro: "Plano do usuário não encontrado." });

    const mapped = mapPlano(plano);

    return res.status(200).json({
      plano: {
        ...mapped,
        descricao:
          mapped.limites.notas == null
            ? "emissões ilimitadas"
            : `até ${mapped.limites.notas} notas/boletos mensais`,
      },
    });
  } catch {
    return res.status(500).json({ erro: "Erro ao buscar plano do usuário." });
  }
}

// ✅ GET /planos/disponiveis (privado)
export async function planosDisponiveis(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ erro: "Não autenticado." });

    // 1) pega id_plan do profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id_plan")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) return res.status(500).json({ erro: profileError.message });
    if (!profile?.id_plan) return res.status(404).json({ erro: "Usuário sem plano definido." });

    // 2) lista todos exceto o atual
    const { data, error } = await supabase
      .from("planos")
      .select("id, Nome, tipo_plano, valor, limite_notas, limite_clientes, limite_produtos, limite_servicos, limite_contadores, detalhes, criado_em")
      .neq("id", profile.id_plan)
      .order("valor", { ascending: true });

    if (error) return res.status(500).json({ erro: error.message });

    return res.status(200).json({ planos: (data || []).map(mapPlano) });
  } catch {
    return res.status(500).json({ erro: "Erro ao listar planos disponíveis." });
  }
}

export async function atualizarMeuPlano(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ erro: "Não autenticado." });

    const { id_plan } = req.body;
    if (!id_plan) return res.status(400).json({ erro: "id_plan é obrigatório." });

    // ✅ valida se o plano existe
    const { data: plano, error: planoError } = await supabase
      .from("planos")
      .select("id")
      .eq("id", id_plan)
      .maybeSingle();

    if (planoError) return res.status(500).json({ erro: planoError.message });
    if (!plano) return res.status(404).json({ erro: "Plano informado não existe." });

    // ✅ atualiza o profile
    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({ id_plan })
      .eq("id", userId)
      .select("id_plan")
      .maybeSingle();

    if (updateError) return res.status(500).json({ erro: updateError.message });
    if (!updated) return res.status(404).json({ erro: "Profile não encontrado." });

    return res.status(200).json({ ok: true, id_plan: updated.id_plan });
  } catch (err) {
    return res.status(500).json({ erro: "Erro inesperado ao atualizar plano." });
  }
}