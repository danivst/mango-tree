const mongoose = require('mongoose');
const { Schema } = mongoose;
const avatarSchema = require('./avatar-item-type');

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
    enum: ['user', 'admin'],
    default: 'user'
  },
  avatar: {
    type: avatarSchema,
    default: () => ({})
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

module.exports = mongoose.model('User', userSchema);