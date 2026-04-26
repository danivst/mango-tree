/**
 * @file create-user.ts
 * @description CLI script to create a regular user account for testing.
 * Connects to MongoDB, creates a user with default credentials if not exists.
 * Run via: `npm run create-user` or `ts-node src/scripts/create-user.ts`
 *
 * Default credentials:
 * - Email: user@mangotreeofficial.com
 * - Username: user
 * - Password: User123!@#
 */

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../models/user-model";
import { MONGO_URI } from "../config/env";

dotenv.config();

const createUser = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    const userEmail = "user@mangotreeofficial.com";
    const userPassword = "User123!@#";
    const userUsername = "user";

    const existingUser = await User.findOne({ email: userEmail });

    if (existingUser) {
      console.log("User account already exists!");
      console.log(`Email: ${userEmail}`);
      console.log(`Username: ${existingUser.username}`);
      await mongoose.disconnect();
      return;
    }

    // Create user
    const passwordHash = await bcrypt.hash(userPassword, 10);

    await User.create({
      username: userUsername,
      email: userEmail,
      passwordHash,
      role: "user",
      language: "en",
      theme: "cream"
    });

    console.log("User account created successfully!");
    console.log(`Email: ${userEmail}`);
    console.log(`Username: ${userUsername}`);
    console.log(`Password: ${userPassword}`);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error creating user:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

createUser();