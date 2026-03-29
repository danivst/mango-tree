import { jwtDecode } from "jwt-decode";
import { clearCookie } from "./cookies";
import type { RoleType } from "./types";

/**
 * @file auth.ts
 * @description Authentication utilities for managing JWT tokens,
 * validation, and role extraction. Provides helpers to check login state,
 * get current user role, and safely clear authentication data.
 */

/**
 * Payload structure for decoded JWT tokens (client-side).
 * Includes expiration and role information needed for token validation.
 *
 * @interface TokenPayload
 * @property {string} userId - MongoDB ObjectId of the user
 * @property {string} role - User's role (USER or ADMIN)
 * @property {number} exp - Expiration timestamp (seconds since epoch)
 * @property {number} iat - Issued-at timestamp (seconds since epoch)
 */
interface TokenPayload {
  userId: string;
  role: string;
  exp: number;
  iat: number;
}

/**
 * Check if the current access token is valid (not expired).
 * Also handles "Remember me" extended expiration if present.
 *
 * @function isTokenValid
 * @returns {boolean} True if token exists and is not expired, false otherwise
 */
export const isTokenValid = (): boolean => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    const currentTime = Date.now() / 1000;

    // Check if token is expired
    if (decoded.exp < currentTime) {
      // Check if user has extended expiration from "Remember me"
      const extendedExpiration = localStorage.getItem("tokenExpiration");
      if (extendedExpiration) {
        const expirationDate = new Date(extendedExpiration);
        if (expirationDate > new Date()) {
          // Extended expiration is still valid, keep token
          return true;
        } else {
          // Extended expiration has also expired
          localStorage.removeItem("tokenExpiration");
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          return false;
        }
      }

      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      return false;
    }

    return true;
  } catch (error) {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("tokenExpiration");
    return false;
  }
};

/**
 * Get the current access token from localStorage.
 *
 * @function getToken
 * @returns {string | null} The JWT token if present, otherwise null
 */
export const getToken = (): string | null => {
  return localStorage.getItem("token");
};

/**
 * Clear all authentication-related data from storage.
 * Removes token, refresh token, and extended expiration.
 * Also clears theme and language cookies used for preferences.
 *
 * @function clearAuth
 * @returns {void}
 */
export const clearAuth = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("tokenExpiration");
  // Clear theme and language preferences on logout
  clearCookie("appTheme");
  clearCookie("appLanguage");
};

/**
 * Extract the user's role from the JWT token.
 *
 * @function getUserRole
 * @returns {'user' | 'admin' | null} The user's role if authenticated, otherwise null
 */
export const getUserRole = (): RoleType | null => {
  const token = getToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    return decoded.role as RoleType || null;
  } catch (error) {
    return null;
  }
};

/**
 * Get the username from the JWT token.
 * Note: The token may not contain the username; if not present, returns null.
 * In that case, the username should be fetched from the API via getUser.
 *
 * @function getUsername
 * @returns {string | null} The username if available, otherwise null
 */
export const getUsername = (): string | null => {
  const token = getToken();
  if (!token) return null;

  try {
    // Username might not be in token, we'd need to fetch from API
    return null;
  } catch (error) {
    return null;
  }
};
