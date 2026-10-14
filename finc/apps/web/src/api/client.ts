/**
 * Cliente HTTP da FINC. Sessão em cookie HttpOnly (enviado automaticamente) + token CSRF em memória.
 * Erros da API chegam como { error: { code, message, details } } e viram ApiError.
 */

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

let csrfToken = "";
export const setCsrfToken = (t: string) => {
  csrfToken = t;
};

export interface DetalheErro {
  campo: string;
  mensagem: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
  /** Erros de validação por campo (para destacar no formulário). */
  get campos(): Record<string, string> {
    const out: Record<string, string> = {};
    if (Array.isArray(this.details)) {
      for (const d of this.details as DetalheErro[])
        if (d?.campo && !out[d.campo]) out[d.campo] = d.mensagem;
    }
    return out;
  }
}

type Listener = () => void;
const unauthorizedListeners = new Set<Listener>();
export const onUnauthorized = (fn: Listener) => {
  unauthorizedListeners.add(fn);
  return () => {
    unauthorizedListeners.delete(fn);
  };
};

async function raw(method: string, path: string, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = {};
  let payload: BodyInit | undefined;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  if (method !== "GET" && csrfToken) headers["X-CSRF-Token"] = csrfToken;
  let res: Response;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers,
      body: payload,
      credentials: "include",
    });
  } catch {
    throw new ApiError(0, "REDE", "Não foi possível conectar ao servidor. Verifique sua conexão.");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const err = new ApiError(
      res.status,
      data?.error?.code ?? "ERRO",
      data?.error?.message ?? `Erro HTTP ${res.status}`,
      data?.error?.details,
    );
    if (res.status === 401 && !path.startsWith("/auth/")) unauthorizedListeners.forEach((l) => l());
    throw err;
  }
  return res;
}

async function json<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await raw(method, path, body);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => json<T>("GET", path),
  post: <T>(path: string, body?: unknown) => json<T>("POST", path, body ?? {}),
  put: <T>(path: string, body?: unknown) => json<T>("PUT", path, body ?? {}),
  del: <T>(path: string) => json<T>("DELETE", path),
  upload: <T>(path: string, form: FormData) => json<T>("POST", path, form),
  /** Baixa um arquivo autenticado (PDF, XML, CSV, JSON). */
  async download(path: string, fallbackName: string) {
    const res = await raw("GET", path);
    const blob = await res.blob();
    const disp = res.headers.get("Content-Disposition") ?? "";
    const nome = /filename="?([^"]+)"?/.exec(disp)?.[1] ?? fallbackName;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
  /** Abre um arquivo autenticado em nova aba (ex.: visualizar PDF). */
  async abrir(path: string) {
    const janela = window.open("", "_blank");
    const res = await raw("GET", path);
    const url = URL.createObjectURL(await res.blob());
    if (janela) janela.location.href = url;
    else window.location.href = url;
  },
};

export const qs = (params: Record<string, string | number | undefined | null | boolean>) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params))
    if (v !== undefined && v !== null && v !== "" && v !== false) s.set(k, String(v));
  const out = s.toString();
  return out ? `?${out}` : "";
};
