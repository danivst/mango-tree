// ai.ts
import axios from "axios";
import { GEMINI_API_KEY } from "../config/env";

/** ---------- CONFIG ---------- */
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite"; // Change to your desired Gemini model
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Types for Gemini API
interface GeminiPart {
  text?: string;
  inline_data?: {
    data: string;
    mime_type: string;
  };
}

interface GeminiContent {
  role: string;
  parts: GeminiPart[];
}

interface GeminiRequest {
  contents: GeminiContent[];
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
    responseMimeType: string;
  };
}

/** ---------- QUEUE TYPES ---------- */
interface ModerationResult {
  flagged: boolean;
  reason?: string;
  isCookingRelated?: boolean;
  isAppropriate?: boolean;
}

interface QueueItem {
  title: string;
  content: string;
  images?: string[];
  checkCookingRelated: boolean;
  resolve: (result: ModerationResult) => void;
  reject: (error: any) => void;
}

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
  images?: string[],
  checkCookingRelated: boolean = true
): Promise<ModerationResult> => {
  console.log("[moderateWithGemini] Called - Title:", title.substring(0, 50), "| Content length:", content.length, "| Images:", images?.length || 0, "| Check cooking:", checkCookingRelated);

  try {
    // Build the prompt based on context
    const imageCount = images?.length || 0;
    let prompt: string;

    if (checkCookingRelated) {
      // For posts: check both cooking-relatedness and appropriateness
      prompt = `You are a content moderator for a cooking-focused social platform. Your job is to check BOTH:

1. IS THE CONTENT COOKING-RELATED? (Check title and content)
   - ACCEPT: Recipes, cooking techniques, food preparation, kitchen tips, ingredient discussions, cooking questions, food photos, restaurant reviews, meal planning, baking, grilling, etc.
   - REJECT: Non-cooking topics like politics, sports, entertainment, personal gossip, news, memes, technology, travel (unless specifically about food tourism), etc.

2. IS THE CONTENT APPROPRIATE? (Check both text and images)
   - REJECT if contains:
     * Sexual content or nudity (including suggestive food imagery)
     * Hate speech or discrimination
     * Violence or graphic content
     * Harassment or bullying
     * Blatant spam or advertising
     * Illegal activities (drug cultivation, etc.)
     * Personal information exposure
     * Profanity or offensive language
     * Any harmful or dangerous content

Title: ${title}
Content: ${content}
${imageCount > 0 ? `\nNote: ${imageCount} image(s) are provided for visual content analysis.` : ''}

Respond with ONLY a JSON object in this exact format:
{
  "isCookingRelated": boolean,
  "isAppropriate": boolean,
  "flagged": boolean,
  "reason": "Brief explanation (only if flagged=true, otherwise empty string)"
}

Logic:
- If NOT cooking-related → flagged = true, reason = "Post is not cooking-related"
- If NOT appropriate → flagged = true, reason = "Content is inappropriate: [brief reason]"
- Only accept if BOTH are true → flagged = false`;
    } else {
      // For comments/other text: only check appropriateness
      prompt = `You are a content moderator for a cooking-focused social platform. Check if the following content is APPROPRIATE.

REJECT if the content contains:
- Sexual content or nudity
- Hate speech or discrimination
- Violence or graphic content
- Harassment or bullying
- Blatant spam or advertising
- Illegal activities
- Personal information exposure
- Profanity or offensive language
- Any harmful or dangerous content

ACCEPT: All other content including casual comments, questions, opinions, and discussions (even if not strictly about cooking).

Content to review:
${title ? `Title: ${title}\n` : ''}${content}

Respond with ONLY a JSON object in this exact format:
{
  "isCookingRelated": boolean,
  "isAppropriate": boolean,
  "flagged": boolean,
  "reason": "Brief explanation (only if flagged=true, otherwise empty string)"
}

Logic:
- Only check if content is appropriate (isCookingRelated is ignored for comments)
- If NOT appropriate → flagged = true, reason = "Content is inappropriate: [brief reason]"
- If appropriate → flagged = false`;
    }

    // Build parts for Gemini API
    const parts: GeminiPart[] = [{ text: prompt }];

    // Add images if provided (Gemini format: inline_data)
    if (images && images.length > 0) {
      images.forEach((img) => {
        let base64Data = img;
        let mimeType = "image/jpeg";

        if (img.includes(";base64,")) {
          base64Data = img.split(";base64,")[1];
        }

        if (img.startsWith("data:image/png")) {
          mimeType = "image/png";
        } else if (img.startsWith("data:image/webp")) {
          mimeType = "image/webp";
        } else if (img.startsWith("data:image/jpeg")) {
          mimeType = "image/jpeg";
        }

        parts.push({
          inline_data: {
            data: base64Data,
            mime_type: mimeType
          }
        });
      });
    }

    // Make HTTP request to Gemini API
    const requestBody: GeminiRequest = {
      contents: [
        {
          role: "user",
          parts: parts
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 200,
        responseMimeType: "application/json"
      }
    };

    const response = await axios.post(
      `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const responseText = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!responseText) {
      console.warn("[moderateWithGemini] Gemini returned empty response");
      return { flagged: true, reason: "No response from AI service" };
    }

    // Extract JSON from response (in case there's extra text)
    const jsonMatch = responseText.match(/\{.*\}/s);
    const jsonString = jsonMatch ? jsonMatch[0] : responseText;

    try {
      const json = JSON.parse(jsonString);
      console.log("[moderateWithGemini] Parsed response:", JSON.stringify(json, null, 2));

      let flagged: boolean;
      let reason: string = json.reason || "";

      if (checkCookingRelated) {
        // For posts: flagged if NOT cooking-related OR NOT appropriate
        flagged = !(json.isCookingRelated && json.isAppropriate);
        if (flagged && !reason) {
          reason = json.isCookingRelated ? "Content is inappropriate" : "Post is not cooking-related";
        }
      } else {
        // For comments: only care about appropriateness
        flagged = !json.isAppropriate;
        if (flagged && !reason) {
          reason = "Content is inappropriate";
        }
      }

      return {
        flagged,
        reason,
        isCookingRelated: json.isCookingRelated,
        isAppropriate: json.isAppropriate,
      };
    } catch (parseErr) {
      console.error("[moderateWithGemini] Failed to parse Gemini response:", parseErr, "Raw response:", responseText);
      return { flagged: true, reason: "Invalid AI response format" };
    }
  } catch (err: any) {
    console.error("[moderateWithGemini] Gemini API Error:", {
      message: err.message,
      status: err.response?.status,
      details: err.response?.data,
    });

    // Check for rate limit/quota errors
    const errorMsg = (err.message || '').toLowerCase();
    const isRateLimitError = err.response?.status === 429 || errorMsg.includes('rate limit');
    const isQuotaError = errorMsg.includes('quota') || errorMsg.includes('billing');

    if (isRateLimitError || isQuotaError) {
      console.error('[moderateWithGemini] ⚠️ Gemini API rate limited or quota exceeded.');
      throw new Error('AI service is currently unavailable due to rate limits or quota. Please try again later.');
    }

    // For other errors, flag to be safe
    return { flagged: true, reason: "AI service error" };
  }
};

/** ---------- QUEUE PROCESSING ---------- */
const processQueue = async (): Promise<void> => {
  if (isProcessingQueue || moderationQueue.length === 0) return;
  isProcessingQueue = true;

  while (moderationQueue.length > 0) {
    const item = moderationQueue.shift()!;

    try {
      const result = await moderateWithGemini(item.title, item.content, item.images, item.checkCookingRelated);
      item.resolve(result);
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
// For posts with images (title + content + images) - checks cooking-relatedness AND appropriateness
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

// For text-only moderation (comments, usernames, etc.) - only checks appropriateness
export const moderateText = (
  text: string,
  title: string = ""
): Promise<ModerationResult> =>
  new Promise((resolve, reject) => {
    moderationQueue.push({
      title,
      content: text,
      images: [],
      checkCookingRelated: false,
      resolve,
      reject
    });
    processQueue();
  });

// Default export
export default moderateContent;