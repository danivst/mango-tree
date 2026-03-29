/**
 * @file get-translation.ts
 * @description Utility for retrieving localized text based on user language preference.
 * Supports bilingual content (English and Bulgarian) throughout the application.
 */

/**
 * Translation object containing both English and Bulgarian text.
 */
export interface Translation {
  bg: string;
  en: string;
}

/**
 * Retrieves the appropriate localized string based on the user's language.
 * Defaults to English ("en") if the language is not Bulgarian.
 *
 * @param userLang - User's preferred language code ("en" or "bg")
 * @param translations - Object containing both bg and en translations
 * @returns Localized string matching the user's language
 *
 * @example
 * ```typescript
 * const text = getLocalizedText(user.language, {
 *   bg: "Добре дошъл",
 *   en: "Welcome"
 * });
 * // Returns "Добре дошъл" if userLang === "bg"
 * ```
 */
export const getLocalizedText = (
  userLang: string,
  translations: Translation,
): string => {
  return userLang === "bg" ? translations.bg : translations.en;
};
