/**
 * @file useAuth.ts
 * @description Custom hook that consolidates authentication utilities and state.
 * Provides reactive authentication data and helper functions for auth operations.
 *
 * Centralizes all auth-related logic into a single reusable hook that components
 * can use instead of manually calling individual auth utilities.
 *
 * @example
 * ```typescript
 * const { userId, isAuthenticated, role, clearAuth } = useAuth();
 *
 * if (!isAuthenticated) {
 *   navigate('/login');
 * }
 *
 * // Check role
 * if (role === 'admin') {
 *   // Show admin features
 * }
 * ```
 *
 * @interface UseAuthReturn
 * @property {string | null} userId - Current user's MongoDB ObjectId (from JWT)
 * @property {boolean} isAuthenticated - Whether user is logged in with valid token
 * @property {string | null} role - User's role ('user' | 'admin' | null)
 * @property {string | null} token - Current JWT access token
 * @property {boolean} tokenValid - Whether the token is valid (not expired)
 * @property {() => void} clearAuth - Clear all auth data (logout)
 * @property {(token: string, refreshToken: string, rememberMe?: boolean) => void} setAuthTokens - Store auth tokens
 * @property {() => string | null} getUsername - Get username from token (may return null)
 */

import { useMemo } from 'react';
import {
  getCurrentUserId,
  getToken,
  isTokenValid,
  getUserRole,
  clearAuth as clearAuthStorage,
  setAuthTokens as storeAuthTokens
} from './auth';

/**
 * Custom hook for authentication state and operations.
 * Memoizes computed values to prevent unnecessary recalculations.
 *
 * @function useAuth
 * @returns {UseAuthReturn} Authentication state and utility functions
 */
export const useAuth = () => {
  // Memoize token retrieval
  const token = useMemo(() => getToken(), []);

  // Memoize userId extraction
  const userId = useMemo(() => getCurrentUserId(), []);

  // Memoize role extraction
  const role = useMemo(() => getUserRole(), []);

  // Memoize authentication status
  const isAuthenticated = useMemo(() => {
    return !!token && isTokenValid();
  }, [token]);

  // Memoize token validity
  const tokenValid = useMemo(() => {
    return isTokenValid();
  }, []);

  return {
    userId,
    isAuthenticated,
    role,
    token,
    tokenValid,
    clearAuth: clearAuthStorage,
    setAuthTokens: storeAuthTokens
  };
};

export default useAuth;
