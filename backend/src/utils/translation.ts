// backend/utils/translator.ts
import fetch from "node-fetch";

/**
 * Interface for the translation response
 */
export interface TranslationResult {
  bg: string;
  en: string;
}

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const DEEPL_URL = "https://api-free.deepl.com/v2/translate";

if (!DEEPL_API_KEY) {
  console.warn(
    "WARNING: DEEPL_API_KEY is not defined in environment variables.",
  );
}

/**
 * Translates text into both Bulgarian and English.
 * @param text - The string to be translated.
 */
export const getDualTranslation = async (
  text: string,
): Promise<TranslationResult> => {
  if (!text) throw new Error("No text provided for translation.");

  // Helper to call DeepL API
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

    // Parallel execution for auto-detection
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
