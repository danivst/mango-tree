/**
 * @file auth-cookies.ts
 * @description Utility for managing authentication cookies (JWT and Refresh tokens).
 * Handles cross-environment cookie configuration for security and compatibility.
 *
 * Features:
 * - Dynamic SameSite/Secure configuration based on environment
 * - Standardized cookie names for access and refresh tokens
 * - Helper functions for setting and clearing auth state on the client
 */

import type { CookieOptions, Response } from "express";

type SameSiteOption = "lax" | "none";

/**
 * Enhanced environment check.
 * We only want 'Secure' and 'SameSite=None' if we are on a real HTTPS production server.
 * In local Docker/localhost, USE_SECURE_COOKIES should be "false".
 */
const isRealProd = process.env.NODE_ENV === "production" && process.env.USE_SECURE_COOKIES === "true";

/**
 * Constant identifiers for authentication cookies to ensure consistency 
 * across set, get, and clear operations.
 */
export const AUTH_COOKIE_NAMES = {
  access: "token",
  refresh: "refreshToken",
} as const;

/**
 * Generates the base configuration for authentication cookies.
 * Adjusts security settings based on the environment to ensure cookies are 
 * accepted in both local development and production (cross-origin) setups.
 *
 * @returns {CookieOptions} Express cookie options with httpOnly, secure, and sameSite set
 */
export function getAuthCookieOptions(): CookieOptions {
  // In production, frontend/backend may be on different origins, so we need
  // SameSite=None; Secure for cookies to be accepted by modern browsers.
  // In local dev, we rely on Lax and No-Secure to keep cookies working over plain http.
  const sameSite: SameSiteOption = isRealProd ? "none" : "lax";
  const secure = isRealProd;

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
  };
}

/**
 * Attaches authentication tokens to the Express response object as cookies.
 * Sets appropriate expiration times: 24 hours for access and 7 days for refresh.
 *
 * @param res - Express response object
 * @param token - The JWT access token string
 * @param refreshToken - The refresh token string
 *
 * @example
 * ```typescript
 * setAuthCookies(res, "header.payload.sig", "refresh-uuid");
 * ```
 */
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

/**
 * Removes authentication cookies from the client.
 * Uses the base cookie options to ensure the browser matches the attributes 
 * (path, sameSite) required to successfully delete the cookies.
 *
 * @param res - Express response object
 */
export function clearAuthCookies(res: Response) {
  const base = getAuthCookieOptions();

  // Must match the original cookie attributes (at least `path`, and often
  // `sameSite`/`secure`) or the browser may keep the old cookies.
  res.clearCookie(AUTH_COOKIE_NAMES.access, base);
  res.clearCookie(AUTH_COOKIE_NAMES.refresh, base);
}