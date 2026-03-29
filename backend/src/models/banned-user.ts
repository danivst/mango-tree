/**
 * @file banned-user.ts
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
  original_user_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
    unique: true,
  },
  ban_reason: { 
    type: String, 
    required: true 
  },
  banned_at: { 
    type: Date, 
    default: Date.now 
  },
});

const BannedUser = mongoose.model<IBannedUser>(
  "BannedUser", 
  BannedUserSchema,
);

export default BannedUser;