/**
 * @file ai.ts
 * @description AI-powered content moderation using Google Gemini API.
 * Implements a queue-based system to respect rate limits (10 requests/minute).
 * Supports both post moderation (cooking-related + safety) and comment moderation (safety only).
 */

import axios from "axios";
import logger from "../utils/logger";
import { GEMINI_API_KEY, GEMINI_MODEL_DEFAULT } from "../config/env";
import {
  ModerationResult,
  GeminiPart,
  GeminiRequest,
  QueueItem
} from "../interfaces/moderation";

/**
 * Axios instance with predefined headers
 */
const aiClient = axios.create({
  headers: {
    "User-Agent": "MangoTree/1.0.0",
    "Content-Type": "application/json"
  }
});

/**
 * Gemini model configuration
 */
const GEMINI_MODEL = GEMINI_MODEL_DEFAULT || "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * In-memory queue for moderation requests to prevent exceeding API rate limits.
 */
const moderationQueue: QueueItem[] = [];
let isProcessingQueue = false;

/**
 * Rate limiting: Maximum 10 requests per minute (60000ms / 10 = 6000ms between requests)
 */
const MAX_REQUESTS_PER_MINUTE = 10;
const REQUEST_INTERVAL = 60000 / MAX_REQUESTS_PER_MINUTE;

/**
 * Content types that can be moderated.
 */
export type ContentType = 'post' | 'comment';

/**
 * Options for content moderation.
 */
export interface ModerateOptions {
  /** Whether to check if content is cooking-related (true for posts, false for comments) */
  checkCookingRelated: boolean;
}

/**
 * Internal helper to communicate with Gemini API.
 * Sends text and optional images for analysis using a structured JSON schema response.
 *
 * @param title - Content title
 * @param content - Body text
 * @param images - Base64 image strings
 * @param checkCookingRelated - Whether to enforce food-relevance checks
 * @returns ModerationResult object
 * @throws {Error} If API returns 429 or empty response
 */
const moderateWithGemini = async (
  title: string,
  content: string,
  images?: string[],
  checkCookingRelated: boolean = true
): Promise<ModerationResult> => {
  try {
    const imageCount = images?.length || 0;
    let prompt: string;

    // Build prompt based on content type
    if (checkCookingRelated) {
      prompt = `Moderation Task: Check if content is cooking-related and appropriate for a food social app.
      Title: ${title}
      Content: ${content}
      Images provided: ${imageCount}`;
    } else {
      // Safety-only check for comments
      prompt = `Moderation Task: Check if this comment is appropriate.
      Content: ${content}`;
    }

    const parts: GeminiPart[] = [{ text: prompt }];

    // Add images in Gemini base64 format if provided
    if (images && images.length > 0) {
      images.forEach((img) => {
        let base64Data = img.includes(";base64,") ? img.split(";base64,")[1] : img;
        let mimeType = "image/jpeg";
        if (img.startsWith("data:image/png")) mimeType = "image/png";
        if (img.startsWith("data:image/webp")) mimeType = "image/webp";

        parts.push({
          inline_data: { data: base64Data, mime_type: mimeType }
        });
      });
    }

    const requestBody: GeminiRequest = {
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 200,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            isCookingRelated: { type: "BOOLEAN" },
            isAppropriate: { type: "BOOLEAN" },
            flagged: { type: "BOOLEAN" },
            reason: { type: "STRING" }
          },
          required: ["isCookingRelated", "isAppropriate", "flagged", "reason"]
        }
      }
    };

    const response = await aiClient.post(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, requestBody);
    const responsePart = response.data.candidates?.[0]?.content?.parts?.[0];

    // Handle structured JSON output from Gemini
    let json;
    if (responsePart?.text) {
      json = JSON.parse(responsePart.text);
    } else {
      throw new Error("Empty AI response");
    }

    // Decision logic: content is flagged if inappropriate or (for posts) not cooking-related
    const flagged = checkCookingRelated
      ? !(json.isCookingRelated && json.isAppropriate)
      : !json.isAppropriate;

    return {
      flagged,
      reason: flagged ? json.reason || "Content violates community guidelines" : "",
      isAppropriate: json.isAppropriate,
      isCookingRelated: checkCookingRelated ? json.isCookingRelated : undefined
    };

  } catch (err: any) {
    logger.error({ error: err.message }, "[moderator] error during AI moderation");
    if (err.response?.status === 429) {
      throw new Error("AI rate limit exceeded");
    }
    return { flagged: true, reason: "Moderation service error" };
  }
};

/**
 * Sequential queue processor.
 * Ensures that the application stays within the 10 requests/minute free-tier limit.
 *
 * @returns Promise void
 */
const processQueue = async (): Promise<void> => {
  if (isProcessingQueue || moderationQueue.length === 0) return;
  isProcessingQueue = true;

  while (moderationQueue.length > 0) {
    const item = moderationQueue.shift()!;
    try {
      const result = await moderateWithGemini(
        item.title,
        item.content,
        item.images,
        item.checkCookingRelated
      );
      item.resolve(result);
    } catch (err) {
      logger.error(err, "Moderation queue processing error");
      item.reject(err);
    }
    // Wait before processing next item to respect rate limit
    await new Promise((r) => setTimeout(r, REQUEST_INTERVAL));
  }
  isProcessingQueue = false;
};

/**
 * Moderates complex content (Posts).
 * Validates text, title and images for both safety and cooking relevance.
 *
 * @param title - The post title
 * @param content - The post description
 * @param images - Array of image strings (base64 or URLs)
 * @returns Promise resolving to ModerationResult
 *
 * @example
 * ```typescript
 * const res = await moderateContent("My Cake", "Baked this today", ["base64..."]);
 * if (res.flagged) console.log(res.reason);
 * ```
 */
export const moderateContent = (
  title: string,
  content: string,
  images?: string[]
): Promise<ModerationResult> =>
  new Promise((resolve, reject) => {
    moderationQueue.push({
      title,
      content,
      images,
      checkCookingRelated: true,
      resolve,
      reject
    });
    processQueue();
  });

/**
 * Moderates simple text (Comments).
 * Validates text only for safety and appropriateness. Relevance check is skipped.
 *
 * @param text - The comment text content
 * @returns Promise resolving to ModerationResult
 *
 * @example
 * ```typescript
 * const res = await moderateText("This is a nice recipe!");
 * ```
 */
export const moderateText = (
  text: string
): Promise<ModerationResult> =>
  new Promise((resolve, reject) => {
    moderationQueue.push({
      title: "",
      content: text,
      checkCookingRelated: false,
      resolve,
      reject
    });
    processQueue();
  });

export default moderateContent;