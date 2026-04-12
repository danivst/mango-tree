/**
 * @file seed-comments.ts
 * @description Database seeding script for generating random user comments.
 * Associates random users with random posts and assigns a text from a predefined pool.
 * Each post receives a random number of comments (between 1 and 10).
 * * Run via: `npm run seed:comments` or `ts-node src/scripts/seed-comments.ts`
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user-model";
import Post from "../models/post-model";
import Comment from "../models/comment-model";
import { MONGO_URI } from "../config/env";

dotenv.config();

const COMMENT_TEXTS = [
  "Wow, this looks incredible! Thanks for sharing.",
  "I tried this yesterday and it was a total hit with my family.",
  "Quick question: can I swap the butter for olive oil?",
  "Great tips, I never thought of doing it that way.",
  "This is exactly what I was looking for. Bookmarked!",
  "Stunning presentation! You have a real talent.",
  "I'm definitely making this for my next dinner party.",
  "Does anyone know if this freezes well?",
  "I struggled with the timing, but the flavor was spot on.",
  "So glad I found your profile, love your content!",
  "Mine didn't turn out as pretty as yours, but it tasted great.",
  "Can you do a video tutorial on this?",
  "I've been wondering about this for a while, thanks for the info.",
  "This is a game changer for my weeknight meals.",
  "Looks delicious! What kind of pan did you use?",
  "Absolutely beautiful. The colors are so vibrant.",
  "I added a bit of chili flakes for extra kick, highly recommend!",
  "Best recipe I've found on here so far.",
  "Is there a vegan alternative for the cheese?",
  "Thanks for the inspiration, I'm going to try this tonight."
];

const seedComments = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected for comment seeding");

    const users = await User.find();
    const posts = await Post.find();

    if (users.length === 0 || posts.length === 0) {
      console.log("❌ Users or Posts missing. Run previous seeds first.");
      process.exit(1);
    }

    const allComments = [];

    for (const post of posts) {
      // Each post has between 1 and 10 comments
      const commentCount = Math.floor(Math.random() * 10) + 1;

      for (let i = 0; i < commentCount; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomText = COMMENT_TEXTS[Math.floor(Math.random() * COMMENT_TEXTS.length)];

        allComments.push({
          postId: post._id,
          userId: randomUser._id,
          text: randomText,
          isVisible: true,
          likes: []
        });
      }
    }

    const createdComments = await Comment.insertMany(allComments);
    console.log(`✅ Created ${createdComments.length} comments`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Comment seeding failed:", err);
    process.exit(1);
  }
};

seedComments();
