export const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3333";

const DEBUG_AUTH =
  typeof process !== "undefined" &&
  process.env.REACT_APP_DEBUG_AUTH === "1";

  let sessionCache = null;
  let sessionCacheTime = 0;
  const SESSION_TTL = 60 * 1000; // 1 minuto

function readCookie(name) {
  if (typeof document === "undefined") return "";
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

function getCsrfTokenFromCookie() {
  const raw = readCookie("csrf_token");
  if (!raw) return "";
  const sep = raw.indexOf(".");
  if (sep <= 0) return "";
  return raw.slice(sep + 1);
}

function isUnsafeMethod(method = "GET") {
  const m = method.toUpperCase();
  return m === "POST" || m === "PUT" || m === "PATCH" || m === "DELETE";
}

async function clearSessionClientSide() {
  try {
    const csrfToken = getCsrfTokenFromCookie();
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      },
    });
  } catch {
    /* ignora falha de rede */
  }
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("user_name");
}

async function logoutAndRedirect() {
  alert("Sua sessão expirou. Faça login novamente.");
  await clearSessionClientSide();
  window.location.href = "/TelaInicial/Login";
}

/**
 * @param {string} path
 * @param {RequestInit & { skipLogoutOn401?: boolean }} options
 */
export async function apiFetch(path, options = {}) {
  const { skipLogoutOn401 = false, ...fetchOptions } = options;
  const method = (fetchOptions.method || "GET").toUpperCase();

  const hasFormDataBody =
    typeof FormData !== "undefined" && fetchOptions.body instanceof FormData;

  const csrfToken = isUnsafeMethod(method)
    ? getCsrfTokenFromCookie()
    : "";

  const headers = {
    ...(fetchOptions.headers || {}),
    ...(hasFormDataBody ? {} : { "Content-Type": "application/json" }),
    ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
  };

  // ✅ DEBUG REQUEST
  if (DEBUG_AUTH) {
    console.log("[DEBUG AUTH] Request:", {
      url: `${API_URL}${path}`,
      method,
      headers,
      body: fetchOptions.body,
    });
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
    credentials: "include",
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const data = isJson
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  // ✅ DEBUG RESPONSE
  if (DEBUG_AUTH) {
    console.log("[DEBUG AUTH] Response:", {
      status: res.status,
      data,
    });
  }

  if (res.status === 401) {
    if (path === "/auth/login") {
      const msg =
        (data && (data.error || data.erro || data.message)) ||
        "Usuário ou senha inválidos";
      throw new Error(msg);
    }

    if (!skipLogoutOn401) {
      await logoutAndRedirect();
      throw new Error("Sessão expirada");
    }

    throw new Error(
      (data && (data.error || data.message)) || "Não autenticado"
    );
  }

  if (!res.ok) {
    const msg =
      (data && (data.error || data.erro || data.message)) ||
      `Erro HTTP ${res.status}`;

    throw new Error(msg);
  }

  return data;
}

/**
 * GET /auth/me com pequenos retries (evita corrida cookie logo após login).
 */
export async function fetchSessionWithRetry(maxAttempts = 3, delayMs = 120) {
  const now = Date.now();

  // ✅ usa cache se ainda válido
  if (sessionCache && now - sessionCacheTime < SESSION_TTL) {
    return sessionCache;
  }

  let lastErr;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const data = await apiFetch("/auth/me", {
        method: "GET",
        skipLogoutOn401: true,
      });

      // ✅ salva cache
      sessionCache = data;
      sessionCacheTime = Date.now();

      return data;
    } catch (e) {
      lastErr = e;

      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, delayMs * attempt));
      }
    }
  }

  throw lastErr;
}
