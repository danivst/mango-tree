import dotenv from 'dotenv';

dotenv.config();

/**
 * Helper to require env variables
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
export const MONGO_URI = requireEnv('MONGO_URI');

/* ---------- AUTH ---------- */
export const JWT_SECRET = requireEnv('JWT_SECRET');
export const JWT_REFRESH_SECRET = requireEnv('JWT_REFRESH_SECRET');

/* ---------- CLIENT ---------- */
export const CLIENT_URL = requireEnv('CLIENT_URL');

/* ---------- AI / EXTERNAL SERVICES ---------- */
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';

/* ---------- ENV MODE ---------- */
export const NODE_ENV = process.env.NODE_ENV || 'development';

/* ---------- EMAIL ---------- */
export const RESEND_API_KEY = process.env.RESEND_API_KEY ?? '';
export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

/* ---------- LOG (DEV ONLY) ---------- */
if (NODE_ENV === 'development') {
  console.log('✅ Environment variables loaded');
  if (RESEND_API_KEY) {
    console.log(`✅ Resend API key configured: ${RESEND_API_KEY.substring(0, 10)}...`);
    console.log(`📧 Resend from email: ${RESEND_FROM_EMAIL}`);
  } else {
    console.log('⚠️ Resend API key not configured. Will use SMTP if available.');
  }
}