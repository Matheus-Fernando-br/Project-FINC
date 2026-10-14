import { Router } from "express";
import {
  clienteSchema,
  contadorSchema,
  estoqueMovimentoSchema,
  produtoCreateSchema,
  produtoSchema,
  servicoSchema,
} from "@finc/shared";
import type { AppContext } from "../context.js";
import type { Queryable } from "../db/index.js";
import { naoEncontrado, parse, regra } from "../http/errors.js";
import { uid } from "../middleware/auth.js";
import { audit } from "../services/audit.js";
import { notificar } from "../services/notificacoes.js";
import { crudRoutes, type CrudDef } from "./crud.js";

const END = ["cep", "uf", "cidade", "logradouro", "bairro", "numero", "complemento"];

export const clientesDef: CrudDef = {
  tabela: "clientes",
  entidade: "Cliente",
  schema: clienteSchema,
  colunas: [
    "nome_social",
    "tipo_pessoa",
    "cpf_cnpj",
    "inscricao_estadual",
    "email",
    "telefone",
    "whatsapp",
    "observacoes",
    ...END,
  ],
  ordem: "nome_social ASC",
  busca: ["nome_social", "cpf_cnpj", "email", "cidade"],
  recurso: "clientes",
  csv: [
    { coluna: "nome_social", titulo: "nome_social" },
    { coluna: "tipo_pessoa", titulo: "tipo_pessoa" },
    { coluna: "cpf_cnpj", titulo: "cpf_cnpj" },
    { coluna: "inscricao_estadual", titulo: "inscricao_estadual" },
    { coluna: "email", titulo: "email" },
    { coluna: "telefone", titulo: "telefone" },
    { coluna: "whatsapp", titulo: "whatsapp" },
    ...END.map((c) => ({ coluna: c, titulo: c })),
  ],
};

const PRODUTO_COLS = [
  "nome",
  "fabricante",
  "categoria",
  "descricao",
  "sku",
  "unidade_medida",
  "preco_unitario",
  "ncm",
  "cfop",
  "icms",
  "pis_cofins",
  "origem",
  "controla_estoque",
  "estoque_minimo",
  "ativo",
];

export const produtosDef: CrudDef = {
  tabela: "produtos",
  entidade: "Produto",
  schema: produtoCreateSchema,
  updateSchema: produtoSchema,
  colunas: PRODUTO_COLS,
  ordem: "nome ASC",
  busca: ["nome", "sku", "categoria", "fabricante", "ncm"],
  recurso: "produtos",
  csv: [...PRODUTO_COLS, "estoque_atual"].map((c) => ({ coluna: c, titulo: c })),
  filtros: (req) =>
    req.query.estoque_baixo === "1"
      ? {
          sql: "controla_estoque AND estoque_minimo IS NOT NULL AND estoque_atual <= estoque_minimo",
          params: [],
        }
      : { sql: "", params: [] },
  async afterInsert(q, userId, row, input) {
    const inicial = Number(input.estoque_inicial ?? 0);
    if (row.controla_estoque && inicial > 0) {
      await movimentar(q, userId, String(row.id), "entrada", inicial, "Estoque inicial");
    }
  },
};

const SERVICO_COLS = [
  "nome",
  "categoria",
  "codigo_interno",
  "descricao_detalhada",
  "preco",
  "unidade_medida",
  "cnae",
  "codigo_servico",
  "item_lista",
  "aliquota_iss",
  "cst_pis_cofins",
  "regime_especial",
  "municipio",
  "ativo",
];

export const servicosDef: CrudDef = {
  tabela: "servicos",
  entidade: "Serviço",
  schema: servicoSchema,
  colunas: SERVICO_COLS,
  ordem: "nome ASC",
  busca: ["nome", "codigo_interno", "categoria", "codigo_servico", "cnae"],
  recurso: "servicos",
  csv: SERVICO_COLS.map((c) => ({ coluna: c, titulo: c })),
};

export const contadoresDef: CrudDef = {
  tabela: "contadores",
  entidade: "Contador",
  schema: contadorSchema,
  colunas: ["nome", "email", "cpf", "crc", "telefone"],
  ordem: "criado_em DESC",
  busca: ["nome", "email", "crc"],
  recurso: "contadores",
  csv: ["nome", "email", "cpf", "crc", "telefone"].map((c) => ({ coluna: c, titulo: c })),
};

/**
 * Movimenta o estoque de um produto (com bloqueio de linha) e registra o histórico.
 * Saídas não podem deixar o saldo negativo.
 */
export async function movimentar(
  q: Queryable,
  userId: string,
  produtoId: string,
  tipo: "entrada" | "saida" | "ajuste",
  quantidade: number,
  motivo: string | null,
  notaId: string | null = null,
) {
  const { rows } = await q.query<{
    estoque_atual: number;
    nome: string;
    controla_estoque: boolean;
    estoque_minimo: number | null;
  }>(
    "SELECT estoque_atual, nome, controla_estoque, estoque_minimo FROM produtos WHERE id = $1 AND usuario_id = $2 FOR UPDATE",
    [produtoId, userId],
  );
  const p = rows[0];
  if (!p) throw naoEncontrado("Produto");
  if (!p.controla_estoque) throw regra(`O produto "${p.nome}" não controla estoque.`);
  const atual = Number(p.estoque_atual);
  const novo =
    tipo === "entrada" ? atual + quantidade : tipo === "saida" ? atual - quantidade : quantidade;
  if (novo < 0)
    throw regra(`Estoque insuficiente para "${p.nome}" (disponível: ${atual}).`, {
      produto_id: produtoId,
      disponivel: atual,
    });
  await q.query(
    "UPDATE produtos SET estoque_atual = $3, atualizado_em = now() WHERE id = $1 AND usuario_id = $2",
    [produtoId, userId, novo],
  );
  await q.query(
    `INSERT INTO estoque_movimentos (usuario_id, produto_id, tipo, quantidade, saldo_apos, motivo, nota_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, produtoId, tipo, quantidade, novo, motivo, notaId],
  );
  return {
    saldo: novo,
    nome: p.nome,
    abaixoDoMinimo:
      p.estoque_minimo !== null &&
      novo <= Number(p.estoque_minimo) &&
      atual > Number(p.estoque_minimo),
  };
}

export function estoqueRoutes(ctx: AppContext) {
  const r = Router();
  r.get("/movimentos", async (req, res) => {
    const params: unknown[] = [uid(req)];
    let filtro = "";
    if (typeof req.query.produto_id === "string" && /^[0-9a-f-]{36}$/i.test(req.query.produto_id)) {
      params.push(req.query.produto_id);
      filtro = "AND m.produto_id = $2";
    }
    const { rows } = await ctx.db.query(
      `SELECT m.*, p.nome AS produto_nome, p.sku FROM estoque_movimentos m JOIN produtos p ON p.id = m.produto_id
        WHERE m.usuario_id = $1 ${filtro} ORDER BY m.criado_em DESC LIMIT 200`,
      params,
    );
    res.json(rows);
  });

  r.post("/movimentos", async (req, res) => {
    const input = parse(estoqueMovimentoSchema, req.body);
    if (input.tipo !== "ajuste" && input.quantidade <= 0)
      throw regra("Quantidade deve ser maior que zero.");
    const out = await ctx.db.tx(async (q) => {
      const m = await movimentar(
        q,
        uid(req),
        input.produto_id,
        input.tipo,
        input.quantidade,
        input.motivo ?? null,
      );
      if (m.abaixoDoMinimo) {
        await notificar(ctx, q, uid(req), {
          tipo: "estoque",
          titulo: "Estoque baixo",
          mensagem: `O produto "${m.nome}" atingiu o estoque mínimo (saldo: ${m.saldo}).`,
          link: "/estoque",
        });
      }
      await audit(q, req, uid(req), "estoque.movimentar", "produtos", input.produto_id, {
        tipo: input.tipo,
        quantidade: input.quantidade,
      });
      return m;
    });
    res.status(201).json({ saldo: out.saldo });
  });
  return r;
}

export function cadastrosRouters(ctx: AppContext) {
  return {
    clientes: crudRoutes(ctx, clientesDef),
    produtos: crudRoutes(ctx, produtosDef),
    servicos: crudRoutes(ctx, servicosDef),
    contadores: crudRoutes(ctx, contadoresDef),
    estoque: estoqueRoutes(ctx),
  };
}
