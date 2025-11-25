import mongoose from 'mongoose';
import RoleType from '../enums/role-type.js';

const { Schema } = mongoose;

const userSchema = new Schema({
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
});

export default mongoose.model('User', userSchema);