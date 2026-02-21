const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3333";

function getToken() {
  return localStorage.getItem("token"); // ajuste se seu token tiver outro nome
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
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const msg = (data && (data.erro || data && data.message)) || `Erro HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}