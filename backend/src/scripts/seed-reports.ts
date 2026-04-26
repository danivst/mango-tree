/**
 * @file seed-reports.ts
 * @description Database seeding script for moderation reports.
 * Creates mock reports targeting comments, user profiles, and posts to test 
 * the administrative dashboard and reporting flow.
 * Run via: `npm run seed:reports` or `ts-node src/scripts/seed-reports.ts`
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user-model";
import Post from "../models/post-model";
import Comment from "../models/comment-model";
import Report from "../models/report-model";
import ReportTargetType from "../enums/report-target-type";
import ReportStatusTypeValue from "../enums/report-status-type";
import { MONGO_URI } from "../config/env";

dotenv.config();

const seedReports = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected for report seeding");

    const users = await User.find();
    const posts = await Post.find();
    const comments = await Comment.find();

    if (users.length < 10 || posts.length < 5 || comments.length < 5) {
      console.log("Not enough data to seed reports. Run previous seeds first.");
      process.exit(1);
    }

    const reports = [];

    // 3 reports for comments
    for (let i = 0; i < 3; i++) {
      reports.push({
        reportedBy: users[i]._id,
        targetType: ReportTargetType.COMMENT,
        targetId: comments[i]._id,
        reason: `Inappropriate language in comment #${i + 1}`,
        status: ReportStatusTypeValue.PENDING
      });
    }

    // 2 reports for user profiles
    for (let i = 0; i < 2; i++) {
      reports.push({
        reportedBy: users[i + 3]._id,
        targetType: ReportTargetType.USER,
        targetId: users[i + 5]._id,
        reason: `User profile #${i + 1} seems to be a bot or spammer.`,
        status: ReportStatusTypeValue.PENDING
      });
    }

    // 2 reports for posts
    for (let i = 0; i < 2; i++) {
      reports.push({
        reportedBy: users[i + 7]._id,
        targetType: ReportTargetType.POST,
        targetId: posts[i]._id,
        reason: `Post #${i + 1} contains misleading information about food safety.`,
        status: ReportStatusTypeValue.PENDING
      });
    }

    const createdReports = await Report.insertMany(reports);
    console.log(`Created ${createdReports.length} reports`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Report seeding failed:", err);
    process.exit(1);
  }
};

seedReports();
