import { CSRF_COOKIE_NAME, hasValidCsrfPair } from "../utils/csrf.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const raw = req.cookies?.[CSRF_COOKIE_NAME];
  const header =
    req.headers["x-csrf-token"] ||
    req.headers["x-xsrf-token"] ||
    req.headers["csrf-token"];

  if (!hasValidCsrfPair(raw, header)) {
    return res.status(403).json({ error: "Falha na validação CSRF" });
  }

  return next();
}
