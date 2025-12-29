import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';

import User from '../models/user';
import { sendEmail } from '../utils/email';

/* ---------- ENV SAFETY ---------- */
const {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  CLIENT_URL,
} = process.env;

if (!JWT_SECRET || !JWT_REFRESH_SECRET || !CLIENT_URL) {
  throw new Error('Missing required environment variables');
}

/* ---------- REGISTER ---------- */
export const registerUser = async (req: Request, res: Response): Promise<Response> => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: 'User already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    email,
    passwordHash,
  });

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return res.status(201).json({
    message: 'Registration successful.',
    token,
    refreshToken,
    user: {
      id: user._id,
      username: user.username,
      role: user.role,
    },
  });
};

/* ---------- LOGIN ---------- */
export const loginUser = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials.' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid credentials.' });
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    token,
    refreshToken,
    user: {
      id: user._id,
      username: user.username,
      role: user.role,
    },
  });
};

/* ---------- REQUEST PASSWORD RESET ---------- */
export const requestPasswordReset = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'No user with that email.' });
  }

  const token = crypto.randomBytes(32).toString('hex');

  user.resetToken = token;
  user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  await user.save();

  const resetUrl = `${CLIENT_URL}/reset-password.html?token=${token}`;

  await sendEmail(
    email,
    'Reset your password',
    `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`
  );

  return res.json({ message: 'Password reset email sent.' });
};

/* ---------- RESET PASSWORD ---------- */
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { token, password } = req.body;

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  user.passwordHash = passwordHash;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  return res.json({ message: 'Password reset successful.' });
};