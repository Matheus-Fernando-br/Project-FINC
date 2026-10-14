import { Router } from "express";
import {
  PREFERENCIAS_PADRAO,
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  onlyDigits,
  registerSchema,
  resetPasswordSchema,
} from "@finc/shared";
import type { AppContext } from "../context.js";
import { AppError, parse } from "../http/errors.js";
import { createLimiters } from "../middleware/rateLimit.js";
import {
  criarSessao,
  csrfTokenFor,
  limparCookieSessao,
  requireAuth,
  uid,
} from "../middleware/auth.js";
import { DUMMY_HASH, hashPassword, verifyPassword } from "../security/password.js";
import { randomToken, sha256 } from "../security/tokens.js";
import { audit } from "../services/audit.js";
import { escapeHtml } from "../services/email.js";
import { notificar } from "../services/notificacoes.js";
import { planoDoUsuario } from "../services/planos.js";

const MAX_FALHAS = 5;
const BLOQUEIO_MIN = 15;

export function authRoutes(ctx: AppContext, limiters: ReturnType<typeof createLimiters>) {
  const r = Router();
  const { db } = ctx;
  const auth = requireAuth(ctx);

  r.post("/cadastro", limiters.cadastro, async (req, res) => {
    const input = parse(registerSchema, req.body);
    const senhaHash = await hashPassword(input.senha);
    const userId = await db.tx(async (q) => {
      const dup = await q.query<{ email: string; cpf_cnpj: string }>(
        "SELECT email, cpf_cnpj FROM usuarios WHERE email = $1 OR cpf_cnpj = $2",
        [input.email, input.cpf_cnpj],
      );
      if (dup.rows.some((d) => d.cpf_cnpj === input.cpf_cnpj))
        throw new AppError("CONFLITO", "CPF/CNPJ já cadastrado.");
      if (dup.rows.length) throw new AppError("CONFLITO", "E-mail já cadastrado.");
      const plano = await q.query<{ id: string; valor: number }>(
        "SELECT id, valor FROM planos WHERE codigo = 'basico'",
      );
      if (!plano.rows[0])
        throw new AppError("INTERNO", "Planos não configurados. Execute as migrações.");
      const { rows } = await q.query<{ id: string }>(
        `INSERT INTO usuarios (email, senha_hash, nome, tipo_pessoa, cpf_cnpj, telefone, plano_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          input.email,
          senhaHash,
          input.nome,
          input.tipo_pessoa,
          input.cpf_cnpj,
          input.telefone,
          plano.rows[0].id,
        ],
      );
      const id = rows[0]!.id;
      await q.query("INSERT INTO config_fiscal (usuario_id) VALUES ($1)", [id]);
      await q.query("INSERT INTO preferencias (usuario_id, dados) VALUES ($1, $2)", [
        id,
        JSON.stringify(PREFERENCIAS_PADRAO),
      ]);
      await q.query(
        "INSERT INTO assinaturas (usuario_id, plano_id, valor, observacao) VALUES ($1, $2, $3, $4)",
        [id, plano.rows[0].id, plano.rows[0].valor, "Plano inicial no cadastro"],
      );
      await notificar(ctx, q, id, {
        tipo: "sistema",
        titulo: "Bem-vindo(a) à FINC!",
        mensagem: "Complete seus dados em Meus Dados para emitir seu primeiro documento fiscal.",
        link: "/meus-dados",
      });
      await audit(q, req, id, "usuario.cadastro", "usuario", id);
      return id;
    });
    const sessao = await criarSessao(ctx, req, res, userId);
    res.status(201).json({ ok: true, csrfToken: sessao.csrfToken });
  });

  r.post("/login", limiters.login, async (req, res) => {
    const { login, senha } = parse(loginSchema, req.body);
    // Login por e-mail ou CPF/CNPJ (funcionalidade preservada da FINC original).
    const porEmail = login.includes("@");
    const { rows } = await db.query<{
      id: string;
      senha_hash: string;
      bloqueado_ate: Date | null;
      falhas_login: number;
    }>(
      `SELECT id, senha_hash, bloqueado_ate, falhas_login FROM usuarios WHERE ${porEmail ? "email = $1" : "cpf_cnpj = $1"}`,
      [porEmail ? login.toLowerCase() : onlyDigits(login)],
    );
    const u = rows[0];
    const ok = await verifyPassword(senha, u?.senha_hash ?? DUMMY_HASH);
    if (u?.bloqueado_ate && new Date(u.bloqueado_ate) > new Date()) {
      throw new AppError(
        "MUITAS_REQUISICOES",
        `Conta bloqueada temporariamente por excesso de tentativas. Tente em ${BLOQUEIO_MIN} minutos.`,
      );
    }
    if (!u || !ok) {
      if (u) {
        const falhas = u.falhas_login + 1;
        const bloquear = falhas >= MAX_FALHAS;
        await db.query(
          `UPDATE usuarios SET falhas_login = $2,
             bloqueado_ate = CASE WHEN $3 THEN now() + make_interval(mins => $4) ELSE NULL END WHERE id = $1`,
          [u.id, bloquear ? 0 : falhas, bloquear, BLOQUEIO_MIN],
        );
        await audit(db, req, u.id, "auth.login_falhou");
      }
      throw new AppError("CREDENCIAIS_INVALIDAS");
    }
    await db.query(
      "UPDATE usuarios SET falhas_login = 0, bloqueado_ate = NULL, ultimo_login_em = now() WHERE id = $1",
      [u.id],
    );
    const sessao = await criarSessao(ctx, req, res, u.id);
    await audit(db, req, u.id, "auth.login");
    res.json({ ok: true, csrfToken: sessao.csrfToken });
  });

  r.post("/logout", auth, async (req, res) => {
    await db.query("UPDATE sessoes SET revogada_em = now() WHERE id = $1", [req.auth!.sessionId]);
    await audit(db, req, uid(req), "auth.logout");
    limparCookieSessao(ctx, res);
    res.json({ ok: true });
  });

  r.get("/me", auth, async (req, res) => {
    const plano = await planoDoUsuario(db, uid(req));
    res.json({
      usuario: {
        id: req.auth!.userId,
        nome: req.auth!.nome,
        email: req.auth!.email,
        papel: req.auth!.papel,
        plano,
      },
      csrfToken: csrfTokenFor(ctx, req.auth!.sessionId),
    });
  });

  r.post("/esqueci-senha", limiters.senha, async (req, res) => {
    const { email } = parse(forgotPasswordSchema, req.body);
    const { rows } = await db.query<{ id: string; nome: string }>(
      "SELECT id, nome FROM usuarios WHERE email = $1",
      [email],
    );
    const u = rows[0];
    if (u) {
      const token = randomToken(32);
      await db.query(
        "UPDATE tokens_redefinicao SET usado_em = now() WHERE usuario_id = $1 AND usado_em IS NULL",
        [u.id],
      );
      await db.query(
        "INSERT INTO tokens_redefinicao (usuario_id, token_hash, expira_em) VALUES ($1, $2, now() + interval '1 hour')",
        [u.id, sha256(token)],
      );
      const link = `${ctx.cfg.APP_URL}/redefinir-senha?token=${encodeURIComponent(token)}`;
      if (ctx.mailer.enabled) {
        await ctx.mailer
          .send({
            to: email,
            subject: "FINC — Redefinição de senha",
            text: `Olá, ${u.nome}!\n\nPara redefinir sua senha acesse (válido por 1 hora):\n${link}\n\nSe não foi você, ignore este e-mail.`,
            html: `<p>Olá, ${escapeHtml(u.nome)}!</p><p>Para redefinir sua senha clique no link abaixo (válido por 1 hora):</p><p><a href="${escapeHtml(link)}">Redefinir senha</a></p><p>Se não foi você, ignore este e-mail.</p>`,
          })
          .catch((err) => ctx.logger.error({ err }, "falha ao enviar e-mail de redefinição"));
      } else if (ctx.cfg.NODE_ENV !== "production") {
        // Sem SMTP em desenvolvimento: o link aparece no log do servidor (documentado no README).
        ctx.logger.warn(
          { link },
          "SMTP não configurado — link de redefinição de senha (apenas desenvolvimento)",
        );
      } else {
        ctx.logger.error(
          "SMTP não configurado: não foi possível enviar o e-mail de redefinição de senha",
        );
      }
      await audit(db, req, u.id, "auth.redefinicao_solicitada");
    }
    // Resposta idêntica exista ou não o e-mail (evita enumeração de contas).
    res.json({
      ok: true,
      message: "Se o e-mail estiver cadastrado, você receberá as instruções em instantes.",
    });
  });

  r.post("/redefinir-senha", limiters.senha, async (req, res) => {
    const { token, senha } = parse(resetPasswordSchema, req.body);
    const senhaHash = await hashPassword(senha);
    await db.tx(async (q) => {
      const { rows } = await q.query<{ id: string; usuario_id: string }>(
        "SELECT id, usuario_id FROM tokens_redefinicao WHERE token_hash = $1 AND usado_em IS NULL AND expira_em > now() FOR UPDATE",
        [sha256(token)],
      );
      const t = rows[0];
      if (!t)
        throw new AppError(
          "REGRA_NEGOCIO",
          "Link de redefinição inválido ou expirado. Solicite um novo.",
        );
      await q.query("UPDATE tokens_redefinicao SET usado_em = now() WHERE id = $1", [t.id]);
      await q.query(
        "UPDATE usuarios SET senha_hash = $2, falhas_login = 0, bloqueado_ate = NULL, atualizado_em = now() WHERE id = $1",
        [t.usuario_id, senhaHash],
      );
      await q.query(
        "UPDATE sessoes SET revogada_em = now() WHERE usuario_id = $1 AND revogada_em IS NULL",
        [t.usuario_id],
      );
      await audit(q, req, t.usuario_id, "auth.senha_redefinida");
    });
    res.json({ ok: true, message: "Senha redefinida. Faça login com a nova senha." });
  });

  r.post("/alterar-senha", auth, limiters.senha, async (req, res) => {
    const { senha_atual, nova_senha } = parse(changePasswordSchema, req.body);
    const { rows } = await db.query<{ senha_hash: string }>(
      "SELECT senha_hash FROM usuarios WHERE id = $1",
      [uid(req)],
    );
    if (!rows[0] || !(await verifyPassword(senha_atual, rows[0].senha_hash))) {
      throw new AppError("VALIDACAO", "Senha atual incorreta.", [
        { campo: "senha_atual", mensagem: "Senha atual incorreta." },
      ]);
    }
    await db.query("UPDATE usuarios SET senha_hash = $2, atualizado_em = now() WHERE id = $1", [
      uid(req),
      await hashPassword(nova_senha),
    ]);
    // Encerra as demais sessões; mantém a atual.
    await db.query(
      "UPDATE sessoes SET revogada_em = now() WHERE usuario_id = $1 AND id <> $2 AND revogada_em IS NULL",
      [uid(req), req.auth!.sessionId],
    );
    await audit(db, req, uid(req), "auth.senha_alterada");
    res.json({
      ok: true,
      message: "Senha alterada com sucesso. As outras sessões foram encerradas.",
    });
  });

  r.get("/sessoes", auth, async (req, res) => {
    const { rows } = await db.query(
      `SELECT id, ip, user_agent, criado_em, ultimo_uso_em, expira_em, (id = $2) AS atual
         FROM sessoes WHERE usuario_id = $1 AND revogada_em IS NULL AND expira_em > now() ORDER BY ultimo_uso_em DESC`,
      [uid(req), req.auth!.sessionId],
    );
    res.json(rows);
  });

  r.delete("/sessoes/:id", auth, async (req, res) => {
    const { rowCount } = await db.query(
      "UPDATE sessoes SET revogada_em = now() WHERE id = $1 AND usuario_id = $2 AND revogada_em IS NULL",
      [req.params.id, uid(req)],
    );
    if (!rowCount) throw new AppError("NAO_ENCONTRADO", "Sessão não encontrada.");
    await audit(db, req, uid(req), "auth.sessao_revogada", "sessao", String(req.params.id));
    res.json({ ok: true });
  });

  return r;
}
