// ai.ts
import { GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEY } from "../config/env";

/** ---------- CONFIG ---------- */
// Use gemini-1.5-flash for better reliability or gemini-2.0-flash for latest features
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/** ---------- QUEUE TYPES ---------- */
type ModerationType = 'post' | 'text';

interface PostQueueItem {
  type: 'post';
  title: string;
  content: string;
  images?: string[];
  resolve: (flagged: boolean) => void;
  reject: (error: any) => void;
}

interface TextQueueItem {
  type: 'text';
  context: string;
  text: string;
  resolve: (flagged: boolean) => void;
  reject: (error: any) => void;
}

type QueueItem = PostQueueItem | TextQueueItem;

/** ---------- QUEUE STATE ---------- */
const moderationQueue: QueueItem[] = [];
let isProcessingQueue = false;

/** ---------- RATE LIMIT ---------- */
const MAX_REQUESTS_PER_MINUTE = 10;
const REQUEST_INTERVAL = 60000 / MAX_REQUESTS_PER_MINUTE;

/** ---------- MODERATION FUNCTION ---------- */
const moderateWithGemini = async (
  title: string,
  content: string,
  images?: string[]
): Promise<boolean> => {
  console.log("[moderateWithGemini] Called - Title:", title.substring(0, 50), "| Content length:", content.length, "| Images:", images?.length || 0);
  try {
    // Build the prompt
    const imageCount = images?.length || 0;
    const prompt = `You are a content moderator for a social platform. Flag content ONLY if it is genuinely harmful or violates clear policies.

DO NOT flag content simply for being:
- Short or simple
- Informal or casual
- Testing or placeholder content
- Questions or greetings

Only flag if you find:
- Hate speech or discrimination
- Violence or graphic content
- Sexual content or nudity
- Harassment or bullying
- **Blatant spam** (repeated nonsense, advertising, scams)
- Illegal activities
- Personal information exposure
- Any other clearly harmful content

Title: ${title}
Content: ${content}
${imageCount > 0 ? `\nNote: ${imageCount} image(s) are provided for visual content analysis.` : ''}

Provide your assessment as structured output.`;

    const parts: any[] = [{ text: prompt }];

    // Add images if provided
    if (images && images.length > 0) {
      images.forEach((b64) => {
        // Extract base64 from data URL if present
        const base64Data = b64.includes(";base64,") ? b64.split(";base64,")[1] : b64;
        let mimeType = "image/jpeg"; // default

        if (b64.startsWith("data:image/png")) {
          mimeType = "image/png";
        } else if (b64.startsWith("data:image/webp")) {
          mimeType = "image/webp";
        } else if (b64.startsWith("data:image/jpeg")) {
          mimeType = "image/jpeg";
        }

        parts.push({ inlineData: { data: base64Data, mimeType } });
      });
    }

    // Define the response schema for structured output
    const responseSchema = {
      type: "object" as const,
      properties: {
        flagged: {
          type: "boolean" as const,
          description: "Whether the content is flagged as inappropriate",
        },
        reason: {
          type: "string" as const,
          description: "Brief explanation of why content was flagged (only if flagged is true)",
        },
        categories: {
          type: "array" as const,
          items: {
            type: "string" as const,
            enum: [
              "hate_speech",
              "violence",
              "sexual_content",
              "harassment",
              "spam",
              "illegal",
              "personal_info",
              "other",
            ],
          },
          description: "Categories of inappropriate content (only if flagged)",
        },
      },
      required: ["flagged"],
    };

    // Call Gemini API with structured output using config
    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts }],
      config: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const responseText = result.text?.trim();
    if (!responseText) {
      console.warn("Gemini returned empty response");
      return true; // Flag as uncertain to be safe
    }

    try {
      const json = JSON.parse(responseText);
      console.log("[moderateWithGemini] Parsed response:", JSON.stringify(json, null, 2));
      return Boolean(json.flagged);
    } catch (parseErr) {
      console.error("Failed to parse Gemini structured response:", parseErr, "Raw response:", responseText);
      // Default to flagging if we can't parse the structured output
      return true;
    }
  } catch (err: any) {
    console.error("Gemini API Error:", {
      message: err.message,
      status: err.status,
      details: err.details,
    });

    // Check for quota/rate limit errors
    const quotaErrorMessages = [
      'quota',
      'rate limit',
      'resource exhausted',
      'api key expired',
      'billing',
    ];

    const errorMsg = (err.message || '').toLowerCase();
    const isQuotaError = quotaErrorMessages.some(msg => errorMsg.includes(msg));

    if (isQuotaError) {
      console.error('⚠️ Gemini API quota exceeded or rate limited. Consider upgrading your plan or switching to a different model.');
      // For quota errors, we could either:
      // 1. Throw to fail the upload (safe but blocks content)
      // 2. Allow through (risky but doesn't block users)
      // Let's throw so we can handle it gracefully in the controller
      throw new Error('AI service is currently unavailable due to quota limits. Please try again later.');
    }

    return true; // Default to flagging on other API errors to be safe
  }
};

/** ---------- TEXT-ONLY MODERATION ---------- */
const moderateTextOnly = async (
  context: string,
  text: string
): Promise<boolean> => {
  try {
    const prompt = `You are a content moderator for a social platform. Flag content ONLY if it is genuinely harmful or violates clear policies.

DO NOT flag content simply for being:
- Short or simple
- Informal or casual
- Testing or placeholder content
- Questions or greetings

Only flag if you find:
- Hate speech or discrimination
- Violence or graphic content
- Sexual content or nudity
- Harassment or bullying
- **Blatant spam** (repeated nonsense, advertising, scams)
- Illegal activities
- Personal information exposure
- Any other clearly harmful content

${context}: ${text}

Provide your assessment as structured output.`;

    const responseSchema = {
      type: "object" as const,
      properties: {
        flagged: {
          type: "boolean" as const,
          description: "Whether the content is flagged as inappropriate",
        },
        reason: {
          type: "string" as const,
          description: "Brief explanation of why content was flagged",
        },
      },
      required: ["flagged"],
    };

    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const responseText = result.text?.trim();
    if (!responseText) {
      console.warn("Gemini returned empty response for text moderation");
      return true;
    }

    try {
      const json = JSON.parse(responseText);
      return Boolean(json.flagged);
    } catch (parseErr) {
      console.error("Failed to parse Gemini structured response for text:", parseErr, "Raw response:", responseText);
      return true;
    }
  } catch (err: any) {
    console.error("Gemini API Error in moderateTextOnly:", {
      message: err.message,
      status: err.status,
      details: err.details,
    });
    return true;
  }
};

/** ---------- QUEUE PROCESSING ---------- */
const processQueue = async (): Promise<void> => {
  if (isProcessingQueue || moderationQueue.length === 0) return;
  isProcessingQueue = true;

  while (moderationQueue.length > 0) {
    const item = moderationQueue.shift()!;

    try {
      let isFlagged: boolean;

      if (item.type === 'post') {
        isFlagged = await moderateWithGemini(item.title, item.content, item.images);
      } else {
        isFlagged = await moderateTextOnly(item.context, item.text);
      }

      item.resolve(isFlagged);
    } catch (err) {
      console.error("Queue processing error:", err);
      // Pass the error to the caller instead of defaulting to flagged
      item.reject(err);
    }

    await new Promise((r) => setTimeout(r, REQUEST_INTERVAL));
  }

  isProcessingQueue = false;
};

/** ---------- EXPORTED FUNCTIONS ---------- */
// For posts with images (title + content + images)
export const moderateContent = (
  title: string,
  content: string,
  images?: string[]
): Promise<boolean> =>
  new Promise((resolve, reject) => {
    moderationQueue.push({ type: 'post', title, content, images, resolve, reject });
    processQueue();
  });

// For text-only moderation (usernames, bios, comments)
export const moderateText = (
  context: string,
  text: string
): Promise<boolean> =>
  new Promise((resolve, reject) => {
    moderationQueue.push({ type: 'text', context, text, resolve, reject });
    processQueue();
  });

// Default export for backward compatibility
export default moderateContent;