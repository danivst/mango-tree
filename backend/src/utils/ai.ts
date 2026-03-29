/**
 * @file ai.ts
 * @description AI-powered content moderation using Google Gemini API.
 * Implements a queue-based system to respect rate limits (10 requests/minute).
 * Supports both post moderation (cooking-related + safety) and comment moderation (safety only).
 */

import axios from "axios";
import { GEMINI_API_KEY, GEMINI_MODEL_DEFAULT } from "../config/env";
import {
  ModerationResult,
  GeminiPart,
  GeminiRequest,
  QueueItem
} from "../interfaces/moderation";

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
 * Moderates content using Google Gemini AI.
 * Checks for appropriateness and, optionally, cooking relevance.
 *
 * @param title - Content title (for posts) or empty string for comments
 * @param content - Text content to moderate
 * @param images - Optional array of base64 image data for visual analysis
 * @param checkCookingRelated - If true, validates content is cooking-related
 * @returns ModerationResult with flagged status and reason
 *
 * @throws {Error} If rate limit exceeded or service error occurs
 *
 * @internal
 * This function is private and should be called via moderateContent or moderateText.
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

    const response = await axios.post(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, requestBody);
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
    console.error("[moderator] error:", err.message);
    if (err.response?.status === 429) {
      throw new Error("AI rate limit exceeded");
    }
    return { flagged: true, reason: "Moderation service error" };
  }
};

/**
 * Processes the moderation queue sequentially to respect rate limits.
 * Processes at most one item at a time with delay between requests.
 *
 * @internal
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
      item.reject(err);
    }
    // Wait before processing next item to respect rate limit
    await new Promise((r) => setTimeout(r, REQUEST_INTERVAL));
  }
  isProcessingQueue = false;
};

/**
 * Public API: Moderate post content (title + images).
 * Queues the request and returns a promise that resolves with moderation result.
 *
 * @param title - Post title
 * @param content - Post content
 * @param images - Optional array of image URLs/base64 data
 * @returns Promise<ModerationResult>
 *
 * @example
 * ```typescript
 * const result = await moderateContent("Delicious Pasta", "Here's my recipe...", ["image1.jpg"]);
 * if (result.flagged) {
 *   console.log("Post rejected:", result.reason);
 * }
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
 * Public API: Moderate text-only content (comments).
 * Queues the request and returns a promise that resolves with moderation result.
 *
 * @param text - Comment text content
 * @returns Promise<ModerationResult>
 *
 * @example
 * ```typescript
 * const result = await moderateText("This comment is inappropriate");
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
