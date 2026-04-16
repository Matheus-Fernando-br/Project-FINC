import Tokens from "csrf";
import { getAccessTokenCookieOptions } from "./authCookies.js";

export const CSRF_COOKIE_NAME = "csrf_token";
const tokens = new Tokens();

function getCsrfCookieOptions() {
  const authCookie = getAccessTokenCookieOptions();
  return {
    httpOnly: false,
    secure: authCookie.secure,
    sameSite: authCookie.sameSite,
    maxAge: authCookie.maxAge,
    path: "/",
  };
}

export function issueCsrfToken(res) {
  const secret = tokens.secretSync();
  const token = tokens.create(secret);
  const value = `${secret}.${token}`;
  res.cookie(CSRF_COOKIE_NAME, value, getCsrfCookieOptions());
  return value;
}

export function clearCsrfToken(res) {
  const opts = getCsrfCookieOptions();
  res.clearCookie(CSRF_COOKIE_NAME, {
    path: opts.path,
    secure: opts.secure,
    sameSite: opts.sameSite,
  });
}

export function hasValidCsrfPair(rawCookie, headerToken) {
  if (!rawCookie || !headerToken || typeof rawCookie !== "string") return false;
  const sep = rawCookie.indexOf(".");
  if (sep <= 0) return false;
  const secret = rawCookie.slice(0, sep);
  const cookieToken = rawCookie.slice(sep + 1);
  if (!secret || !cookieToken) return false;
  if (cookieToken !== headerToken) return false;
  return tokens.verify(secret, headerToken);
}
