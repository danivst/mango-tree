/**
 * @file get-translation.ts
 * @description Utility for retrieving localized text based on user language preference.
 * Supports bilingual content (English and Bulgarian) throughout the application.
 */

import { Translation } from "@mangotree/shared";

/**
 * Selects the appropriate translation string.
 * Logic defaults to English unless the user's preference is explicitly set to Bulgarian ('bg').
 *
 * @param userLang - The language code stored in user profile
 * @param translations - Object containing 'bg' and 'en' keys
 * @returns The translated string
 *
 * @example
 * ```typescript
 * const text = getLocalizedText("bg", { en: "Hello", bg: "Здравей" });
 * // returns "Здравей"
 * ```
 */
export const getLocalizedText = (
  userLang: string,
  translations: Translation,
): string => {
  const normalizedLang = String(userLang || "").trim().toLowerCase();

  const prefersBulgarian = normalizedLang === "bg" || normalizedLang === "bulgarian" || normalizedLang === "bg-bg";

  if (prefersBulgarian) {
    return translations.bg || translations.en || "";
  } 

  return translations.en || translations.bg || "";
};
