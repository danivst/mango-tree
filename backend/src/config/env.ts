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

/* ---------- LOG (DEV ONLY) ---------- */
if (NODE_ENV === 'development') {
  console.log('✅ Environment variables loaded');
}