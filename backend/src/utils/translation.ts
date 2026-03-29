/**
 * @file translation.ts
 * @description Integration with DeepL Translation API for automatic bilingual content.
 * Provides async translation services to generate both English and Bulgarian versions
 * of user-generated content (bio, post content, etc.).
 */

import fetch from "node-fetch";
import { TranslationResult } from "../interfaces/translation";

/**
 * DeepL API configuration
 */
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const DEEPL_URL = "https://api-free.deepl.com/v2/translate";

/**
 * Logs warning if DeepL API key is not configured.
 * Translation features will fail without this environment variable.
 */
if (!DEEPL_API_KEY) {
  console.warn("WARNING: DEEPL_API_KEY is not defined in environment variables.");
}

// Re-export the TranslationResult interface for consumers of this utility
export type { TranslationResult } from "../interfaces/translation";

/**
 * Translates text to both Bulgarian and English using DeepL API.
 * Performs parallel requests for efficiency.
 *
 * @param text - The text to translate (must be non-empty)
 * @returns Promise resolving to { bg: string, en: string } with translations
 * @throws {Error} If text is empty or translation fails
 *
 * @example
 * ```typescript
 * const translations = await getDualTranslation("Hello, world!");
 * // Returns { bg: "Здравей, свят!", en: "Hello, world!" }
 * ```
 */
export const getDualTranslation = async (
  text: string
): Promise<TranslationResult> => {
  if (!text) {
    throw new Error("No text provided for translation.");
  }

  /**
   * Helper function to translate text to a specific target language.
   *
   * @param target - Target language code ("BG" for Bulgarian, "EN-US" for English)
   * @returns Translated text string
   */
  const translate = async (target: "BG" | "EN-US"): Promise<string> => {
    const res = await fetch(DEEPL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
      },
      body: `text=${encodeURIComponent(text)}&target_lang=${target}`,
    });

    if (!res.ok) {
      const errorData = (await res.json().catch(() => ({}))) as any;
      throw new Error(errorData.message || `DeepL API error: ${res.status}`);
    }

    const data = (await res.json()) as { translations: { text: string }[] };
    return data.translations[0].text;
  };

  try {
    const result: TranslationResult = { bg: "", en: "" };

    // Execute both translation requests in parallel for optimal performance
    const [bgRes, enRes] = await Promise.all([
      translate("BG"),
      translate("EN-US"),
    ]);

    result.bg = bgRes;
    result.en = enRes;

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Translation Module: ${message}`);
  }
};
