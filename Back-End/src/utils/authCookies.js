const COOKIE_NAME = "access_token";
const TWO_H_MS = 2 * 60 * 60 * 1000;

/**
 * sameSite:
 * - strict: só same-site (proxy ou API no mesmo domínio do SPA).
 * - lax: alguns fluxos cross-site (não cobre fetch XHR entre domínios diferentes).
 * - none: obrigatório quando front e API estão em domínios diferentes (Vercel + Render).
 *
 * Env: COOKIE_SAMESITE=strict|lax|none
 * Se não definido: produção → none; desenvolvimento → lax (HTTP local seguro).
 */
function getSameSite() {
  const env = process.env.COOKIE_SAMESITE;
  if (env === "strict" || env === "lax" || env === "none") return env;
  if (process.env.NODE_ENV === "production") return "none";
  return "lax";
}

/**
 * secure:
 * - sameSite=none exige secure=true (HTTPS).
 * - HTTP local: secure=false (COOKIE_SECURE=false ou dev sem HTTPS).
 *
 * Env: COOKIE_SECURE=true|false (opcional)
 */
function isSecureCookie(sameSite) {
  if (process.env.COOKIE_SECURE === "false") return false;
  if (process.env.COOKIE_SECURE === "true") return true;
  if (sameSite === "none") return true;
  return process.env.NODE_ENV === "production";
}

export function getAccessTokenCookieOptions() {
  const sameSite = getSameSite();
  return {
    httpOnly: true,
    secure: isSecureCookie(sameSite),
    sameSite,
    maxAge: TWO_H_MS,
    path: "/",
  };
}

export function setAccessTokenCookie(res, token) {
  res.cookie(COOKIE_NAME, token, getAccessTokenCookieOptions());
}

export function clearAccessTokenCookie(res) {
  const sameSite = getSameSite();
  const secure = isSecureCookie(sameSite);
  res.clearCookie(COOKIE_NAME, {
    path: "/",
    httpOnly: true,
    secure,
    sameSite,
  });
}

export { COOKIE_NAME };
