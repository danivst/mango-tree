/**
 * @file env.ts
 * @description Environment variable configuration loader.
 * Loads dotenv and exports typed configuration values.
 * All required variables are validated at load time; missing variables throw errors.
 */

import dotenv from "dotenv";

dotenv.config();

/**
 * Helper to require an environment variable to be present.
 * Throws descriptive error if variable is missing.
 *
 * @param key - Environment variable name
 * @returns The variable's value
 * @throws Error if variable is not defined
 */
const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

/**
 * Server configuration
 */
export const PORT = Number(process.env.PORT) || 3000;

/**
 * Database configuration
 */
export const MONGO_URI = requireEnv("MONGO_URI");

/**
 * Authentication configuration
 */
export const JWT_SECRET = requireEnv("JWT_SECRET");
export const JWT_REFRESH_SECRET = requireEnv("JWT_REFRESH_SECRET");

/**
 * Client configuration
 */
export const CLIENT_URL = requireEnv("CLIENT_URL");

/**
 * AI/Moderation configuration
 */
export const GEMINI_API_KEY = requireEnv("GEMINI_API_KEY");
export const GEMINI_MODEL_DEFAULT = process.env.GEMINI_MODEL_DEFAULT || "gemini-2.5-flash-lite";

/**
 * Translation configuration
 */
export const DEEPL_API_KEY = requireEnv("DEEPL_API_KEY");

/**
 * Runtime environment configuration
 */
export const NODE_ENV = process.env.NODE_ENV || "development";
export const IS_DEV = NODE_ENV === "development";

/**
 * Email configuration
 * Primary: Resend API
 * Fallback: Gmail SMTP
 */
export const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

export const SMTP_USER = process.env.SMTP_USER ?? "";
export const SMTP_PASS = process.env.SMTP_PASS ?? "";

/**
 * Development logging
 * Outputs configuration details when in development mode
 */
if (IS_DEV) {
  console.log("Environment variables loaded");
  console.log(`Client URL: ${CLIENT_URL}`);
  console.log(`Mongo URI loaded`);
  console.log(`Gemini API Key: ${GEMINI_API_KEY.substring(0, 8)}...`);
  console.log(`Resend From: ${RESEND_FROM_EMAIL}`);

  if (!RESEND_API_KEY) {
    console.log("Resend API key not configured. Using SMTP if available.");
  }

  if (SMTP_USER) {
    console.log(`SMTP Backup Configured: ${SMTP_USER}`);
  }
}
