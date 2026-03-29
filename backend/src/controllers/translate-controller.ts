import { Request, Response } from "express";
import { getDualTranslation } from "../utils/translation";

/**
 * @file translate-controller.ts
 * @description Provides on-demand text translation using DeepL API.
 * Translates any text to both English and Bulgarian, returns requested target.
 */

/**
 * Translates text to the specified target language.
 * Uses DeepL to get both translations, then returns the requested one.
 *
 * @param req - Request with body { text, sourceLang?, targetLang: 'en'|'bg' }
 * @param res - Response with { translation: string }
 * @returns 200 with translated text, 400 if text missing or invalid targetLang
 */
export const translateText = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { text, sourceLang, targetLang } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Text is required for translation." });
    }

    // Validate target language
    if (!targetLang || !['en', 'bg'].includes(targetLang)) {
      return res.status(400).json({ message: "Invalid target language. Use 'en' or 'bg'." });
    }

    // Get translations for both languages
    const translation = await getDualTranslation(text);

    // Return only the target language translation
    return res.json({ translation: translation[targetLang as 'en' | 'bg'] });
  } catch (error: any) {
    console.error("Translation error:", error);
    return res.status(500).json({ message: error.message || "Translation failed" });
  }
};
