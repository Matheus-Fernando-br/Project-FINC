import { supabase } from "../services/supabase.js";

/**
 * GET /planos
 * Lista todos os planos (ex.: Básico, Premium, Black)
 */
export async function listarPlanos(req, res) {
  try {
    const { data, error } = await supabase
      .from("planos") // <- confirme se o nome da tabela é exatamente "planos"
      .select("id, Nome, tipo_plano, valor, limite_notas, limite_clientes, limite_produtos, limite_servicos, limite_contadores, detalhes, criado_em")
      .order("valor", { ascending: true });

    if (error) return res.status(500).json({ erro: error.message });

    // Normaliza o payload pra ficar fácil no front
    const planos = (data || []).map((p) => ({
      id: p.id,
      nome: p.Nome,                 // campo "Nome" no seu schema
      tipo: p.tipo_plano,
      valor: p.valor,
      limites: {
        notas: p.limite_notas,
        clientes: p.limite_clientes,
        produtos: p.limite_produtos,
        servicos: p.limite_servicos,
        contadores: p.limite_contadores,
      },
      detalhes: p.detalhes,         // jsonb (pode ser array, objeto, etc.)
      criado_em: p.criado_em,
    }));

    return res.status(200).json({ planos });
  } catch (err) {
    return res.status(500).json({ erro: "Erro inesperado ao listar planos." });
  }
}

/**
 * GET /planos/:tipo
 * Ex.: /planos/basico  (busca por tipo_plano)
 */
export async function buscarPlanoPorTipo(req, res) {
  try {
    const { tipo } = req.params;

    const { data, error } = await supabase
      .from("planos")
      .select("id, Nome, tipo_plano, valor, limite_notas, limite_clientes, limite_produtos, limite_servicos, limite_contadores, detalhes, criado_em")
      .eq("tipo_plano", tipo)
      .maybeSingle();

    if (error) return res.status(500).json({ erro: error.message });
    if (!data) return res.status(404).json({ erro: "Plano não encontrado." });

    return res.status(200).json({
      plano: {
        id: data.id,
        nome: data.Nome,
        tipo: data.tipo_plano,
        valor: data.valor,
        limites: {
          notas: data.limite_notas,
          clientes: data.limite_clientes,
          produtos: data.limite_produtos,
          servicos: data.limite_servicos,
          contadores: data.limite_contadores,
        },
        detalhes: data.detalhes,
        criado_em: data.criado_em,
      },
    });
  } catch (err) {
    return res.status(500).json({ erro: "Erro inesperado ao buscar plano." });
  }
}

export async function meuPlanoAtual(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ erro: "Não autenticado." });

    // tenta profiles.id = userId
    let { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id_plan")
      .eq("id", userId)
      .maybeSingle();

    // se não achou profile e não deu erro, tenta profiles.user_id = userId
    if (!profile?.id_plan && !profileError) {
      const alt = await supabase
        .from("profiles")
        .select("id_plan")
        .eq("user_id", userId)
        .maybeSingle();

      profile = alt.data || profile;
      profileError = alt.error || profileError;
    }

    if (profileError) return res.status(500).json({ erro: profileError.message });
    if (!profile?.id_plan) return res.status(404).json({ erro: "Usuário sem plano definido." });

    const { data: plano, error: planoError } = await supabase
      .from("planos")
      .select("id, Nome, tipo_plano, valor, limite_notas, detalhes")
      .eq("id", profile.id_plan)
      .maybeSingle();

    if (planoError) return res.status(500).json({ erro: planoError.message });
    if (!plano) return res.status(404).json({ erro: "Plano do usuário não encontrado." });

    return res.status(200).json({
      plano: {
        id: plano.id,
        nome: plano.Nome,
        tipo: plano.tipo_plano,
        valor: plano.valor,
        descricao:
          plano.limite_notas == null
            ? "emissões ilimitadas"
            : `até ${plano.limite_notas} notas/boletos mensais`,
        detalhes: Array.isArray(plano.detalhes) ? plano.detalhes : [],
      },
    });
  } catch (err) {
    return res.status(500).json({ erro: "Erro inesperado ao buscar plano do usuário." });
  }
}