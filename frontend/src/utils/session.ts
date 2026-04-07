/**
 * @file session.ts
 * @description Session storage utility wrapper.
 * Provides typed access to sessionStorage with helpers for common patterns.
 *
 * Session storage persists for the duration of the page session
 * (cleared when browser/tab is closed). Used for temporary flags and state.
 */

/**
 * Enum of standard session flags used across the app
 */
export const SessionFlag = {
  ACCOUNT_DELETED: 'accountDeleted',
  SESSION_EXPIRED: 'sessionExpired',
  ACCOUNT_SUSPENDED: 'accountSuspended',
  SUSPENSION_REASON: 'suspensionReason',
  RETURN_URL: 'returnUrl',
  MUST_CHANGE_PASSWORD: 'mustChangePassword'
} as const;

/**
 * Set a value in sessionStorage
 */
export const sessionSetItem = (key: string, value: string): void => {
  try {
    window.sessionStorage.setItem(key, value);
  } catch (error) {
    console.error(`Failed to set sessionStorage key '${key}':`, error);
  }
};

/**
 * Get a value from sessionStorage
 */
export const sessionGetItem = (key: string): string | null => {
  try {
    return window.sessionStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to get sessionStorage key '${key}':`, error);
    return null;
  }
};

/**
 * Remove a specific key from sessionStorage
 */
export const sessionRemoveItem = (key: string): void => {
  try {
    window.sessionStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove sessionStorage key '${key}':`, error);
  }
};

/**
 * Set a boolean flag in sessionStorage (stores 'true' or 'false')
 */
export const sessionSetFlag = (flag: string, value: boolean): void => {
  sessionSetItem(flag, value ? 'true' : 'false');
};

/**
 * Get a boolean flag from sessionStorage
 */
export const sessionGetFlag = (flag: string): boolean => {
  return sessionGetItem(flag) === 'true';
};

/**
 * Consume a flag: returns its value and removes it from storage.
 * Useful for one-time notifications that should only show once.
 *
 * @example
 * ```typescript
 * // In Login.tsx:
 * const accountDeleted = sessionConsumeFlag(SessionFlag.ACCOUNT_DELETED);
 * if (accountDeleted) {
 *   showSuccess(t('accountDeletedSuccessfully'));
 * }
 * ```
 */
export const sessionConsumeFlag = (flag: string): boolean => {
  const value = sessionGetFlag(flag);
  if (value) {
    sessionRemoveItem(flag);
  }
  return value;
};

/**
 * Get a flag and optionally clear it (or related flags)
 */
export const sessionConsumeWithRelated = (
  flag: string,
  relatedFlags: string[] = []
): boolean => {
  const value = sessionGetFlag(flag);
  if (value) {
    sessionRemoveItem(flag);
    relatedFlags.forEach(related => sessionRemoveItem(related));
  }
  return value;
};

/**
 * Clear all session storage (useful for logout)
 */
export const clearSessionStorage = (): void => {
  try {
    window.sessionStorage.clear();
  } catch (error) {
    console.error('Failed to clear sessionStorage:', error);
  }
};
