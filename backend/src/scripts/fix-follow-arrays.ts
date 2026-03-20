import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user";
import { MONGO_URI } from "../config/env";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected. Starting followers/following fix...");

    const users = await User.find({});
    let fixedCount = 0;

    for (const user of users) {
      let needsSave = false;

      // Fix followers: ensure it's an array
      if (!Array.isArray(user.followers)) {
        user.followers = [];
        needsSave = true;
      }

      // Fix following: ensure it's an array
      if (!Array.isArray(user.following)) {
        user.following = [];
        needsSave = true;
      }

      if (needsSave) {
        await user.save();
        fixedCount++;
        console.log(`Fixed user ${user._id}: ${user.username}`);
      }
    }

    console.log(`✅ Migration completed. Fixed ${fixedCount} users.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

run();
