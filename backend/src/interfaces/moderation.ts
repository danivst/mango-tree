/**
 * @file moderation.ts
 * @description Type definitions for AI content moderation system.
 * These types define the structure for Google Gemini API interactions
 * and the internal moderation queue management.
 */

/**
 * @interface GeminiPart
 * @description A part of content sent to Gemini API.
 * Can be either text or inline image data.
 *
 * @property {string} [text] - Text content for the model
 * @property {Object} [inline_data] - Base64 image data with MIME type
 */
export interface GeminiPart {
  text?: string;
  inline_data?: {
    data: string;
    mime_type: string;
  };
}

/**
 * @interface GeminiContent
 * @description Content structure for a Gemini API request.
 *
 * @property {string} role - Role of the sender (e.g., "user")
 * @property {GeminiPart[]} parts - Array of content parts (text and/or images)
 */
export interface GeminiContent {
  role: string;
  parts: GeminiPart[];
}

/**
 * @interface GeminiRequest
 * @description Full request payload for Gemini generateContent API.
 * Includes structured output schema for JSON mode.
 *
 * @property {GeminiContent[]} contents - Array of conversation turns
 * @property {Object} generationConfig - Model generation parameters
 */
export interface GeminiRequest {
  contents: GeminiContent[];
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
    responseMimeType: string;
    responseSchema?: {
      type: string;
      properties: Record<string, { type: string }>;
      required: string[];
    };
  };
}

/**
 * @interface ModerationResult
 * @description Outcome of AI content moderation check.
 *
 * @property {boolean} flagged - Whether content should be rejected (true) or approved (false)
 * @property {string} [reason] - Human-readable explanation when flagged
 * @property {boolean} [isCookingRelated] - For posts: is content cooking-related?
 * @property {boolean} [isAppropriate] - General safety check: is content appropriate?
 */
export interface ModerationResult {
  flagged: boolean;
  reason?: string;
  isCookingRelated?: boolean;
  isAppropriate?: boolean;
}

/**
 * @interface QueueItem
 * @description Internal structure for queued moderation requests.
 * Used by the rate-limited queue system to process requests sequentially.
 *
 * @property {string} title - Content title (for posts)
 * @property {string} content - Text content to moderate
 * @property {string[]} [images] - Optional array of image data
 * @property {boolean} checkCookingRelated - Whether to enforce cooking relevance check
 * @property {Function} resolve - Promise resolve function
 * @property {Function} reject - Promise reject function
 */
export interface QueueItem {
  title: string;
  content: string;
  images?: string[];
  checkCookingRelated: boolean;
  resolve: (result: ModerationResult) => void;
  reject: (error: any) => void;
}