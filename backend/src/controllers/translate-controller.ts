/**
 * @file translate-controller.ts
 * @description Provides on-demand text translation using DeepL API.
 * Translates any text to both English and Bulgarian, returns requested target.
 */

import { Request, Response } from "express";
import { getDualTranslation } from "../utils/translation";
import logger from "../utils/logger";

/**
 * Translates text into a target language.
 * Fetches dual translations (EN/BG) and returns the requested one.
 *
 * @param req - Request with body { text, targetLang }
 * @param res - Express response object
 * @returns Response with translated text
 * @throws {Error} Translation service error
 *
 * @example
 * ```json
 * Request body:
 * { "text": "Hello", "targetLang": "bg" }
 * ```
 * @response
 * ```json
 * { "translation": "Здравей" }
 * ```
 */
export const translateText = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { text, sourceLang, targetLang } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Text is required for translation." });
    }

    if (!targetLang || !["en", "bg"].includes(targetLang)) {
      return res.status(400).json({ message: "Invalid target language. Use 'en' or 'bg'." });
    }

    const translation = await getDualTranslation(text);

    return res.json({ translation: translation[targetLang as "en" | "bg"] });
  } catch (error: any) {
    logger.error(error, "Translation error");
    return res.status(500).json({ message: error.message || "Translation failed" });
  }
};
