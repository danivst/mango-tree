import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = 'gemini-2.5-flash';

interface QueueItem {
  title: string;
  content: string;
  resolve: (flagged: boolean) => void;
}

const moderationQueue: QueueItem[] = [];
let isProcessingQueue = false;

const MAX_REQUESTS_PER_MINUTE = 10;
const REQUEST_INTERVAL = 60000 / MAX_REQUESTS_PER_MINUTE;

const processQueue = async (): Promise<void> => {
  if (isProcessingQueue || moderationQueue.length === 0) return;
  isProcessingQueue = true;

  while (moderationQueue.length > 0) {
    const { title, content, resolve } = moderationQueue.shift()!;

    try {
      const flagged = await moderateWithGemini(title, content);
      resolve(flagged);
    } catch (err) {
      console.error('Moderation queue error:', err);
      resolve(true); // default to flagging on error
    }

    await new Promise((r) => setTimeout(r, REQUEST_INTERVAL));
  }

  isProcessingQueue = false;
};

export const moderateText = (title: string, content: string): Promise<boolean> =>
  new Promise((resolve) => {
    moderationQueue.push({ title, content, resolve });
    processQueue();
  });

const moderateWithGemini = async (title: string, content: string): Promise<boolean> => {
  const prompt = `
    You are a content moderator. Respond ONLY with YES or NO.
    YES means the text is inappropriate and should be flagged.
    NO means the text is safe to post.

    Text to review:
    "${content}"
  `.trim();

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
  });

  const answer = response?.text?.trim().toUpperCase();
  if (!answer) {
    console.warn('Empty response from Gemini:', response);
    return true; // default to flagging if uncertain
  }

  return answer === 'YES';
};

export default moderateText;