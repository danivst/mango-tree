import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendEmail } from '../utils/email.js';
import dotenv from 'dotenv';
dotenv.config();

export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ message: 'All fields are required.' });

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'User already exists.' });

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    email,
    passwordHash
  });


  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return res.status(201).json({
    message: 'Registration successful.',
    token,
    refreshToken,
    user: {
      id: user._id,
      username: user.username,
      role: user.role
    }
  });
};


export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Invalid credentials.' });

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    token,
    refreshToken,
    user: {
      id: user._id,
      username: user.username,
      role: user.role
    }
  });
};

export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'No user with that email.' });

  const token = crypto.randomBytes(32).toString('hex');

  user.resetToken = token;
  user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL}/reset-password.html?token=${token}`;

  await sendEmail(
    email,
    'Reset your password',
    `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`
  );

  return res.json({ message: 'Password reset email sent.' });
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() }
  });

  if (!user)
    return res.status(400).json({ message: 'Invalid or expired token.' });

  const passwordHash = await bcrypt.hash(password, 10);

  user.passwordHash = passwordHash;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  return res.json({ message: 'Password reset successful.' });
};