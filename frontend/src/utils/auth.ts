/**
 * @file auth.ts
 * @description Authentication utilities for managing authentication state.
 * With HttpOnly cookies, most token operations are handled server-side.
 */

/**
 * Clear all authentication-related data from storage.
 * NOTE: With HttpOnly cookies, tokens are cleared server-side during logout.
 * This function is now a no-op but kept for API compatibility.
 * Note: Theme and language preferences are NOT cleared here; they are
 * user preferences that should persist across logout.
 *
 * @function clearAuth
 * @returns {void}
 */
export const clearAuth = (): void => {
};
