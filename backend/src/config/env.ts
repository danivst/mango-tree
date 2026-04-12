/**
 * @file env.ts
 * @description Environment variable configuration loader.
 * Loads dotenv and exports typed configuration values.
 * All required variables are validated at load time; missing variables throw errors.
 */

import dotenv from "dotenv";
import logger from "../utils/logger";

dotenv.config();

/**
 * Validates and retrieves an environment variable.
 *
 * @param key - Environment variable name
 * @returns The variable's value string
 * @throws {Error} If variable is not defined
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
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

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
export const GEMINI_MODEL_DEFAULT = process.env.GEMINI_MODEL_DEFAULT || "gemini-1.5-flash";

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
 */
export const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

export const SMTP_USER = process.env.SMTP_USER ?? "";
export const SMTP_PASS = process.env.SMTP_PASS ?? "";

/**
 * Development logging
 */
if (IS_DEV) {
  logger.info({
    clientUrl: CLIENT_URL,
    geminiKey: `${GEMINI_API_KEY.substring(0, 8)}...`,
    resendFrom: RESEND_FROM_EMAIL,
    smtpConfigured: !!SMTP_USER
  }, "Environment variables loaded");

  if (!RESEND_API_KEY && !SMTP_USER) {
    logger.warn("No email service (Resend or SMTP) configured.");
  }
}