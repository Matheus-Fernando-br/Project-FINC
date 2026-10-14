import { useRef, useState, type ChangeEvent } from "react";
import type { ZodTypeAny } from "zod";
import { aplicarMascara, normalizarCampos, type Mascara } from "@finc/shared";
import { ApiError } from "../api/client";

type Valores = Record<string, unknown>;

/** Estado de formulário com validação Zod compartilhada com a API e mapeamento de erros por campo. */
export function useForm<T extends Valores>(inicial: T) {
  const [values, setValues] = useState<T>(inicial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [erroGeral, setErroGeral] = useState("");
  // Máscaras registradas pelos campos (bind) — usadas para formatar e para normalizar no envio.
  const mascaras = useRef<Record<string, Mascara>>({});

  const set = (campo: keyof T & string, valor: unknown) => {
    setValues((v) => ({ ...v, [campo]: valor }));
    setErrors((e) => {
      if (!e[campo]) return e;
      const { [campo]: _omit, ...resto } = e;
      return resto;
    });
  };

  /** Liga um campo ao estado. Com `mascara`, formata enquanto digita (CPF, CNPJ, telefone, CEP, e-mail). */
  const bind = (campo: keyof T & string, mascara?: Mascara) => {
    if (mascara) mascaras.current[campo] = mascara;
    return {
      id: campo,
      name: campo,
      value: (values[campo] ?? "") as string | number,
      ...(mascara && mascara !== "email" ? { inputMode: "numeric" as const } : {}),
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        set(
          campo,
          e.target.type === "checkbox"
            ? (e.target as HTMLInputElement).checked
            : mascara
              ? aplicarMascara(mascara, e.target.value)
              : e.target.value,
        ),
    };
  };

  /** Preenche o formulário com dados vindos da API, já formatados pelas máscaras dos campos. */
  const carregar = (dados: T, mapa: Record<string, Mascara> = {}) => {
    Object.assign(mascaras.current, mapa);
    const v: Record<string, unknown> = { ...dados };
    for (const [campo, m] of Object.entries(mascaras.current))
      if (typeof v[campo] === "string" && v[campo]) v[campo] = aplicarMascara(m, v[campo]);
    setValues(v as T);
  };

  /** Valores prontos para a API: campos mascarados viram só dígitos; e-mails, minúsculas. */
  const dados = () =>
    normalizarCampos(values, mascaras.current as Partial<Record<keyof T, Mascara>>);

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
    carregar,
    dados,
    errors,
    setErrors,
    validar,
    enviar,
    enviando,
    erroGeral,
    setErroGeral,
  };
}
