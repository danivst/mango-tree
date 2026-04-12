/**
 * @file validators.ts
 * @description Reusable form validation functions.
 * Centralizes common validation patterns to reduce duplication across components.
 *
 * All validators return null if valid, or an error message key (for i18n) if invalid.
 * Error keys should correspond to translation keys in the translation files.
 *
 * @example
 * ```typescript
 * const error = validators.username(username);
 * if (error) {
 * setErrors({ username: t(error) });
 * }
 * ```
 */

/**
 * Validation result type - null means valid, string is error message key
 */
export type ValidationResult = string | null;

/**
 * Validator function type
 */
export type ValidatorFn = (value: string, ...args: any[]) => ValidationResult;

/**
 * Username validation
 * Checks for presence and minimum length (default 3 characters).
 *
 * @param username - The username to validate
 * @param minLength - Minimum required length (default: 3)
 * @returns ValidationResult - null if valid, error key if invalid
 *
 * @errorKeys
 * - "usernameRequired" (when empty)
 * - "usernameMinLength" (when too short)
 */
export const validateUsername = (
  username: string,
  minLength: number = 3
): ValidationResult => {
  if (!username?.trim()) {
    return 'usernameRequired';
  }
  if (username.trim().length < minLength) {
    return 'usernameMinLength';
  }
  return null;
};

/**
 * Email validation
 * Checks for presence and basic format (must contain '@').
 *
 * @param email - The email to validate
 * @returns ValidationResult - null if valid, error key if invalid
 *
 * @errorKeys
 * - "emailRequired" (when empty)
 * - "emailMustContain" (when missing '@')
 * - "emailInvalid" (for regex failure)
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email?.trim()) {
    return 'emailRequired';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'emailInvalid';
  }
  return null;
};

/**
 * Password validation
 * Checks for presence and complexity.
 *
 * @param password - The password to validate
 * @returns ValidationResult - null if valid, error key if invalid
 *
 * @errorKeys
 * - "passwordRequired" (when empty)
 * - "passwordMinLength" (when < 8)
 * - "passwordComplexityRequirement" (when missing character types)
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return 'passwordRequired';
  }
  if (password.length < 8) {
    return 'passwordMinLength';
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
    return 'passwordComplexityRequirement';
  }
  return null;
};

/**
 * Two-Factor Authentication code validation
 * Validates 6-digit numeric code.
 *
 * @param code - The 2FA code to validate
 * @returns ValidationResult - null if valid, error key if invalid
 *
 * @errorKeys
 * - "invalid2FACode" (when format is invalid)
 */
export const validateTwoFactorCode = (code: string): ValidationResult => {
  if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
    return 'invalid2FACode';
  }
  return null;
};

/**
 * General required field validation
 * Checks if a value is present (after optional trim).
 *
 * @param value - The value to validate
 * @param fieldName - Name of the field (used in error key, e.g., "confirmPasswordRequired")
 * @param trim - Whether to trim whitespace before checking (default: true)
 * @returns ValidationResult - null if valid, error key if invalid
 *
 * @errorKeys
 * - "{fieldName}Required" (when empty)
 */
export const validateRequired = (
  value: string,
  fieldName: string,
  trim: boolean = true
): ValidationResult => {
  const checkValue = trim ? value?.trim() : value;
  if (!checkValue) {
    return `${fieldName}Required`;
  }
  return null;
};

/**
 * Min length validation
 * Checks if a string meets minimum length requirement.
 *
 * @param value - The value to validate
 * @param minLength - Required minimum length
 * @param errorKey - Error message key to return (default: "minLength")
 * @returns ValidationResult - null if valid, error key if invalid
 */
export const validateMinLength = (
  value: string,
  minLength: number,
  errorKey: string = 'minLength'
): ValidationResult => {
  if (!value || value.length < minLength) {
    return errorKey;
  }
  return null;
};

/**
 * Password confirmation validation
 * Checks if two password fields match.
 *
 * @param password - The original password
 * @param confirmPassword - The confirmation password
 * @returns ValidationResult - null if valid, error key if invalid
 *
 * @errorKeys
 * - "passwordsDoNotMatch" (when they differ)
 */
export const validatePasswordMatch = (
  password: string,
  confirmPassword: string
): ValidationResult => {
  if (password !== confirmPassword) {
    return 'passwordsDoNotMatch';
  }
  return null;
};