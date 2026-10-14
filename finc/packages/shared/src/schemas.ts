import { z } from "zod";
import { TIPOS_NOTA, UFS } from "./catalogos.js";
import {
  isStrongPassword,
  isValidCEP,
  isValidCNPJ,
  isValidCPF,
  isValidCpfCnpj,
  isValidEmail,
  isValidTelefone,
  onlyDigits,
} from "./validators.js";

/**
 * Contratos de entrada da API (fonte única, inspirada nos contratos Zod do REA).
 * O front-end usa os mesmos schemas para validar formulários antes do envio.
 */

const emptyToNull = (v: unknown) => (v === "" || v === undefined ? null : v);

/** Texto opcional: "" e ausente viram null. */
export const optText = (max: number) =>
  z.preprocess(emptyToNull, z.string().trim().max(max).nullable()).optional();

const reqText = (min: number, max: number, campo: string) =>
  z
    .string({ required_error: `${campo} é obrigatório`, invalid_type_error: `${campo} inválido` })
    .trim()
    .min(min, `${campo} é obrigatório`)
    .max(max, `${campo} muito longo`);

const digitsOpt = (pred: (s: string) => boolean, msg: string) =>
  z
    .preprocess((v) => {
      const d = onlyDigits(v);
      return d === "" ? null : d;
    }, z.string().nullable())
    .refine((v) => v === null || pred(v), msg)
    .optional();

const numberFrom = (schema: z.ZodNumber) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : Number(String(v).replace(",", "."))), schema);

const numOpt = (schema: z.ZodNumber) =>
  z
    .preprocess(
      (v) => (v === "" || v === null || v === undefined ? null : Number(String(v).replace(",", "."))),
      schema.nullable(),
    )
    .optional();

export const percentual = z.number({ invalid_type_error: "Percentual inválido" }).min(0, "Mínimo 0%").max(100, "Máximo 100%");

export const emailSchema = z
  .string({ required_error: "E-mail é obrigatório" })
  .trim()
  .toLowerCase()
  .refine(isValidEmail, "E-mail inválido");

export const emailOpt = z
  .preprocess(emptyToNull, z.string().trim().toLowerCase().nullable())
  .refine((v) => v === null || isValidEmail(v), "E-mail inválido")
  .optional();

export const senhaSchema = z
  .string({ required_error: "Senha é obrigatória" })
  .refine(isStrongPassword, "Senha inválida: mínimo 8 caracteres, com pelo menos uma letra e um número");

export const tipoPessoaSchema = z.preprocess(
  (v) => {
    // Compatibilidade com valores legados da FINC original ("PFisica" / "PJuridica").
    if (v === "PFisica" || v === "PF") return "FISICA";
    if (v === "PJuridica" || v === "PJ") return "JURIDICA";
    return typeof v === "string" ? v.toUpperCase() : v;
  },
  z.enum(["FISICA", "JURIDICA"], { errorMap: () => ({ message: "Tipo de pessoa inválido" }) }),
);

export const enderecoShape = {
  cep: digitsOpt(isValidCEP, "CEP inválido"),
  uf: z.preprocess(emptyToNull, z.enum(UFS).nullable()).optional(),
  cidade: optText(120),
  logradouro: optText(200),
  bairro: optText(120),
  numero: optText(20),
  complemento: optText(120),
};

function refineDocumento<T extends { tipo_pessoa: "FISICA" | "JURIDICA"; cpf_cnpj: string }>(
  data: T,
  ctx: z.RefinementCtx,
) {
  const ok = data.tipo_pessoa === "FISICA" ? isValidCPF(data.cpf_cnpj) : isValidCNPJ(data.cpf_cnpj);
  if (!ok) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["cpf_cnpj"],
      message: data.tipo_pessoa === "FISICA" ? "CPF inválido" : "CNPJ inválido",
    });
  }
}

const docDigits = z.preprocess((v) => onlyDigits(v), z.string().min(1, "CPF/CNPJ é obrigatório"));

/* ============ Autenticação ============ */

export const registerSchema = z
  .object({
    nome: reqText(2, 200, "Nome social"),
    tipo_pessoa: tipoPessoaSchema,
    cpf_cnpj: docDigits,
    email: emailSchema,
    senha: senhaSchema,
    telefone: z.preprocess((v) => onlyDigits(v), z.string()).refine(isValidTelefone, "Telefone inválido"),
    aceite_termos: z.literal(true, { errorMap: () => ({ message: "É necessário aceitar os termos de uso" }) }),
  })
  .superRefine(refineDocumento);

export const loginSchema = z.object({
  login: z.string().trim().min(1).max(254),
  senha: z.string().min(1).max(128),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  senha: senhaSchema,
});

export const changePasswordSchema = z.object({
  senha_atual: z.string().min(1, "Informe a senha atual"),
  nova_senha: senhaSchema,
});

/* ============ Perfil ============ */

export const perfilSchema = z.object({
  nome: reqText(2, 200, "Nome social"),
  telefone: z.preprocess((v) => onlyDigits(v), z.string()).refine(isValidTelefone, "Telefone inválido"),
  inscricao_estadual: optText(30),
  inscricao_municipal: optText(30),
  ...enderecoShape,
});

/* ============ Cadastros ============ */

export const clienteSchema = z
  .object({
    nome_social: reqText(2, 200, "Nome social"),
    tipo_pessoa: tipoPessoaSchema,
    cpf_cnpj: docDigits,
    inscricao_estadual: optText(30),
    email: emailOpt,
    telefone: digitsOpt(isValidTelefone, "Telefone inválido"),
    whatsapp: digitsOpt(isValidTelefone, "WhatsApp inválido"),
    observacoes: optText(1000),
    ...enderecoShape,
  })
  .superRefine(refineDocumento);

export const produtoSchema = z.object({
  nome: reqText(1, 200, "Nome"),
  fabricante: optText(120),
  categoria: reqText(1, 80, "Categoria"),
  descricao: optText(2000),
  sku: reqText(1, 60, "SKU"),
  unidade_medida: reqText(1, 40, "Unidade de medida"),
  preco_unitario: numberFrom(z.number({ required_error: "Preço é obrigatório" }).min(0, "Preço inválido").max(99999999)),
  ncm: z
    .preprocess((v) => onlyDigits(v), z.string())
    .refine((v) => v.length === 8, "NCM deve ter 8 dígitos"),
  cfop: z
    .preprocess((v) => onlyDigits(v), z.string())
    .refine((v) => v.length === 4, "CFOP deve ter 4 dígitos"),
  icms: numberFrom(percentual),
  pis_cofins: numberFrom(percentual),
  origem: z.enum(["0", "1", "2", "3", "4", "5", "6", "7", "8"], {
    errorMap: () => ({ message: "Origem inválida" }),
  }),
  controla_estoque: z.boolean().optional().default(false),
  estoque_minimo: numOpt(z.number().min(0)),
  ativo: z.boolean().optional().default(true),
});

/** Na criação é possível informar o estoque inicial (gera movimento de entrada). */
export const produtoCreateSchema = produtoSchema.extend({
  estoque_inicial: numOpt(z.number().min(0)),
});

export const servicoSchema = z.object({
  nome: reqText(1, 200, "Nome do serviço"),
  categoria: reqText(1, 80, "Categoria"),
  codigo_interno: optText(60),
  descricao_detalhada: optText(2000),
  preco: numberFrom(z.number({ required_error: "Preço é obrigatório" }).min(0, "Preço inválido").max(99999999)),
  unidade_medida: reqText(1, 40, "Unidade de medida"),
  cnae: z.preprocess((v) => onlyDigits(v), z.string()).refine((v) => v.length === 7, "CNAE deve ter 7 dígitos"),
  codigo_servico: reqText(1, 20, "Código do serviço"),
  item_lista: optText(10),
  aliquota_iss: numOpt(percentual),
  cst_pis_cofins: optText(10),
  regime_especial: optText(60),
  municipio: optText(120),
  ativo: z.boolean().optional().default(true),
});

export const contadorSchema = z.object({
  nome: reqText(2, 200, "Nome"),
  email: emailSchema,
  cpf: digitsOpt(isValidCPF, "CPF inválido"),
  crc: optText(30),
  telefone: digitsOpt(isValidTelefone, "Telefone inválido"),
});

export const estoqueMovimentoSchema = z.object({
  produto_id: z.string().uuid("Produto inválido"),
  tipo: z.enum(["entrada", "saida", "ajuste"]),
  quantidade: numberFrom(z.number().min(0, "Quantidade inválida").max(99999999)),
  motivo: optText(200),
});

/* ============ Documentos fiscais ============ */

export const notaItemSchema = z
  .object({
    produto_id: z.string().uuid().optional().nullable(),
    servico_id: z.string().uuid().optional().nullable(),
    quantidade: numberFrom(z.number().positive("Quantidade deve ser maior que zero").max(9999999)),
    valor_unitario: numberFrom(z.number().min(0).max(99999999)).optional(),
    info: optText(500),
  })
  .refine((i) => Boolean(i.produto_id) !== Boolean(i.servico_id), "Cada item deve referenciar um produto OU um serviço");

export const transporteSchema = z.object({
  incluir_frete: z.boolean().default(false),
  nome: optText(200),
  cpf_cnpj: digitsOpt(isValidCpfCnpj, "CPF/CNPJ do transportador inválido"),
  placa: optText(10),
  peso_bruto: numOpt(z.number().min(0)),
  peso_liquido: numOpt(z.number().min(0)),
  info: optText(500),
});

export const notaSchema = z.object({
  tipo: z.enum(TIPOS_NOTA, { errorMap: () => ({ message: "Selecione o tipo de nota (NF-e / NFC-e / NFS-e)" }) }),
  cliente_id: z.string({ required_error: "Selecione um cliente" }).uuid("Selecione um cliente"),
  itens: z.array(notaItemSchema).min(1, "Adicione pelo menos 1 produto/serviço").max(200),
  desconto_incondicional: numOpt(z.number().min(0)),
  desconto_condicional: numOpt(z.number().min(0)),
  observacoes: optText(2000),
  natureza_operacao: optText(120),
  transporte: transporteSchema.optional(),
  gerar_financeiro: z.boolean().optional().default(true),
  vencimento: z.preprocess(emptyToNull, z.string().date("Data inválida").nullable()).optional(),
});

export const cancelarNotaSchema = z.object({
  motivo: reqText(15, 255, "Justificativa (mínimo 15 caracteres)"),
});

/* ============ Financeiro ============ */

export const contaSchema = z.object({
  tipo: z.enum(["receber", "pagar"]),
  descricao: reqText(2, 200, "Descrição"),
  valor: numberFrom(z.number({ required_error: "Valor é obrigatório" }).positive("Valor deve ser maior que zero").max(999999999)),
  vencimento: z.string().date("Data de vencimento inválida"),
  categoria: optText(80),
  cliente_id: z.preprocess(emptyToNull, z.string().uuid().nullable()).optional(),
  observacoes: optText(1000),
});

export const baixaContaSchema = z.object({
  data_pagamento: z.string().date("Data inválida").optional(),
  forma_pagamento: optText(40),
});

/* ============ Suporte ============ */

export const chamadoSchema = z.object({
  categoria: reqText(2, 60, "Categoria"),
  assunto: reqText(3, 150, "Assunto"),
  mensagem: reqText(1, 4000, "Mensagem"),
});

export const mensagemSchema = z.object({ mensagem: reqText(1, 4000, "Mensagem") });

export const feedbackSchema = z.object({ mensagem: reqText(3, 4000, "Mensagem") });

/* ============ Configurações ============ */

export const configFiscalSchema = z.object({
  ambiente: z.enum(["homologacao", "producao"]),
  tipo_emissao: z.enum(["normal", "contingencia"]),
  natureza_operacao: optText(120),
  cfop_padrao: digitsOpt((v) => v.length === 4, "CFOP deve ter 4 dígitos"),
  serie: z.number().int().min(1).max(999),
  proximo_numero: z.number().int().min(1).max(999999999),
  numeracao_automatica: z.boolean(),
  regime_tributario: z.enum(["mei", "simples", "presumido", "real"]),
  somar_impostos: z.boolean(),
});

export const atalhoSchema = z.object({
  label: z.string().trim().min(1).max(40),
  icon: z.string().regex(/^bi-[a-z0-9-]+$/),
  to: z.string().regex(/^\/[a-zA-Z0-9/_-]*$/),
});

export const preferenciasSchema = z.object({
  fuso_horario: z.string().max(60),
  formato_data: z.enum(["dd/MM/yyyy", "yyyy-MM-dd", "MM/dd/yyyy"]),
  moeda: z.enum(["BRL"]),
  pagina_inicial: z.string().regex(/^\/[a-zA-Z0-9/_-]*$/),
  modo_compacto: z.boolean(),
  notificar_email: z.boolean(),
  atalhos: z.array(atalhoSchema).max(9),
});

export const trocarPlanoSchema = z.object({ plano_codigo: z.enum(["basico", "black"]) });

export type RegisterInput = z.infer<typeof registerSchema>;
export type ClienteInput = z.infer<typeof clienteSchema>;
export type ProdutoInput = z.infer<typeof produtoCreateSchema>;
export type ServicoInput = z.infer<typeof servicoSchema>;
export type ContadorInput = z.infer<typeof contadorSchema>;
export type NotaInput = z.infer<typeof notaSchema>;
export type ContaInput = z.infer<typeof contaSchema>;
export type ConfigFiscal = z.infer<typeof configFiscalSchema>;
export type Preferencias = z.infer<typeof preferenciasSchema>;
export type PerfilInput = z.infer<typeof perfilSchema>;

export const PREFERENCIAS_PADRAO: Preferencias = {
  fuso_horario: "America/Sao_Paulo",
  formato_data: "dd/MM/yyyy",
  moeda: "BRL",
  pagina_inicial: "/app",
  modo_compacto: false,
  notificar_email: true,
  atalhos: [
    { label: "Emitir nota", icon: "bi-receipt", to: "/notas/nova" },
    { label: "Novo cliente", icon: "bi-person-plus", to: "/clientes/novo" },
    { label: "Financeiro", icon: "bi-cash-coin", to: "/financeiro" },
  ],
};
