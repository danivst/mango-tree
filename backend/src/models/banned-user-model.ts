/**
 * @file banned-user-model.ts
 * @description Mongoose model for BannedUser.
 * Maintains a record of banned users for moderation and to prevent re-registration.
 * Separate from User model to preserve ban history even if user account is deleted.
 *
 * @see IBannedUser interface for the full type definition
 */

import mongoose, { Schema } from "mongoose";
import { IBannedUser } from "../interfaces/banned-user";

const BannedUserSchema: Schema = new Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  originalUserId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
    unique: true,
  },
  banReason: { 
    type: String, 
    required: true 
  },
  bannedAt: { 
    type: Date, 
    default: Date.now 
  },
});

const BannedUser = mongoose.model<IBannedUser>(
  "BannedUser", 
  BannedUserSchema,
);

export default BannedUser;