import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user";
import { MONGO_URI } from "../config/env";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected. Starting migration...");

    // For all users: isVisible:true -> isBanned:false, isVisible:false -> isBanned:true
    // If isVisible undefined -> isBanned:false (default)
    const users = await User.find({});
    let migratedCount = 0;

    for (const user of users) {
      let newBanned: boolean;
      if (user.isVisible !== undefined) {
        newBanned = !user.isVisible;
      } else {
        newBanned = false; // default
      }

      // Only update if the value would change (i.e., isBanned different from current)
      if (user.isBanned !== newBanned) {
        user.isBanned = newBanned;
        await user.save();
        migratedCount++;
      }
    }

    console.log(`Migration completed. Updated ${migratedCount} users.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

run();
