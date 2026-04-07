/**
 * @file language.ts
 * @description Language detection and utility functions.
 * Provides simple heuristics for detecting content language based on character sets.
 *
 * Currently supports detection of Bulgarian (Cyrillic) vs English (Latin).
 * Can be extended for other languages as needed.
 */

/**
 * Supported language codes
 * @typedef {'en' | 'bg'} SupportedLanguage
 */

/**
 * Simple language detection based on character sets.
 * Checks for Cyrillic characters to identify Bulgarian text.
 *
 * @function detectLanguage
 * @param {string} text - The text to analyze
 * @returns {'en' | 'bg'} Detected language code (defaults to 'en')
 *
 * @example
 * ```typescript
 * const lang = detectLanguage("Hello world"); // returns 'en'
 * const lang = detectLanguage("Здравей свят"); // returns 'bg'
 * ```
 */
export const detectLanguage = (text: string): 'en' | 'bg' => {
  if (!text || typeof text !== 'string') {
    return 'en';
  }

  // Check for Cyrillic characters (Bulgarian alphabet range)
  // Matches characters in the ranges: А-я (Cyrillic)
  if (/[а-яА-Я]/.test(text)) {
    return 'bg';
  }

  return 'en';
};

/**
 * Get the display name for a language code.
 * Useful for UI labels in language switchers.
 *
 * @function getLanguageDisplayName
 * @param {string} langCode - Language code ('en', 'bg', etc.)
 * @returns {string} Human-readable language name
 */
export const getLanguageDisplayName = (langCode: string): string => {
  const names: Record<string, string> = {
    en: 'English',
    bg: 'Български',
  };

  return names[langCode] || langCode.toUpperCase();
};

/**
 * Check if a text is in the user's preferred language.
 * Compares detected text language with user's UI language.
 *
 * @function isTextInUserLanguage
 * @param {string} text - Text to check
 * @param {'en' | 'bg'} userLanguage - User's current UI language
 * @returns {boolean} True if text matches user's language
 */
export const isTextInUserLanguage = (
  text: string,
  userLanguage: 'en' | 'bg'
): boolean => {
  const detected = detectLanguage(text);
  return detected === userLanguage;
};
