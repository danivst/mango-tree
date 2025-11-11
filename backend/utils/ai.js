import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = 'gemini-2.5-flash';

const moderationQueue = [];
let isProcessingQueue = false;
const MAX_REQUESTS_PER_MINUTE = 10;
const REQUEST_INTERVAL = 60000 / MAX_REQUESTS_PER_MINUTE;

const processQueue = async () => {
  if (isProcessingQueue || moderationQueue.length === 0) return;
  isProcessingQueue = true;

  while (moderationQueue.length > 0) {
    const { title, content, resolve } = moderationQueue.shift();
    try {
      const flagged = await moderateWithGemini(title, content);
      resolve(flagged);
    } catch (err) {
      console.error('Moderation queue error:', err);
      resolve(true);
    }
    await new Promise((r) => setTimeout(r, REQUEST_INTERVAL));
  }

  isProcessingQueue = false;
};

const moderateText = (title, content) =>
  new Promise((resolve) => {
    moderationQueue.push({ title, content, resolve });
    processQueue();
  });

const moderateWithGemini = async (title, content) => {
  const prompt = `
    You are a content moderator. Respond ONLY with YES or NO.
    YES means the text is inappropriate and should be flagged.
    NO means the text is safe to post.

    Text to review:
    "${title}
    ${content}"
    `.trim();

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    temperature: 0,
    maxOutputTokens: 10,
  });

  const answer = response?.text?.trim().toUpperCase();
  return answer === 'YES';
};

export default moderateText;