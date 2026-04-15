const COOKIE_NAME = "access_token";
const TWO_H_MS = 2 * 60 * 60 * 1000;

/**
 * Padrão: "strict" (CSRF). Se o front (ex.: Vercel) e a API (ex.: Render) forem
 * domínios diferentes, defina COOKIE_SAMESITE=none (e HTTPS em produção).
 */
function getSameSite() {
  const env = process.env.COOKIE_SAMESITE;
  if (env === "strict" || env === "lax" || env === "none") return env;
  return "strict";
}

function isSecureCookie(sameSite) {
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
