/**
 * @file db.ts
 * @description MongoDB database connection utility using Mongoose.
 * Establishes connection to the configured MongoDB instance.
 * Exits process with error code 1 if connection fails.
 */

import mongoose from "mongoose";
import { MONGO_URI } from "./env";

/**
 * Connects to MongoDB using the URI from environment variables.
 * Should be called during application startup.
 *
 * @returns Promise<void> that resolves when connected or rejects on failure
 * @throws Will exit process (code 1) if connection fails
 */
export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};
