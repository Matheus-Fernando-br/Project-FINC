export const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3333";

async function clearSessionClientSide() {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
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

  const headers = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers || {}),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    credentials: "include",
    headers,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

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
      (data && (data.error || data.message)) || "Não autenticado",
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
