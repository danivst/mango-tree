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
 * @property {string | null} userId - Current user's MongoDB ObjectId
 * @property {boolean} isAuthenticated - Whether user is logged in with valid token
 * @property {string | null} role - User's role ('user' | 'admin' | null)
 * @property {string | null} token - Always null since tokens are in HttpOnly cookies
 * @property {boolean} tokenValid - Whether the token is valid (user data available)
 * @property {boolean} loading - Whether user data is being fetched
 * @property {string | null} error - Error message if authentication failed
 * @property {UserProfile | null} user - Full user profile data
 * @property {() => void} clearAuth - Clear auth state (actual logout happens server-side)
 * @property {(token: string, refreshToken: string, rememberMe?: boolean) => void} setAuthTokens - No-op since tokens are server-side
 * @property {() => string | null} getUsername - Get username from user data
 */

import { useMemo, useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import type { UserProfile, RoleType } from './types';

/**
 * Custom hook for authentication state and operations.
 * Fetches user data from /users/me endpoint since tokens are in HttpOnly cookies.
 *
 * @function useAuth
 * @returns {UseAuthReturn} Authentication state and utility functions
 */
export const useAuth = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await usersAPI.getCurrentUser();
        setUser(userData);
        setError(null);
      } catch (err) {
        // If we get 401, user is not authenticated
        setUser(null);
        setError('Not authenticated');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Memoize computed values
  const userId = useMemo(() => user?._id || null, [user]);
  const isAuthenticated = useMemo(() => !!user && !loading, [user, loading]);
  const role = useMemo(() => (user?.role as RoleType) || null, [user]);
  const tokenValid = useMemo(() => !!user, [user]); // If we have user data, token is valid

  return {
    userId,
    isAuthenticated,
    role,
    token: null, // Tokens are not accessible client-side
    tokenValid,
    loading,
    error,
    user,
    clearAuth: () => {
      setUser(null);
      setError(null);
      // Note: Actual logout happens server-side when calling /auth/logout
    },
    setAuthTokens: () => {
      // Tokens are set server-side, no client-side action needed
    },
    getUsername: () => user?.username || null,
  };
};

export default useAuth;
