import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user";
import Post from "../models/post";
import Report from "../models/report";
import { MONGO_URI } from "../config/env";

dotenv.config();

const createReportForUsergugy = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Find user "usergugy"
    const user = await User.findOne({ username: "usergugy" });
    if (!user) {
      console.log("❌ User 'usergugy' not found. Creating user first...");

      // Create the user since they don't exist
      const newUser = await User.create({
        username: "usergugy",
        email: "usergugy@example.com",
        passwordHash: "hashed_password_placeholder",
        role: "user",
      });
      console.log("✅ Created user 'usergugy'");
      console.log("⚠️  Note: This user needs a proper password hash. You'll need to set a real password later.");
    }

    // Find user's approved posts
    const usergugy = await User.findOne({ username: "usergugy" });
    const approvedPosts = await Post.find({
      authorId: usergugy!._id,
      isApproved: true,
    });

    if (approvedPosts.length === 0) {
      console.log("❌ No approved posts found for 'usergugy'");

      // Optionally create a sample approved post
      console.log("💡 Tip: Have an admin approve one of their posts first, or create an approved post manually.");
      await mongoose.disconnect();
      return;
    }

    console.log(`✅ Found ${approvedPosts.length} approved post(s) for 'usergugy'`);
    console.log("📝 Post details:");
    approvedPosts.forEach((post, idx) => {
      console.log(`  ${idx + 1}. Title: ${post.title} | ID: ${post._id}`);
    });

    // Check if there's an admin to report as
    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      console.log("❌ No admin user found to be the reporter.");
      console.log("💡 Create an admin user first or specify a different reporter.");
      await mongoose.disconnect();
      return;
    }

    console.log(`✅ Using admin '@${admin.username}' as reporter`);

    // Use the first approved post
    const postToReport = approvedPosts[0];

    // Check if a report already exists for this post
    const existingReport = await Report.findOne({
      targetType: "post",
      targetId: postToReport._id,
    });

    if (existingReport) {
      console.log(`⚠️  A report already exists for this post (Report ID: ${existingReport._id})`);
      console.log("💡 Skipping report creation.");
      await mongoose.disconnect();
      return;
    }

    // Create the report
    const report = await Report.create({
      reportedBy: admin._id,
      targetType: "post",
      targetId: postToReport._id,
      reason: "This post violates community guidelines.",
      status: "pending",
    });

    console.log("✅ Report created successfully!");
    console.log("📊 Report details:");
    console.log(`  - Report ID: ${report._id}`);
    console.log(`  - Reporter: @${admin.username}`);
    console.log(`  - Target Type: post`);
    console.log(`  - Target ID: ${postToReport._id}`);
    console.log(`  - Post Title: ${postToReport.title}`);
    console.log(`  - Reason: ${report.reason}`);
    console.log(`  - Status: ${report.status}`);
    console.log("\n🎉 Now the post should appear in the 'To Review' queue!");

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

createReportForUsergugy();
