const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3333";

function getToken() {
  // ✅ prioridade: sessão (não lembrar) -> persistente (lembrar)
  return sessionStorage.getItem("token") || localStorage.getItem("token");
}

function logoutAndRedirect() {
  alert("Sua sessão expirou. Faça login novamente.");

  // ✅ limpa token em ambos
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");

  localStorage.removeItem("user");
  localStorage.removeItem("user_name");

  window.location.href = "/TelaInicial/Login";
}

export async function apiFetch(path, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  // tenta parsear json; se não for json, retorna texto
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  // ✅ tratamento de expiração
  if (res.status === 401) {
    logoutAndRedirect();
    throw new Error("Sessão expirada");
  }

  if (!res.ok) {
    const msg =
      (data && (data.error || data.erro || data.message)) ||
      `Erro HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}
