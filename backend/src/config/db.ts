/**
 * @file db.ts
 * @description MongoDB database connection utility using Mongoose.
 * Establishes connection to the configured MongoDB instance.
 */

import mongoose from "mongoose";
import { MONGO_URI } from "./env";
import logger from "../utils/logger";

/**
 * Connects to MongoDB.
 * Uses URI from environment variables and logs success or critical failure.
 *
 * @returns {Promise<void>} Resolves when connected successfully
 * @throws {Error} Exits process (code 1) if connection fails
 *
 * @example
 * ```typescript
 * await connectDB();
 * ```
 */
export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error(error, "MongoDB connection failed");
    process.exit(1);
  }
};