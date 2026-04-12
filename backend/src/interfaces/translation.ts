/**
 * @interface TranslationResult
 * @description Bilingual translation structure for dynamically stored text.
 * Stores both Bulgarian (bg) and English (en) versions of content.
 *
 * @property {string} bg - Bulgarian content
 * @property {string} en - English content
 */
export interface TranslationResult {
  bg: string;
  en: string;
}