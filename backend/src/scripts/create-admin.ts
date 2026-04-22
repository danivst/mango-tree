/**
 * @file create-admin.ts
 * @description CLI script to create the initial admin user.
 * Connects to MongoDB, creates an admin account with default credentials if not exists.
 * Run via: `npm run create-admin` or `ts-node src/scripts/create-admin.ts`
 *
 * Default credentials:
 * - Email: admin@mangotreeofficial.com
 * - Username: admin
 * - Password: Admin123!@#
 *
 * IMPORTANT: Change the default password after first login!
 */

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../models/user-model";
import { MONGO_URI } from "../config/env";

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    const adminEmail = "admin@mangotreeofficial.com";
    const adminPassword = "Admin123!@#";
    const adminUsername = "admin";

    // check if it exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log("Admin account already exists!");
      console.log(`Email: ${adminEmail}`);
      await mongoose.disconnect();
      return;
    }

    // create admin
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await User.create({
      username: adminUsername,
      email: adminEmail,
      passwordHash,
      role: "admin",
    });

    console.log("Admin account created successfully!");
    console.log(`Email: ${adminEmail}`);
    console.log(`Username: ${adminUsername}`);
    console.log(`Password: ${adminPassword}`);
    await mongoose.disconnect();
  } catch (error: any) {
    console.error("Error creating admin:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

createAdmin();