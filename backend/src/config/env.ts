// config.ts
import dotenv from "dotenv";

dotenv.config();

/**
 * Helper to require environment variables.
 * Throws immediately if missing.
 */
const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }
  return value;
};

/* ---------- SERVER ---------- */
export const PORT = Number(process.env.PORT) || 3000;

/* ---------- DATABASE ---------- */
export const MONGO_URI = requireEnv("MONGO_URI");

/* ---------- AUTH ---------- */
export const JWT_SECRET = requireEnv("JWT_SECRET");
export const JWT_REFRESH_SECRET = requireEnv("JWT_REFRESH_SECRET");

/* ---------- CLIENT ---------- */
export const CLIENT_URL = requireEnv("CLIENT_URL");

/* ---------- AI / EXTERNAL SERVICES ---------- */
// Fail fast if missing GEMINI_API_KEY
export const GEMINI_API_KEY = requireEnv("GEMINI_API_KEY");
export const DEEPL_API_KEY = requireEnv("DEEPL_API_KEY");

/* ---------- ENV MODE ---------- */
export const NODE_ENV = process.env.NODE_ENV || "development";
export const IS_DEV = NODE_ENV === "development";

/* ---------- EMAIL ---------- */
export const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
export const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

/* ---------- DEV LOGGING ---------- */
if (IS_DEV) {
  console.log("✅ Environment variables loaded");
  console.log(`🌐 Client URL: ${CLIENT_URL}`);
  console.log(`🗄 Mongo URI loaded`);
  console.log(`🔑 Gemini API Key: ${GEMINI_API_KEY.substring(0, 8)}...`);
  console.log(`✉️ Resend From: ${RESEND_FROM_EMAIL}`);
  if (!RESEND_API_KEY) {
    console.log("⚠️ Resend API key not configured. Using SMTP if available.");
  }
}