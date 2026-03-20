import mongoose, { Document, Schema } from "mongoose";

export interface IBannedUser extends Document {
  email: string;
  username: string;
  original_user_id: mongoose.Types.ObjectId;
  ban_reason: string;
  banned_at: Date;
}

const BannedUserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  original_user_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
    unique: true,
  },
  ban_reason: { type: String, required: true },
  banned_at: { type: Date, default: Date.now },
});

const BannedUser = mongoose.model<IBannedUser>("BannedUser", BannedUserSchema);

export default BannedUser;