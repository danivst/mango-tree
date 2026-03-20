import mongoose from "mongoose";
import Post from "../models/post";
import Comment from "../models/comment";

const run = async () => {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/mangotree";
    await mongoose.connect(uri);

    // Update posts: set isVisible = true where missing or false
    const postResult = await Post.updateMany(
      { $or: [{ isVisible: { $ne: true } }, { isVisible: { $exists: false } }] },
      { isVisible: true }
    );

    // Update comments: set isVisible = true where missing or false
    const commentResult = await Comment.updateMany(
      { $or: [{ isVisible: { $ne: true } }, { isVisible: { $exists: false } }] },
      { isVisible: true }
    );

    console.log(`Migration completed.`);
    console.log(`- Posts updated: ${postResult.modifiedCount}`);
    console.log(`- Comments updated: ${commentResult.modifiedCount}`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

run();
