import { Router, type Request } from "express";
import {
  calcularTotais,
  cancelarNotaSchema,
  formatBRL,
  notaSchema,
  tipoItemPermitido,
  type NotaInput,
  type TipoNota,
} from "@finc/shared";
import { z } from "zod";
import type { AppContext } from "../context.js";
import type { Queryable } from "../db/index.js";
import { AppError, naoEncontrado, parse, regra } from "../http/errors.js";
import { uid } from "../middleware/auth.js";
import { audit } from "../services/audit.js";
import {
  gerarPdf,
  gerarXml,
  nomeArquivo,
  numeroFormatado,
  type NotaCompleta,
  type Parte,
} from "../services/documentos.js";
import { notificar } from "../services/notificacoes.js";
import { assertLimite } from "../services/planos.js";
import { movimentar } from "./cadastros.js";
import { UUID_RE } from "./crud.js";

interface ItemResolvido {
  ordem: number;
  tipo: "produto" | "servico";
  produto_id: string | null;
  servico_id: string | null;
  descricao: string;
  codigo: string | null;
  categoria: string | null;
  unidade: string | null;
  ncm: string | null;
  cfop: string | null;
  codigo_servico: string | null;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
  icms: number | null;
  pis_cofins: number | null;
  aliquota_iss: number | null;
  info: string | null;
  controla_estoque: boolean;
}

type ItemEntrada = {
  produto_id?: string | null;
  servico_id?: string | null;
  quantidade: number;
  valor_unitario?: number;
  info?: string | null;
};

/** Resolve os itens no catálogo do próprio usuário e aplica a regra NFS-e = serviços / NF-e e NFC-e = produtos. */
export async function resolverItens(
  q: Queryable,
  userId: string,
  tipoNota: TipoNota | null,
  itens: ItemEntrada[],
) {
  const out: ItemResolvido[] = [];
  for (const [idx, it] of itens.entries()) {
    const tipo: "produto" | "servico" = it.produto_id ? "produto" : "servico";
    if (tipoNota && !tipoItemPermitido(tipoNota, tipo)) {
      throw regra(
        tipoNota === "NFS-e"
          ? `Item ${idx + 1}: NFS-e aceita apenas serviços.`
          : `Item ${idx + 1}: ${tipoNota} aceita apenas produtos.`,
      );
    }
    if (tipo === "produto") {
      const { rows } = await q.query<Record<string, never>>(
        "SELECT * FROM produtos WHERE id = $1 AND usuario_id = $2",
        [it.produto_id, userId],
      );
      const p = rows[0] as unknown as Record<string, unknown> | undefined;
      if (!p) throw regra(`Item ${idx + 1}: produto não encontrado.`);
      if (!p.ativo) throw regra(`Item ${idx + 1}: o produto "${p.nome}" está inativo.`);
      const valor = it.valor_unitario ?? Number(p.preco_unitario);
      out.push({
        ordem: idx + 1,
        tipo,
        produto_id: String(p.id),
        servico_id: null,
        descricao: String(p.nome),
        codigo: String(p.sku),
        categoria: (p.categoria as string) ?? null,
        unidade: (p.unidade_medida as string) ?? null,
        ncm: (p.ncm as string) ?? null,
        cfop: (p.cfop as string) ?? null,
        codigo_servico: null,
        quantidade: it.quantidade,
        valor_unitario: valor,
        subtotal: Math.round(it.quantidade * valor * 100) / 100,
        icms: Number(p.icms),
        pis_cofins: Number(p.pis_cofins),
        aliquota_iss: null,
        info: it.info ?? null,
        controla_estoque: Boolean(p.controla_estoque),
      });
    } else {
      const { rows } = await q.query<Record<string, unknown>>(
        "SELECT * FROM servicos WHERE id = $1 AND usuario_id = $2",
        [it.servico_id, userId],
      );
      const s = rows[0];
      if (!s) throw regra(`Item ${idx + 1}: serviço não encontrado.`);
      if (!s.ativo) throw regra(`Item ${idx + 1}: o serviço "${s.nome}" está inativo.`);
      const valor = it.valor_unitario ?? Number(s.preco);
      out.push({
        ordem: idx + 1,
        tipo,
        produto_id: null,
        servico_id: String(s.id),
        descricao: String(s.nome),
        codigo: (s.codigo_interno as string) ?? null,
        categoria: (s.categoria as string) ?? null,
        unidade: (s.unidade_medida as string) ?? null,
        ncm: null,
        cfop: null,
        codigo_servico: (s.codigo_servico as string) ?? null,
        quantidade: it.quantidade,
        valor_unitario: valor,
        subtotal: Math.round(it.quantidade * valor * 100) / 100,
        icms: null,
        pis_cofins: null,
        aliquota_iss: s.aliquota_iss === null ? null : Number(s.aliquota_iss),
        info: it.info ?? null,
        controla_estoque: false,
      });
    }
  }
  return out;
}

const PARTE_COLS = "cpf_cnpj, telefone, cep, uf, cidade, logradouro, bairro, numero, complemento";

async function snapshotEmitente(q: Queryable, userId: string): Promise<Parte> {
  const { rows } = await q.query<Parte & { nome: string; email: string }>(
    `SELECT nome, email, inscricao_estadual, inscricao_municipal, ${PARTE_COLS} FROM usuarios WHERE id = $1`,
    [userId],
  );
  return rows[0]!;
}

async function snapshotDestinatario(
  q: Queryable,
  userId: string,
  clienteId: string | null | undefined,
): Promise<Parte> {
  if (!clienteId) return { nome: "Consumidor final" };
  const { rows } = await q.query<Parte & { nome_social: string }>(
    `SELECT nome_social, email, inscricao_estadual, ${PARTE_COLS} FROM clientes WHERE id = $1 AND usuario_id = $2`,
    [clienteId, userId],
  );
  const c = rows[0];
  if (!c) throw regra("Cliente não encontrado.");
  const { nome_social, ...resto } = c;
  return { nome: nome_social, ...resto };
}

async function configFiscal(q: Queryable, userId: string, lock = false) {
  const { rows } = await q.query<{
    ambiente: string;
    serie: number;
    proximo_numero: number;
    natureza_operacao: string | null;
    somar_impostos: boolean;
  }>(`SELECT * FROM config_fiscal WHERE usuario_id = $1 ${lock ? "FOR UPDATE" : ""}`, [userId]);
  if (!rows[0]) throw new AppError("INTERNO", "Configuração fiscal ausente.");
  return rows[0];
}

/** Grava (cria ou substitui) um rascunho de documento. */
async function salvarRascunho(q: Queryable, userId: string, input: NotaInput, notaId?: string) {
  const cfg = await configFiscal(q, userId);
  const itens = await resolverItens(q, userId, input.tipo, input.itens);
  const totais = calcularTotais(
    itens.map((i) => ({
      tipo: i.tipo,
      quantidade: i.quantidade,
      valorUnitario: i.valor_unitario,
      icms: i.icms,
      pisCofins: i.pis_cofins,
      aliquotaIss: i.aliquota_iss,
    })),
    input.desconto_incondicional ?? 0,
    input.desconto_condicional ?? 0,
    cfg.somar_impostos,
  );
  const emitente = await snapshotEmitente(q, userId);
  const destinatario = await snapshotDestinatario(q, userId, input.cliente_id);
  const transporte = input.tipo === "NFS-e" ? {} : (input.transporte ?? { incluir_frete: false });
  const valores = [
    input.cliente_id ?? null,
    input.tipo,
    cfg.serie,
    cfg.ambiente,
    input.natureza_operacao ?? cfg.natureza_operacao,
    JSON.stringify(emitente),
    JSON.stringify(destinatario),
    JSON.stringify(transporte),
    totais.valorProdutos,
    totais.valorServicos,
    totais.baseIcms,
    totais.valorIcms,
    totais.baseIss,
    totais.valorIss,
    totais.valorPisCofins,
    totais.descontoIncondicional,
    totais.descontoCondicional,
    totais.valorTributos,
    totais.totalNota,
    cfg.somar_impostos,
    input.gerar_financeiro ?? true,
    input.vencimento ?? null,
    input.observacoes ?? null,
  ];
  let id = notaId;
  if (id) {
    await q.query(
      `UPDATE notas SET cliente_id=$3, tipo=$4, serie=$5, ambiente=$6, natureza_operacao=$7, emitente=$8, destinatario=$9,
         transporte=$10, valor_produtos=$11, valor_servicos=$12, base_icms=$13, valor_icms=$14, base_iss=$15, valor_iss=$16,
         valor_pis_cofins=$17, desconto_incondicional=$18, desconto_condicional=$19, valor_tributos=$20, total=$21,
         somar_impostos=$22, gerar_financeiro=$23, vencimento=$24, observacoes=$25, atualizado_em=now()
       WHERE id=$1 AND usuario_id=$2`,
      [id, userId, ...valores],
    );
    await q.query("DELETE FROM nota_itens WHERE nota_id = $1", [id]);
  } else {
    const { rows } = await q.query<{ id: string }>(
      `INSERT INTO notas (usuario_id, cliente_id, tipo, serie, ambiente, natureza_operacao, emitente, destinatario, transporte,
         valor_produtos, valor_servicos, base_icms, valor_icms, base_iss, valor_iss, valor_pis_cofins, desconto_incondicional,
         desconto_condicional, valor_tributos, total, somar_impostos, gerar_financeiro, vencimento, observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24) RETURNING id`,
      [userId, ...valores],
    );
    id = rows[0]!.id;
  }
  for (const i of itens) {
    await q.query(
      `INSERT INTO nota_itens (nota_id, ordem, tipo, produto_id, servico_id, descricao, codigo, categoria, unidade, ncm, cfop,
         codigo_servico, quantidade, valor_unitario, subtotal, icms, pis_cofins, aliquota_iss, info)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
      [
        id,
        i.ordem,
        i.tipo,
        i.produto_id,
        i.servico_id,
        i.descricao,
        i.codigo,
        i.categoria,
        i.unidade,
        i.ncm,
        i.cfop,
        i.codigo_servico,
        i.quantidade,
        i.valor_unitario,
        i.subtotal,
        i.icms,
        i.pis_cofins,
        i.aliquota_iss,
        i.info,
      ],
    );
  }
  await q.query("UPDATE notas SET forma_pagamento = $2 WHERE id = $1", [
    id,
    input.forma_pagamento ?? null,
  ]);
  return id;
}

export function criarRascunho(q: Queryable, userId: string, body: unknown) {
  return salvarRascunho(q, userId, parse(notaSchema, body));
}

async function carregarNota(
  q: Queryable,
  userId: string,
  id: string,
  lock = false,
): Promise<NotaCompleta & Record<string, unknown>> {
  if (!UUID_RE.test(id)) throw naoEncontrado("Documento");
  const { rows } = await q.query<NotaCompleta & Record<string, unknown>>(
    `SELECT * FROM notas WHERE id = $1 AND usuario_id = $2 ${lock ? "FOR UPDATE" : ""}`,
    [id, userId],
  );
  const n = rows[0];
  if (!n) throw naoEncontrado("Documento");
  const itens = await q.query<NotaCompleta["itens"][number]>(
    "SELECT * FROM nota_itens WHERE nota_id = $1 ORDER BY ordem",
    [id],
  );
  n.itens = itens.rows;
  return n;
}

const ENDERECO_OBRIGATORIO: (keyof Parte)[] = ["cep", "uf", "cidade", "logradouro", "numero"];

/** Emissão: numeração sequencial atômica, limite do plano, baixa de estoque e lançamento no financeiro. */
async function emitir(ctx: AppContext, q: Queryable, req: Request, userId: string, notaId: string) {
  const nota = await carregarNota(q, userId, notaId, true);
  if (nota.status !== "rascunho") throw regra("Somente rascunhos podem ser emitidos.");
  if (nota.ambiente === "producao") {
    throw new AppError(
      "INTEGRACAO_NAO_CONFIGURADA",
      "A transmissão em ambiente de produção (SEFAZ/Prefeitura) requer um provedor fiscal homologado e certificado A1. Use o ambiente de homologação ou configure a integração (docs/integracoes.md).",
    );
  }
  // Snapshot do emitente atualizado no momento da emissão.
  const emitente = await snapshotEmitente(q, userId);
  const faltando = ENDERECO_OBRIGATORIO.filter((k) => !emitente[k]);
  if (faltando.length)
    throw regra("Complete o endereço do emitente em Meus Dados antes de emitir.", { faltando });

  await assertLimite(q, userId, "notas_mes");
  const cfg = await configFiscal(q, userId, true);
  let numero = cfg.proximo_numero;
  // Garante unicidade mesmo que a numeração tenha sido reconfigurada para trás.
  const { rows: maxRows } = await q.query<{ max: number | null }>(
    "SELECT max(numero) AS max FROM notas WHERE usuario_id = $1 AND serie = $2",
    [userId, nota.serie],
  );
  if (maxRows[0]?.max && numero <= maxRows[0].max) numero = maxRows[0].max + 1;
  await q.query(
    "UPDATE config_fiscal SET proximo_numero = $2, atualizado_em = now() WHERE usuario_id = $1",
    [userId, numero + 1],
  );
  await q.query(
    "UPDATE notas SET status = 'emitida', numero = $3, data_emissao = now(), emitente = $4, atualizado_em = now() WHERE id = $1 AND usuario_id = $2",
    [notaId, userId, numero, JSON.stringify(emitente)],
  );

  for (const it of nota.itens as unknown as { produto_id: string | null; quantidade: number }[]) {
    if (!it.produto_id) continue;
    const { rows } = await q.query<{ controla_estoque: boolean }>(
      "SELECT controla_estoque FROM produtos WHERE id = $1",
      [it.produto_id],
    );
    if (rows[0]?.controla_estoque) {
      const m = await movimentar(
        q,
        userId,
        it.produto_id,
        "saida",
        Number(it.quantidade),
        `Saída pelo documento ${nota.tipo} nº ${numero}`,
        notaId,
      );
      if (m.abaixoDoMinimo) {
        await notificar(ctx, q, userId, {
          tipo: "estoque",
          titulo: "Estoque baixo",
          mensagem: `O produto "${m.nome}" atingiu o estoque mínimo (saldo: ${m.saldo}).`,
          link: "/estoque",
        });
      }
    }
  }

  if (nota.gerar_financeiro && Number(nota.total) > 0) {
    // Venda com forma de pagamento informada (PDV) entra no financeiro já recebida.
    const pagoNoAto = Boolean(nota.forma_pagamento);
    await q.query(
      `INSERT INTO contas (usuario_id, tipo, descricao, valor, vencimento, categoria, cliente_id, nota_id,
                           status, data_pagamento, forma_pagamento)
       VALUES ($1, 'receber', $2, $3, COALESCE($4::date, CASE WHEN $8 THEN CURRENT_DATE ELSE CURRENT_DATE + 30 END), $5, $6, $7,
               CASE WHEN $8 THEN 'paga' ELSE 'aberta' END, CASE WHEN $8 THEN CURRENT_DATE END, $9)`,
      [
        userId,
        `${nota.tipo} nº ${numero} — ${(nota.destinatario as Parte).nome ?? "cliente"}`,
        nota.total,
        nota.vencimento ?? null,
        nota.tipo === "NFS-e" ? "Serviços prestados" : "Vendas",
        nota.cliente_id,
        notaId,
        pagoNoAto,
        nota.forma_pagamento ?? null,
      ],
    );
  }
  await notificar(ctx, q, userId, {
    tipo: "nota",
    titulo: `${nota.tipo} nº ${numero} emitida`,
    mensagem: `Documento emitido para ${(nota.destinatario as Parte).nome ?? "cliente"} no valor de ${formatBRL(nota.total)}.`,
    link: `/notas/${notaId}`,
  });
  await audit(q, req, userId, "notas.emitir", "notas", notaId, { numero });
}

const listaQuery = z.object({
  status: z.enum(["rascunho", "emitida", "cancelada"]).optional(),
  tipo: z.enum(["NF-e", "NFC-e", "NFS-e"]).optional(),
  de: z.string().date().optional(),
  ate: z.string().date().optional(),
  q: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export function notasRoutes(ctx: AppContext) {
  const r = Router();
  const { db } = ctx;

  r.get("/", async (req, res) => {
    const f = parse(listaQuery, req.query);
    const page = f.page ?? 1;
    const pageSize = f.pageSize ?? 20;
    const params: unknown[] = [uid(req)];
    const conds = ["usuario_id = $1"];
    const add = (sql: string, v: unknown) => {
      params.push(v);
      conds.push(sql.replace("?", `$${params.length}`));
    };
    if (f.status) add("status = ?", f.status);
    if (f.tipo) add("tipo = ?", f.tipo);
    if (f.de) add("COALESCE(data_emissao, criado_em) >= ?::date", f.de);
    if (f.ate) add("COALESCE(data_emissao, criado_em) < (?::date + 1)", f.ate);
    if (f.q) {
      params.push(`%${f.q}%`, f.q.replace(/\D/g, ""));
      const a = params.length - 1;
      conds.push(
        `(destinatario->>'nome' ILIKE $${a} OR destinatario->>'cpf_cnpj' = NULLIF($${a + 1}, '') OR numero::text = NULLIF($${a + 1}, ''))`,
      );
    }
    const where = conds.join(" AND ");
    const total = await db.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM notas WHERE ${where}`,
      params,
    );
    const { rows } = await db.query(
      `SELECT id, tipo, serie, numero, status, ambiente, data_emissao, criado_em, total, destinatario->>'nome' AS cliente_nome,
              destinatario->>'cpf_cnpj' AS cliente_cpf_cnpj
         FROM notas WHERE ${where} ORDER BY COALESCE(data_emissao, criado_em) DESC
        LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      params,
    );
    res.json({ items: rows, total: total.rows[0]?.n ?? 0, page, pageSize });
  });

  r.post("/", async (req, res) => {
    const input = parse(notaSchema, req.body);
    const emitirAgora = req.body?.emitir === true;
    const id = await db.tx(async (q) => {
      const notaId = await salvarRascunho(q, uid(req), input);
      await audit(q, req, uid(req), "notas.rascunho", "notas", notaId);
      if (emitirAgora) await emitir(ctx, q, req, uid(req), notaId);
      return notaId;
    });
    res.status(201).json(await carregarNota(db, uid(req), id));
  });

  r.get("/:id", async (req, res) => {
    res.json(await carregarNota(db, uid(req), req.params.id));
  });

  r.put("/:id", async (req, res) => {
    const input = parse(notaSchema, req.body);
    await db.tx(async (q) => {
      const nota = await carregarNota(q, uid(req), req.params.id, true);
      if (nota.status !== "rascunho")
        throw regra("Documentos emitidos não podem ser alterados. Cancele e emita outro.");
      await salvarRascunho(q, uid(req), input, req.params.id);
      await audit(q, req, uid(req), "notas.atualizar", "notas", req.params.id);
    });
    res.json(await carregarNota(db, uid(req), req.params.id));
  });

  r.delete("/:id", async (req, res) => {
    await db.tx(async (q) => {
      const nota = await carregarNota(q, uid(req), req.params.id, true);
      if (nota.status !== "rascunho")
        throw regra(
          "Somente rascunhos podem ser excluídos. Documentos emitidos devem ser cancelados.",
        );
      await q.query(
        "UPDATE pedidos SET status = 'aberto', nota_id = NULL WHERE nota_id = $1 AND usuario_id = $2",
        [req.params.id, uid(req)],
      );
      await q.query("DELETE FROM notas WHERE id = $1 AND usuario_id = $2", [
        req.params.id,
        uid(req),
      ]);
      await audit(q, req, uid(req), "notas.excluir", "notas", req.params.id);
    });
    res.json({ ok: true });
  });

  r.post("/:id/emitir", async (req, res) => {
    await db.tx((q) => emitir(ctx, q, req, uid(req), req.params.id));
    res.json(await carregarNota(db, uid(req), req.params.id));
  });

  r.post("/:id/cancelar", async (req, res) => {
    const { motivo } = parse(cancelarNotaSchema, req.body);
    await db.tx(async (q) => {
      const nota = await carregarNota(q, uid(req), req.params.id, true);
      if (nota.status !== "emitida")
        throw regra("Somente documentos emitidos podem ser cancelados.");
      const contas = await q.query<{ id: string; status: string }>(
        "SELECT id, status FROM contas WHERE nota_id = $1 AND usuario_id = $2",
        [req.params.id, uid(req)],
      );
      if (contas.rows.some((c) => c.status === "paga")) {
        throw regra(
          "Há recebimento baixado para este documento. Estorne o recebimento no Financeiro antes de cancelar.",
        );
      }
      await q.query(
        "UPDATE contas SET status = 'cancelada', atualizado_em = now() WHERE nota_id = $1 AND usuario_id = $2 AND status = 'aberta'",
        [req.params.id, uid(req)],
      );
      // Estorna o estoque baixado na emissão.
      const movs = await q.query<{ produto_id: string; quantidade: number }>(
        "SELECT produto_id, quantidade FROM estoque_movimentos WHERE nota_id = $1 AND usuario_id = $2 AND tipo = 'saida'",
        [req.params.id, uid(req)],
      );
      for (const m of movs.rows) {
        await movimentar(
          q,
          uid(req),
          m.produto_id,
          "entrada",
          Number(m.quantidade),
          `Estorno do cancelamento do documento nº ${nota.numero}`,
          req.params.id,
        );
      }
      await q.query(
        "UPDATE notas SET status = 'cancelada', motivo_cancelamento = $3, cancelada_em = now(), atualizado_em = now() WHERE id = $1 AND usuario_id = $2",
        [req.params.id, uid(req), motivo],
      );
      await notificar(ctx, q, uid(req), {
        tipo: "nota",
        titulo: `${nota.tipo} nº ${nota.numero} cancelada`,
        mensagem: `Justificativa: ${motivo}`,
        link: `/notas/${req.params.id}`,
      });
      await audit(q, req, uid(req), "notas.cancelar", "notas", req.params.id, { motivo });
    });
    res.json(await carregarNota(db, uid(req), req.params.id));
  });

  r.get("/:id/pdf", async (req, res) => {
    const nota = await carregarNota(db, uid(req), req.params.id);
    const pdf = await gerarPdf(nota);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `${req.query.download === "1" ? "attachment" : "inline"}; filename="${nomeArquivo(nota, "pdf")}"`,
    );
    res.send(pdf);
  });

  r.get("/:id/xml", async (req, res) => {
    const nota = await carregarNota(db, uid(req), req.params.id);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo(nota, "xml")}"`);
    res.send(gerarXml(nota));
  });

  /** Envio dos arquivos ao contador por e-mail (recurso inspirado no envio automático ao contador de ERPs). */
  r.post("/:id/enviar-contador", async (req, res) => {
    const { contador_id } = parse(
      z.object({ contador_id: z.string().uuid("Selecione um contador") }),
      req.body,
    );
    if (!ctx.mailer.enabled) {
      throw new AppError(
        "INTEGRACAO_NAO_CONFIGURADA",
        "O envio por e-mail requer SMTP configurado no servidor (SMTP_HOST, SMTP_FROM).",
      );
    }
    const nota = await carregarNota(db, uid(req), req.params.id);
    if (nota.status === "rascunho") throw regra("Emita o documento antes de enviá-lo ao contador.");
    const { rows } = await db.query<{ nome: string; email: string }>(
      "SELECT nome, email FROM contadores WHERE id = $1 AND usuario_id = $2",
      [contador_id, uid(req)],
    );
    const contador = rows[0];
    if (!contador) throw naoEncontrado("Contador");
    try {
      await ctx.mailer.send({
        to: contador.email,
        subject: `FINC — ${nota.tipo} nº ${numeroFormatado(nota)} (${(nota.emitente as Parte).nome ?? ""})`,
        text: `Olá, ${contador.nome}.\n\nSegue em anexo o documento ${nota.tipo} nº ${numeroFormatado(nota)} (status: ${nota.status}), enviado por ${req.auth!.nome} pela plataforma FINC.`,
        attachments: [
          {
            filename: nomeArquivo(nota, "pdf"),
            content: await gerarPdf(nota),
            contentType: "application/pdf",
          },
          {
            filename: nomeArquivo(nota, "xml"),
            content: gerarXml(nota),
            contentType: "application/xml",
          },
        ],
      });
    } catch (err) {
      ctx.logger.error({ err }, "falha no envio ao contador");
      throw new AppError(
        "INTEGRACAO_FALHOU",
        "Não foi possível enviar o e-mail. Verifique a configuração SMTP.",
      );
    }
    await audit(db, req, uid(req), "notas.enviar_contador", "notas", req.params.id, {
      contador_id,
    });
    res.json({ ok: true, message: `Documento enviado para ${contador.email}.` });
  });

  return r;
}
