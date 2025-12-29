import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import RoleType from '../enums/role-type';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: typeof RoleType[keyof typeof RoleType]; 
  resetToken?: string;
  resetTokenExpiry?: Date;
  avatar?: string;
  bio?: string;
  createdAt: Date;
  followers: Types.ObjectId[];
  following: Types.ObjectId[];
}

const userSchema: Schema<IUser> = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: Object.values(RoleType),
    default: RoleType.USER
  },
  resetToken: String,
  resetTokenExpiry: Date,
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: 100,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  followers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;