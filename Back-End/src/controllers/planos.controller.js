// controllers/planos.controller.js
import { supabase } from "../services/supabase.js";

function parseDetalhes(v) {
  // Esta função garante que sempre retornamos um array.
  if (Array.isArray(v)) return v;

  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function mapPlano(p) {
  return {
    id: p.id,
    nome: p.Nome,
    valor: p.valor,
    limites: {
      notas: p.limite_notas,
      clientes: p.limite_clientes,
      produtos: p.limite_produtos,
      servicos: p.limite_servicos,
      contadores: p.limite_contadores,
    },
    detalhes: parseDetalhes(p.detalhes),
    criado_em: p.criado_em,
  };
}

// ✅ GET /planos (público)
export async function listarPlanosPublico(req, res) {
  try {
    const { data, error } = await supabase
      .from("planos")
      .select("*")
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
    console.log("USER ID:", userId);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id_plan")
      .eq("user_id", userId)
      .maybeSingle();

    console.log("PROFILE:", profile);
    console.log("PROFILE ERROR:", profileError);

    const { data: plano, error: planoError } = await supabase
      .from("planos")
      .select("*")
      .eq("id", profile?.id_plan)
      .maybeSingle();

    console.log("ID_PLAN:", profile?.id_plan);
    console.log("PLANO:", plano);
    console.log("PLANO ERROR:", planoError);

    if (profileError) return res.status(500).json({ erro: profileError.message });
    if (!profile?.id_plan) return res.status(404).json({ erro: "Usuário sem plano definido." });
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
  } catch (err) {
    console.error("ERRO meuPlano:", err);
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
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError)
      return res.status(500).json({ erro: profileError.message });

    if (!profile?.id_plan)
      return res.status(404).json({ erro: "Usuário sem plano definido." });

    // 2) lista todos exceto o atual
    const { data, error } = await supabase
      .from("planos")
      .select("*")
      .neq("id", profile.id_plan)
      .order("valor", { ascending: true });

    if (error) return res.status(500).json({ erro: error.message });

    return res.status(200).json({ planos: (data || []).map(mapPlano) });
  } catch {
    return res.status(500).json({ erro: "Erro ao listar planos disponíveis." });
  }
}

// ✅ PUT /planos/meu (privado)
export async function atualizarMeuPlano(req, res) {
  try {
    const userId = req.user?.id;
    console.log("REQ.USER.ID:", userId);
    console.log("BODY:", req.body);

    if (!userId) {
      return res.status(401).json({ erro: "Não autenticado." });
    }

    const { id_plan } = req.body;

    if (!id_plan) {
      return res.status(400).json({ erro: "id_plan é obrigatório." });
    }

    // 1) validar se o plano existe
    const { data: plano, error: planoError } = await supabase
      .from("planos")
      .select("id")
      .eq("id", id_plan)
      .maybeSingle();

    console.log("PLANO ENCONTRADO:", plano);
    console.log("PLANO ERROR:", planoError);

    if (planoError) {
      return res.status(500).json({ erro: planoError.message });
    }

    if (!plano) {
      return res.status(404).json({ erro: "Plano informado não existe." });
    }

    // 2) procurar profile pelo user_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, user_id, id_plan")
      .eq("user_id", userId)
      .maybeSingle();

    console.log("PROFILE ENCONTRADO:", profile);
    console.log("PROFILE ERROR:", profileError);

    if (profileError) {
      return res.status(500).json({ erro: profileError.message });
    }

    if (!profile) {
      return res.status(404).json({
        erro: "Profile não encontrado. O req.user.id não bate com profiles.user_id.",
      });
    }

    // 3) atualizar profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ id_plan })
      .eq("user_id", userId);

    console.log("UPDATE ERROR:", updateError);

    if (updateError) {
      return res.status(500).json({ erro: updateError.message });
    }

    // 4) confirmar alteração
    const { data: atualizado, error: confirmError } = await supabase
      .from("profiles")
      .select("id, user_id, id_plan")
      .eq("user_id", userId)
      .maybeSingle();

    console.log("PROFILE ATUALIZADO:", atualizado);
    console.log("CONFIRM ERROR:", confirmError);

    if (confirmError) {
      return res.status(500).json({ erro: confirmError.message });
    }

    return res.status(200).json({
      ok: true,
      id_plan: atualizado?.id_plan,
      mensagem: "Plano atualizado com sucesso.",
    });
  } catch (err) {
    console.error("ERRO atualizarMeuPlano:", err);
    return res.status(500).json({ erro: "Erro inesperado ao atualizar plano." });
  }
}