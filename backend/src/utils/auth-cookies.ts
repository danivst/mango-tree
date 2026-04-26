/**
 * @file auth-cookies.ts
 * @description Utility for managing authentication cookies (JWT access token).
 * Handles cross-environment cookie configuration for security and compatibility.
 *
 * Features:
 * - Dynamic SameSite/Secure configuration based on environment
 * - Standardized cookie name for access token
 * - Helper functions for setting and clearing auth state on the client
 */

import type { CookieOptions, Response } from "express";

type SameSiteOption = "lax";

/**
 * Enhanced environment check.
 */
const isRealProd = process.env.NODE_ENV === "production" && process.env.USE_SECURE_COOKIES === "true";

/**
 * Constant identifiers for authentication cookies to ensure consistency 
 * across set, get, and clear operations.
 */
export const AUTH_COOKIE_NAMES = {
  access: "token",
} as const;

/**
 * Generates the base configuration for authentication cookies.
 * Adjusts security settings based on the environment to ensure cookies are 
 * accepted in both local development and production (cross-origin) setups.
 *
 * @returns {CookieOptions} Express cookie options with httpOnly, secure, and sameSite set
 */
export function getAuthCookieOptions(): CookieOptions {
  const sameSite: SameSiteOption = "lax";
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
 * Sets appropriate expiration time for access token.
 *
 * @param res - Express response object
 * @param token - The JWT access token string
 * @param maxAgeMs - Optional cookie maxAge override (milliseconds)
 *
 * @example
 * ```typescript
 * setAuthCookies(res, "header.payload.sig");
 * ```
 */
export function setAuthCookies(res: Response, token: string, maxAgeMs?: number) {
  const base = getAuthCookieOptions();

  res.cookie(AUTH_COOKIE_NAMES.access, token, {
    ...base,
    maxAge: maxAgeMs ?? 24 * 60 * 60 * 1000, // default 24h
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

  // Must match the original cookie attributes
  res.clearCookie(AUTH_COOKIE_NAMES.access, base);
}