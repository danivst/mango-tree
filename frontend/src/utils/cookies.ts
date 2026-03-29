/**
 * @file cookies.ts
 * @description Utility functions for managing browser cookies.
 * Provides simple setters/getters for cookie persistence (e.g., theme, language preferences).
 */

/**
 * Set a cookie with a specified name, value, and expiry in days.
 *
 * @function setCookie
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value (will be URI-encoded by the browser)
 * @param {number} days - Number of days until the cookie expires
 * @param {string} [path="/"] - Cookie path (default: root)
 * @returns {void}
 *
 * @example
 * ```ts
 * setCookie('theme', 'dark', 30);
 * ```
 */
export const setCookie = (
  name: string,
  value: string,
  days: number,
  path: string = "/",
) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=${path}`;
};

/**
 * Get the value of a cookie by name.
 *
 * @function getCookie
 * @param {string} name - Cookie name to retrieve
 * @returns {string | null} The cookie value if found, otherwise null
 */
export const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

/**
 * Delete a cookie by setting its expiration to the past.
 *
 * @function deleteCookie
 * @param {string} name - Cookie name to delete
 * @param {string} [path="/"] - Cookie path (must match the original path)
 * @returns {void}
 */
export const deleteCookie = (name: string, path: string = "/") => {
  document.cookie = `${name}=; Max-Age=-99999999;path=${path}`;
};

/**
 * Alias for deleteCookie for consistency with naming conventions.
 * @function clearCookie
 */
export const clearCookie = deleteCookie;
