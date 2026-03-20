import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/user";
import { MONGO_URI } from "../config/env";

dotenv.config();

const createUser = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    const userEmail = "user@mangotree.com";
    const userPassword = "User123!@#";
    const userUsername = "user";

    // Check if user already exists
    const existingUser = await User.findOne({ email: userEmail });
    if (existingUser) {
      console.log("User account already exists!");
      console.log("Email:", userEmail);
      console.log("Username:", existingUser.username);
      console.log("Password:", userPassword);
      await mongoose.disconnect();
      return;
    }

    const passwordHash = await bcrypt.hash(userPassword, 10);

    const user = await User.create({
      username: userUsername,
      email: userEmail,
      passwordHash,
      role: "user",
    });

    console.log("✅ User account created successfully!");
    console.log("Email:", userEmail);
    console.log("Username:", userUsername);
    console.log("Password:", userPassword);
    await mongoose.disconnect();
  } catch (err) {
    console.error("Error creating user:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

createUser();
