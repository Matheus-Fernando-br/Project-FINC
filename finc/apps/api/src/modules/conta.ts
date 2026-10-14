import { Router } from "express";
import {
  PREFERENCIAS_PADRAO,
  configFiscalSchema,
  isValidCEP,
  onlyDigits,
  perfilSchema,
  preferenciasSchema,
  trocarPlanoSchema,
  type LimitesPlano,
} from "@finc/shared";
import { z } from "zod";
import type { AppContext } from "../context.js";
import { integracoes } from "../config.js";
import { AppError, naoEncontrado, parse, regra } from "../http/errors.js";
import { limparCookieSessao, uid } from "../middleware/auth.js";
import { verifyPassword } from "../security/password.js";
import { audit } from "../services/audit.js";
import { notificar } from "../services/notificacoes.js";
import { mapPlano, planoDoUsuario, usoAtual, type PlanoRow } from "../services/planos.js";
import { UUID_RE } from "./crud.js";

const PERFIL_COLS =
  "id, email, nome, tipo_pessoa, cpf_cnpj, telefone, inscricao_estadual, inscricao_municipal, cep, uf, cidade, logradouro, bairro, numero, complemento, papel, criado_em";

export function perfilRoutes(ctx: AppContext) {
  const r = Router();
  const { db } = ctx;

  r.get("/", async (req, res) => {
    const { rows } = await db.query(`SELECT ${PERFIL_COLS} FROM usuarios WHERE id = $1`, [
      uid(req),
    ]);
    if (!rows[0]) throw naoEncontrado("Perfil");
    res.json(rows[0]);
  });

  // CPF/CNPJ e tipo de pessoa são a identidade fiscal e o login alternativo: não são editáveis pelo perfil.
  r.put("/", async (req, res) => {
    const p = parse(perfilSchema, req.body);
    const { rows } = await db.query(
      `UPDATE usuarios SET nome=$2, telefone=$3, inscricao_estadual=$4, inscricao_municipal=$5, cep=$6, uf=$7, cidade=$8,
         logradouro=$9, bairro=$10, numero=$11, complemento=$12, atualizado_em=now() WHERE id=$1 RETURNING ${PERFIL_COLS}`,
      [
        uid(req),
        p.nome,
        p.telefone,
        p.inscricao_estadual ?? null,
        p.inscricao_municipal ?? null,
        p.cep ?? null,
        p.uf ?? null,
        p.cidade ?? null,
        p.logradouro ?? null,
        p.bairro ?? null,
        p.numero ?? null,
        p.complemento ?? null,
      ],
    );
    await audit(db, req, uid(req), "perfil.atualizar", "usuarios", uid(req));
    res.json(rows[0]);
  });

  return r;
}

export function planosPublicRoutes(ctx: AppContext) {
  const r = Router();
  r.get("/", async (_req, res) => {
    const { rows } = await ctx.db.query<PlanoRow>("SELECT * FROM planos ORDER BY ordem, valor");
    res.json(rows.map(mapPlano));
  });
  return r;
}

const LIMITE_RECURSO: Record<keyof LimitesPlano, string> = {
  clientes: "clientes",
  produtos: "produtos",
  servicos: "serviços",
  contadores: "contadores",
  notas_mes: "documentos emitidos neste mês",
};

export function assinaturaRoutes(ctx: AppContext) {
  const r = Router();
  const { db } = ctx;

  r.get("/", async (req, res) => {
    const [plano, uso, historico, todos] = await Promise.all([
      planoDoUsuario(db, uid(req)),
      usoAtual(db, uid(req)),
      db.query(
        `SELECT a.id, a.valor, a.status, a.inicio, a.fim, a.observacao, p.nome AS plano_nome, p.codigo AS plano_codigo
           FROM assinaturas a JOIN planos p ON p.id = a.plano_id WHERE a.usuario_id = $1 ORDER BY a.inicio DESC`,
        [uid(req)],
      ),
      db.query<PlanoRow>("SELECT * FROM planos ORDER BY ordem, valor"),
    ]);
    res.json({
      plano,
      uso,
      historico: historico.rows,
      disponiveis: todos.rows.map(mapPlano).filter((p) => p.id !== plano.id),
      gatewayPagamento: false,
    });
  });

  /**
   * Troca de plano. Não há gateway de pagamento integrado: a troca é registrada no histórico de
   * assinaturas sem cobrança automática (ver docs/integracoes.md — "Pagamentos").
   */
  r.put("/", async (req, res) => {
    const { plano_codigo } = parse(trocarPlanoSchema, req.body);
    const resultado = await db.tx(async (q) => {
      const atual = await planoDoUsuario(q, uid(req));
      if (atual.codigo === plano_codigo) throw regra("Você já está neste plano.");
      const { rows } = await q.query<PlanoRow>("SELECT * FROM planos WHERE codigo = $1", [
        plano_codigo,
      ]);
      if (!rows[0]) throw naoEncontrado("Plano");
      const novo = mapPlano(rows[0]);
      // Downgrade só é permitido se o uso atual couber nos limites do novo plano.
      const uso = await usoAtual(q, uid(req));
      const excedidos = (Object.keys(novo.limites) as (keyof LimitesPlano)[]).filter((k) => {
        const lim = novo.limites[k];
        return lim !== null && uso[k] > lim;
      });
      if (excedidos.length) {
        throw regra(
          `Não é possível mudar para ${novo.nome}: o uso atual excede o limite de ${excedidos.map((k) => `${LIMITE_RECURSO[k]} (${uso[k]}/${novo.limites[k]})`).join(", ")}.`,
          { excedidos },
        );
      }
      await q.query(
        "UPDATE assinaturas SET status='encerrada', fim=now() WHERE usuario_id=$1 AND status='ativa'",
        [uid(req)],
      );
      await q.query(
        "INSERT INTO assinaturas (usuario_id, plano_id, valor, observacao) VALUES ($1,$2,$3,$4)",
        [uid(req), novo.id, novo.valor, `Troca de ${atual.nome} para ${novo.nome}`],
      );
      await q.query("UPDATE usuarios SET plano_id=$2, atualizado_em=now() WHERE id=$1", [
        uid(req),
        novo.id,
      ]);
      await notificar(ctx, q, uid(req), {
        tipo: "plano",
        titulo: `Plano alterado para ${novo.nome}`,
        mensagem: `Seu plano foi alterado de ${atual.nome} para ${novo.nome}.`,
        link: "/planos",
      });
      await audit(q, req, uid(req), "plano.trocar", "planos", novo.id, {
        de: atual.codigo,
        para: novo.codigo,
      });
      return novo;
    });
    res.json({ ok: true, plano: resultado });
  });
  return r;
}

export function configRoutes(ctx: AppContext) {
  const r = Router();
  const { db } = ctx;

  r.get("/fiscal", async (req, res) => {
    const { rows } = await db.query("SELECT * FROM config_fiscal WHERE usuario_id = $1", [
      uid(req),
    ]);
    res.json(rows[0]);
  });

  r.put("/fiscal", async (req, res) => {
    const c = parse(configFiscalSchema, req.body);
    const { rows } = await db.query(
      `UPDATE config_fiscal SET ambiente=$2, tipo_emissao=$3, natureza_operacao=$4, cfop_padrao=$5, serie=$6, proximo_numero=$7,
         numeracao_automatica=$8, regime_tributario=$9, somar_impostos=$10, atualizado_em=now() WHERE usuario_id=$1 RETURNING *`,
      [
        uid(req),
        c.ambiente,
        c.tipo_emissao,
        c.natureza_operacao ?? null,
        c.cfop_padrao ?? null,
        c.serie,
        c.proximo_numero,
        c.numeracao_automatica,
        c.regime_tributario,
        c.somar_impostos,
      ],
    );
    await audit(db, req, uid(req), "config.fiscal", "config_fiscal", uid(req));
    res.json(rows[0]);
  });

  r.get("/preferencias", async (req, res) => {
    const { rows } = await db.query<{ dados: Record<string, unknown> }>(
      "SELECT dados FROM preferencias WHERE usuario_id = $1",
      [uid(req)],
    );
    res.json({ ...PREFERENCIAS_PADRAO, ...(rows[0]?.dados ?? {}) });
  });

  r.put("/preferencias", async (req, res) => {
    const p = parse(preferenciasSchema, req.body);
    await db.query(
      `INSERT INTO preferencias (usuario_id, dados) VALUES ($1, $2)
       ON CONFLICT (usuario_id) DO UPDATE SET dados = EXCLUDED.dados, atualizado_em = now()`,
      [uid(req), JSON.stringify(p)],
    );
    res.json(p);
  });
  return r;
}

export function notificacoesRoutes(ctx: AppContext) {
  const r = Router();
  const { db } = ctx;

  r.get("/", async (req, res) => {
    const somenteNaoLidas = req.query.nao_lidas === "1";
    const { rows } = await db.query(
      `SELECT * FROM notificacoes WHERE usuario_id = $1 ${somenteNaoLidas ? "AND lida_em IS NULL" : ""} ORDER BY criado_em DESC LIMIT 100`,
      [uid(req)],
    );
    const naoLidas = await db.query<{ n: number }>(
      "SELECT count(*)::int AS n FROM notificacoes WHERE usuario_id = $1 AND lida_em IS NULL",
      [uid(req)],
    );
    res.json({ items: rows, naoLidas: naoLidas.rows[0]?.n ?? 0 });
  });

  r.post("/lidas", async (req, res) => {
    await db.query(
      "UPDATE notificacoes SET lida_em = now() WHERE usuario_id = $1 AND lida_em IS NULL",
      [uid(req)],
    );
    res.json({ ok: true });
  });

  r.post("/:id/lida", async (req, res) => {
    if (!UUID_RE.test(req.params.id)) throw naoEncontrado("Notificação");
    const { rowCount } = await db.query(
      "UPDATE notificacoes SET lida_em = COALESCE(lida_em, now()) WHERE id = $1 AND usuario_id = $2",
      [req.params.id, uid(req)],
    );
    if (!rowCount) throw naoEncontrado("Notificação");
    res.json({ ok: true });
  });

  r.delete("/:id", async (req, res) => {
    if (!UUID_RE.test(req.params.id)) throw naoEncontrado("Notificação");
    const { rowCount } = await db.query(
      "DELETE FROM notificacoes WHERE id = $1 AND usuario_id = $2",
      [req.params.id, uid(req)],
    );
    if (!rowCount) throw naoEncontrado("Notificação");
    res.json({ ok: true });
  });

  /** Canais realmente suportados e seu estado de configuração (sem dados simulados). */
  r.get("/canais", async (req, res) => {
    const integ = integracoes(ctx.cfg);
    const { rows } = await db.query<{ dados: Record<string, unknown> }>(
      "SELECT dados FROM preferencias WHERE usuario_id = $1",
      [uid(req)],
    );
    res.json({
      interno: { disponivel: true, ativo: true },
      email: {
        disponivel: integ.smtp,
        ativo: Boolean(rows[0]?.dados?.notificar_email ?? true),
        destino: req.auth!.email,
      },
    });
  });

  r.post("/canais/email/teste", async (req, res) => {
    if (!ctx.mailer.enabled)
      throw new AppError("INTEGRACAO_NAO_CONFIGURADA", "SMTP não configurado no servidor.");
    try {
      await ctx.mailer.send({
        to: req.auth!.email,
        subject: "FINC — e-mail de teste",
        text: "Este é um e-mail de teste das notificações da FINC. Tudo certo!",
      });
    } catch (err) {
      ctx.logger.error({ err }, "falha no e-mail de teste");
      throw new AppError(
        "INTEGRACAO_FALHOU",
        "Falha ao enviar o e-mail de teste. Verifique a configuração SMTP.",
      );
    }
    res.json({ ok: true, message: `E-mail de teste enviado para ${req.auth!.email}.` });
  });
  return r;
}

/** LGPD: exportação dos dados do titular, trilha de atividades e exclusão da conta. */
export function lgpdRoutes(ctx: AppContext) {
  const r = Router();
  const { db } = ctx;

  r.get("/atividade", async (req, res) => {
    const { rows } = await db.query(
      "SELECT acao, entidade, entidade_id, ip, criado_em FROM auditoria WHERE usuario_id = $1 ORDER BY criado_em DESC LIMIT 100",
      [uid(req)],
    );
    res.json(rows);
  });

  r.get("/exportar", async (req, res) => {
    const id = uid(req);
    const tabelas = [
      "clientes",
      "produtos",
      "servicos",
      "contadores",
      "notas",
      "contas",
      "pedidos",
      "notificacoes",
      "chamados",
      "estoque_movimentos",
      "assinaturas",
    ];
    const dados: Record<string, unknown> = {};
    const perfil = await db.query(`SELECT ${PERFIL_COLS} FROM usuarios WHERE id = $1`, [id]);
    dados.perfil = perfil.rows[0];
    for (const t of tabelas)
      dados[t] = (await db.query(`SELECT * FROM ${t} WHERE usuario_id = $1`, [id])).rows;
    dados.nota_itens = (
      await db.query(
        "SELECT i.* FROM nota_itens i JOIN notas n ON n.id = i.nota_id WHERE n.usuario_id = $1",
        [id],
      )
    ).rows;
    dados.config_fiscal = (
      await db.query("SELECT * FROM config_fiscal WHERE usuario_id = $1", [id])
    ).rows[0];
    await audit(db, req, id, "lgpd.exportar");
    res.setHeader("Content-Disposition", 'attachment; filename="finc-meus-dados.json"');
    res.json({ exportado_em: new Date().toISOString(), ...dados });
  });

  r.post("/excluir", async (req, res) => {
    const { senha } = parse(
      z.object({ senha: z.string().min(1), confirmacao: z.literal("EXCLUIR") }),
      req.body,
    );
    const { rows } = await db.query<{ senha_hash: string }>(
      "SELECT senha_hash FROM usuarios WHERE id = $1",
      [uid(req)],
    );
    if (!rows[0] || !(await verifyPassword(senha, rows[0].senha_hash)))
      throw new AppError("VALIDACAO", "Senha incorreta.");
    await db.query("DELETE FROM usuarios WHERE id = $1", [uid(req)]);
    limparCookieSessao(ctx, res);
    res.json({ ok: true });
  });
  return r;
}

export function utilRoutes(ctx: AppContext) {
  const r = Router();
  /** Consulta de CEP no servidor (ViaCEP) — evita CORS e centraliza timeout/tratamento de erro. */
  r.get("/cep/:cep", async (req, res) => {
    const cep = onlyDigits(req.params.cep);
    if (!isValidCEP(cep)) throw new AppError("VALIDACAO", "CEP inválido.");
    let data: Record<string, string>;
    try {
      const resp = await ctx.fetchImpl(`${ctx.cfg.VIACEP_URL}/${cep}/json/`, {
        signal: AbortSignal.timeout(6000),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      data = (await resp.json()) as Record<string, string>;
    } catch (err) {
      ctx.logger.warn({ err }, "falha na consulta de CEP");
      throw new AppError(
        "INTEGRACAO_FALHOU",
        "Serviço de CEP indisponível. Preencha o endereço manualmente.",
      );
    }
    if (data.erro) throw new AppError("NAO_ENCONTRADO", "CEP não encontrado.");
    res.json({
      cep,
      uf: data.uf,
      cidade: data.localidade,
      logradouro: data.logradouro,
      bairro: data.bairro,
      complemento: data.complemento,
    });
  });
  return r;
}

export function healthRoutes(ctx: AppContext) {
  const r = Router();
  r.get("/", async (_req, res) => {
    let banco = false;
    try {
      await ctx.db.query("SELECT 1");
      banco = true;
    } catch (err) {
      ctx.logger.error({ err }, "health: banco indisponível");
    }
    res.status(banco ? 200 : 503).json({
      status: banco ? "ok" : "degradado",
      versao: "2.0.0",
      banco: { ok: banco, tipo: ctx.db.kind },
      integracoes: integracoes(ctx.cfg),
      horario: new Date().toISOString(),
    });
  });
  return r;
}
