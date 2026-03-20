import mongoose from "mongoose";
import Comment from "../models/comment";

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/mangotree");

    // Set isVisible = true for all comments that don't have the field (or are false)
    const result = await Comment.updateMany(
      { $or: [{ isVisible: { $ne: true } }, { isVisible: { $exists: false } }] },
      { isVisible: true }
    );

    console.log(`Migration completed. Updated ${result.modifiedCount} comments.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

run();
