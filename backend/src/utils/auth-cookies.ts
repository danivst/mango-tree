import type { CookieOptions, Response } from "express";

type SameSiteOption = "lax" | "none";

const isProd = process.env.NODE_ENV === "production";

export const AUTH_COOKIE_NAMES = {
  access: "token",
  refresh: "refreshToken",
} as const;

export function getAuthCookieOptions(): CookieOptions {
  // In production, frontend/backend may be on different origins, so we need
  // SameSite=None; Secure for cookies to be accepted by modern browsers.
  // In local dev, we usually rely on Vite proxy (same-origin to the browser),
  // so SameSite=Lax keeps cookies working over plain http.
  const sameSite: SameSiteOption = isProd ? "none" : "lax";
  const secure = isProd;

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
  };
}

export function setAuthCookies(res: Response, token: string, refreshToken: string) {
  const base = getAuthCookieOptions();

  res.cookie(AUTH_COOKIE_NAMES.access, token, {
    ...base,
    maxAge: 24 * 60 * 60 * 1000, // 24h
  });

  res.cookie(AUTH_COOKIE_NAMES.refresh, refreshToken, {
    ...base,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
  });
}

export function clearAuthCookies(res: Response) {
  const base = getAuthCookieOptions();

  // Must match the original cookie attributes (at least `path`, and often
  // `sameSite`/`secure`) or the browser may keep the old cookies.
  res.clearCookie(AUTH_COOKIE_NAMES.access, base);
  res.clearCookie(AUTH_COOKIE_NAMES.refresh, base);
}

