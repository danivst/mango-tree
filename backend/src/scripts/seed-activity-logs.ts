/**
 * @file seed-activity-logs.ts
 * @description CLI script to seed sample activity logs for testing/admin review.
 * Connects to MongoDB and creates realistic activity log entries referencing existing users.
 * Run via: `npm run seed:activity-logs` or `ts-node src/scripts/seed-activity-logs.ts`
 *
 * This script creates logs for various action types to populate the admin activity log page.
 * It references existing users in the database - make sure at least one user exists before running.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user";
import ActivityLog from "../models/activity-log";
import Post from "../models/post";
import Comment from "../models/comment";
import { MONGO_URI } from "../config/env";

dotenv.config();

// Define sample activity types and descriptions
const sampleActivities = [
  { actionType: 'LOGIN', description: 'User logged in' },
  { actionType: 'LOGOUT', description: 'User logged out' },
  { actionType: 'USERNAME_CHANGE', description: 'Changed username' },
  { actionType: 'EMAIL_CHANGE', description: 'Changed email address' },
  { actionType: 'PROFILE_IMAGE_CHANGE', description: 'Updated profile image' },
  { actionType: 'THEME_CHANGE', description: 'Changed theme' },
  { actionType: 'LANGUAGE_CHANGE', description: 'Changed language preference' },
  { actionType: 'BIO_UPDATE', description: 'Updated bio' },
  { actionType: 'POST_CREATE', description: 'Created a new post' },
  { actionType: 'POST_EDIT', description: 'Edited a post' },
  { actionType: 'POST_DELETE', description: 'Deleted a post' },
  { actionType: 'COMMENT_CREATE', description: 'Added a comment' },
  { actionType: 'COMMENT_EDIT', description: 'Edited a comment' },
  { actionType: 'COMMENT_DELETE', description: 'Deleted a comment' },
  { actionType: 'FOLLOW', description: 'Started following a user' },
  { actionType: 'UNFOLLOW', description: 'Unfollowed a user' },
  { actionType: 'LIKE_POST', description: 'Liked a post' },
  { actionType: 'UNLIKE_POST', description: 'Unliked a post' },
  { actionType: 'LIKE_COMMENT', description: 'Liked a comment' },
  { actionType: 'UNLIKE_COMMENT', description: 'Unliked a comment' },
  { actionType: 'REPORT_SUBMIT', description: 'Reported content' },
  { actionType: 'REPORT_RESOLVE', description: 'Report resolved by admin' },
];

const seedActivityLogs = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    // Get all existing users
    const users = await User.find({}).select("_id username").lean();
    if (users.length === 0) {
      console.log("❌ No users found in database. Please create users first.");
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`Found ${users.length} users`);

    // Get existing posts and comments for targeting
    const posts = await Post.find({}).select("_id").lean();
    const comments = await Comment.find({}).select("_id authorId").lean();

    console.log(`Found ${posts.length} posts, ${comments.length} comments`);

    const logsToCreate = [];
    const now = new Date();
    const daysBack = 30; // Create logs within the last 30 days

    // For each user, create a realistic mix of activity logs
    for (const user of users) {
      const userId = user._id;
      const username = user.username;
      const numLogs = Math.floor(Math.random() * 20) + 5; // 5-25 logs per user

      for (let i = 0; i < numLogs; i++) {
        // Pick a random activity type
        const activity = sampleActivities[Math.floor(Math.random() * sampleActivities.length)];

        // Random timestamp within the last N days
        const daysAgo = Math.floor(Math.random() * daysBack);
        const hoursAgo = Math.floor(Math.random() * 24);
        const minutesAgo = Math.floor(Math.random() * 60);
        const createdAt = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000) - (minutesAgo * 60 * 1000));

        // Build target reference if applicable
        let targetId: mongoose.Types.ObjectId | undefined;
        let targetType: string | undefined;

        if (activity.actionType.includes('POST')) {
          if (posts.length > 0) {
            const randomPost = posts[Math.floor(Math.random() * posts.length)];
            targetId = randomPost._id;
            targetType = 'post';
          }
        } else if (activity.actionType.includes('COMMENT')) {
          if (comments.length > 0) {
            const randomComment = comments[Math.floor(Math.random() * comments.length)];
            targetId = randomComment._id;
            targetType = 'comment';
            // Optionally could set target to comment author
          }
        } else if (activity.actionType.includes('FOLLOW') || activity.actionType.includes('UNFOLLOW')) {
          // Target another user
          const otherUsers = users.filter(u => u._id.toString() !== userId.toString());
          if (otherUsers.length > 0) {
            const randomUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
            targetId = randomUser._id;
            targetType = 'user';
          }
        } else if (activity.actionType.includes('LIKE') || activity.actionType.includes('UNLIKE')) {
          if (posts.length > 0 && activity.actionType.includes('POST') || Math.random() > 0.5) {
            const randomPost = posts[Math.floor(Math.random() * posts.length)];
            targetId = randomPost._id;
            targetType = 'post';
          } else if (comments.length > 0) {
            const randomComment = comments[Math.floor(Math.random() * comments.length)];
            targetId = randomComment._id;
            targetType = 'comment';
          }
        } else if (activity.actionType === 'REPORT_SUBMIT') {
          if (posts.length > 0) {
            const randomPost = posts[Math.floor(Math.random() * posts.length)];
            targetId = randomPost._id;
            targetType = 'post';
          }
        }

        // Random IP address (simulated)
        const ipAddress = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

        // Random user agent
        const userAgents = [
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        ];
        const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

        // Create description with context
        let description = activity.description;
        if (activity.actionType.includes('USERNAME') && username) {
          description = `Changed username to ${username}`;
        } else if (activity.actionType.includes('EMAIL')) {
          description = `Changed email address`;
        } else if (targetId) {
          description = `${activity.description} (target: ${targetType} ${targetId.toString().substring(0, 8)}...)`;
        }

        logsToCreate.push({
          userId,
          actionType: activity.actionType,
          targetId,
          targetType,
          description,
          ipAddress,
          userAgent,
          createdAt,
        });
      }
    }

    // Insert all logs
    await ActivityLog.insertMany(logsToCreate);
    console.log(`✅ Created ${logsToCreate.length} activity log entries`);

    // Summary by action type
    const counts: Record<string, number> = {};
    logsToCreate.forEach(log => {
      counts[log.actionType] = (counts[log.actionType] || 0) + 1;
    });
    console.log("\n📊 Logs by action type:");
    Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });

    await mongoose.disconnect();
    console.log("✅ MongoDB disconnected");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding activity logs:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedActivityLogs();
