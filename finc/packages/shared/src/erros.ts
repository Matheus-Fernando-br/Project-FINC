/**
 * Catálogo de erros visíveis ao usuário (inspirado no catálogo de erros do REA).
 * Toda resposta de erro da API tem o formato { error: { code, message, details? } }.
 */
export const ERROS = {
  VALIDACAO: { status: 400, message: "Dados inválidos. Verifique os campos destacados." },
  NAO_AUTENTICADO: { status: 401, message: "Não autenticado. Faça login novamente." },
  CREDENCIAIS_INVALIDAS: { status: 401, message: "Usuário ou senha inválidos." },
  CSRF: { status: 403, message: "Falha na validação de segurança (CSRF). Recarregue a página." },
  PROIBIDO: { status: 403, message: "Você não tem permissão para esta ação." },
  NAO_ENCONTRADO: { status: 404, message: "Registro não encontrado." },
  CONFLITO: { status: 409, message: "Registro duplicado ou em conflito." },
  LIMITE_PLANO: {
    status: 402,
    message: "Limite do seu plano atingido. Faça upgrade para o plano BLACK.",
  },
  REGRA_NEGOCIO: { status: 422, message: "Operação não permitida pelas regras de negócio." },
  MUITAS_REQUISICOES: {
    status: 429,
    message: "Muitas requisições. Tente novamente em alguns minutos.",
  },
  INTEGRACAO_NAO_CONFIGURADA: {
    status: 503,
    message: "Integração externa não configurada no servidor.",
  },
  INTEGRACAO_FALHOU: { status: 502, message: "Falha ao comunicar com o serviço externo." },
  INTERNO: { status: 500, message: "Erro interno do servidor." },
} as const;

export type CodigoErro = keyof typeof ERROS;

export interface ErroApi {
  code: CodigoErro;
  message: string;
  details?: unknown;
}
