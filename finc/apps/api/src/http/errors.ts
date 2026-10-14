import type { ErrorRequestHandler, RequestHandler } from "express";
import { ERROS, type CodigoErro } from "@finc/shared";
import { ZodError, type ZodTypeAny, type output } from "zod";
import type { Logger } from "pino";

/** Erro de aplicação tagueado (inspirado na álgebra de erros do REA): código estável + mensagem ao usuário. */
export class AppError extends Error {
  readonly status: number;
  constructor(
    readonly code: CodigoErro,
    message?: string,
    readonly details?: unknown,
  ) {
    super(message ?? ERROS[code].message);
    this.status = ERROS[code].status;
  }
}

export const naoEncontrado = (entidade = "Registro") => new AppError("NAO_ENCONTRADO", `${entidade} não encontrado.`);
export const regra = (msg: string, details?: unknown) => new AppError("REGRA_NEGOCIO", msg, details);

export function zodDetails(e: ZodError) {
  return e.issues.map((i) => ({ campo: i.path.join("."), mensagem: i.message }));
}

export function parse<S extends ZodTypeAny>(schema: S, data: unknown): output<S> {
  const r = schema.safeParse(data);
  if (!r.success) {
    const details = zodDetails(r.error);
    throw new AppError("VALIDACAO", details[0]?.mensagem ?? ERROS.VALIDACAO.message, details);
  }
  return r.data;
}

/** Converte violações de restrição do PostgreSQL em erros de domínio. */
function fromPg(err: unknown): AppError | null {
  const e = err as { code?: string; constraint?: string };
  if (e?.code === "23505") {
    const c = e.constraint ?? "";
    const msg = c.includes("cpf_cnpj")
      ? "CPF/CNPJ já cadastrado."
      : c.includes("email")
        ? "E-mail já cadastrado."
        : c.includes("sku")
          ? "Já existe um produto com este SKU."
          : c.includes("codigo_interno")
            ? "Já existe um serviço com este código interno."
            : undefined;
    return new AppError("CONFLITO", msg);
  }
  if (e?.code === "23514" || e?.code === "22P02" || e?.code === "23502") return new AppError("VALIDACAO");
  if (e?.code === "23503") return new AppError("REGRA_NEGOCIO", "Registro relacionado inexistente ou em uso.");
  return null;
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: "NAO_ENCONTRADO", message: "Rota não encontrada." } });
};

export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (err, req, res, _next) => {
    let appErr: AppError;
    if (err instanceof AppError) appErr = err;
    else if (err instanceof ZodError) appErr = new AppError("VALIDACAO", undefined, zodDetails(err));
    else if ((err as { type?: string })?.type === "entity.parse.failed") appErr = new AppError("VALIDACAO", "JSON inválido.");
    else if ((err as { type?: string })?.type === "entity.too.large") appErr = new AppError("VALIDACAO", "Corpo da requisição muito grande.");
    else if ((err as { code?: string })?.code === "LIMIT_FILE_SIZE") appErr = new AppError("VALIDACAO", "Arquivo muito grande.");
    else appErr = fromPg(err) ?? new AppError("INTERNO");

    if (appErr.status >= 500) logger.error({ err, path: req.path }, "erro não tratado");
    // Mensagens internas nunca são repassadas ao cliente (corrige vazamento observado na FINC original).
    res.status(appErr.status).json({
      error: { code: appErr.code, message: appErr.message, ...(appErr.details ? { details: appErr.details } : {}) },
    });
  };
}
