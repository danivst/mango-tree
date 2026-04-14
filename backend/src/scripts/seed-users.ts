/**
 * @file seed-users.ts
 * @description Comprehensive database seeding script for User accounts.
 * Performs the following:
 * 1. Clears existing collections (Users, Posts, Comments, Reports, Notifications).
 * 2. Generates 50 users with hashed passwords and profile images.
 * 3. Randomizes 'Following' and 'Followers' relationships between users.
 * * Run via: `npm run seed:users` or `ts-node src/scripts/seed-users.ts`
 */

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../models/user-model";
import Post from "../models/post-model";
import Comment from "../models/comment-model";
import Report from "../models/report-model";
import Notification from "../models/notification-model";
import BannedUser from "../models/banned-user-model";
import { MONGO_URI } from "../config/env";

dotenv.config();

const USERNAMES = [
  "JamesSmith", "MaryGarcia", "RobertJohnson", "PatriciaMiller", "JohnDavis",
  "JenniferRodriguez", "MichaelMartinez", "LindaHernandez", "WilliamLopez", "ElizabethGonzalez",
  "DavidWilson", "BarbaraAnderson", "RichardThomas", "SusanTaylor", "JosephMoore",
  "JessicaJackson", "ThomasMartin", "SarahLee", "CharlesPerez", "KarenThompson",
  "ChristopherWhite", "NancyHarris", "DanielSanchez", "LisaClark", "MatthewRamirez",
  "BettyLewis", "AnthonyRobinson", "MargaretWalker", "MarkYoung", "SandraAllen",
  "DonaldKing", "AshleyWright", "StevenScott", "KimberlyTorres", "PaulNguyen",
  "EmilyHill", "AndrewFlores", "DonnaGreen", "JoshuaAdams", "MichelleNelson",
  "KennethBaker", "DorothyHall", "KevinRivera", "CarolCampbell", "BrianMitchell",
  "AmandaCarter", "GeorgeRoberts", "MelissaGomez", "EdwardPhillips", "DeborahEvans"
];

const seedUsers = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected for user seeding");

    // Clear existing data as requested
    console.log("Cleaning up existing data...");
    await User.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});
    await Report.deleteMany({});
    await Notification.deleteMany({});
    await BannedUser.deleteMany({});
    // Following/Followers and Likes are embedded in User and Post models respectively, 
    // so clearing User and Post models handles them.

    const users = [];
    for (const username of USERNAMES) {
      const email = `${username.toLowerCase()}@example.com`;
      const password = username.charAt(0).toUpperCase() + username.slice(1) + "123!@#";
      const passwordHash = await bcrypt.hash(password, 10);
      
      const hasProfilePic = Math.random() > 0.5;
      const profileImage = hasProfilePic 
        ? `https://i.pravatar.cc/150?u=${username}` 
        : "";

      users.push({
        username,
        email,
        passwordHash,
        profileImage,
        role: "user",
        isApproved: true,
        bio: `Hello, I'm ${username} and I love cooking!`,
        theme: "mango",
        language: "en"
      });
    }

    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Add random follow relations
    console.log("Generating follow relations...");
    for (const user of createdUsers) {
      // One user follows between 0 and 20 people
      const followCount = Math.floor(Math.random() * 21);
      const potentialFollows = createdUsers.filter(u => u._id.toString() !== user._id.toString());
      
      // Shuffle and pick
      const shuffled = potentialFollows.sort(() => 0.5 - Math.random());
      const followedUsers = shuffled.slice(0, followCount);

      for (const followedUser of followedUsers) {
        user.following.push(followedUser._id as any);
        followedUser.followers.push(user._id as any);
      }
    }

    // Save all users with their new follow relations
    await Promise.all(createdUsers.map(u => u.save()));
    console.log("✅ Follow relations seeded");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ User seeding failed:", err);
    process.exit(1);
  }
};

seedUsers();
