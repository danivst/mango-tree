/**
 * @file env.ts
 * @description Environment variable configuration loader.
 * Loads dotenv and exports typed configuration values.
 * All required variables are validated at load time; missing variables throw errors.
 */

import dotenv from "dotenv";

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
export const BASE_API_URL = requireEnv("BASE_API_URL");
