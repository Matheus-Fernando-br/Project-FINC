import { useState, type ChangeEvent } from "react";
import type { ZodTypeAny } from "zod";
import { ApiError } from "../api/client";

type Valores = Record<string, unknown>;

/** Estado de formulário com validação Zod compartilhada com a API e mapeamento de erros por campo. */
export function useForm<T extends Valores>(inicial: T) {
  const [values, setValues] = useState<T>(inicial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [erroGeral, setErroGeral] = useState("");

  const set = (campo: keyof T & string, valor: unknown) => {
    setValues((v) => ({ ...v, [campo]: valor }));
    setErrors((e) => {
      if (!e[campo]) return e;
      const { [campo]: _omit, ...resto } = e;
      return resto;
    });
  };

  const bind = (campo: keyof T & string) => ({
    id: campo,
    name: campo,
    value: (values[campo] ?? "") as string | number,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      set(
        campo,
        e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value,
      ),
  });

  const validar = (schema: ZodTypeAny): boolean => {
    const r = schema.safeParse(values);
    if (r.success) return true;
    const errs: Record<string, string> = {};
    for (const i of r.error.issues) {
      const k = String(i.path[0] ?? "");
      if (k && !errs[k]) errs[k] = i.message;
    }
    setErrors(errs);
    setErroGeral("Verifique os campos destacados.");
    return false;
  };

  /** Executa o envio tratando erros da API (campos destacados + mensagem geral). */
  const enviar = async (fn: () => Promise<void>) => {
    setEnviando(true);
    setErroGeral("");
    try {
      await fn();
    } catch (e) {
      if (e instanceof ApiError) {
        setErrors(e.campos);
        setErroGeral(e.message);
      } else setErroGeral((e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return {
    values,
    setValues,
    set,
    bind,
    errors,
    setErrors,
    validar,
    enviar,
    enviando,
    erroGeral,
    setErroGeral,
  };
}
