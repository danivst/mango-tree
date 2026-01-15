import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import User from '../models/user';
import { sendEmail } from '../utils/email';

import { JWT_SECRET, JWT_REFRESH_SECRET, CLIENT_URL } from '../config/env';

/* ---------- REGISTER ---------- */
export const registerUser = async (req: Request, res: Response): Promise<Response> => {
  const { username, email, password } = req.body;

  if (!username || username.length < 3) {
    return res.status(400).json({ message: 'Username must be at least 3 characters long.', field: 'username' });
  }

  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'Email must contain @ symbol.', field: 'email' });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long, and must contain at least one of each: capital letter, lower case letter, number and special character.', field: 'password' });
  }

  // Password complexity validation
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long, and must contain at least one of each: capital letter, lower case letter, number and special character.', field: 'password' });
  }

  // Check if email already exists
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    return res.status(400).json({ message: 'Email already in use.', field: 'email' });
  }

  // Check if username already exists
  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    return res.status(400).json({ message: 'Username already in use.', field: 'username' });
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
    { expiresIn: '24h' }
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
  const { username, password } = req.body;

  if (!username || username.length < 2) {
    return res.status(400).json({ message: 'Username does not exist', field: 'username' });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ message: 'Incorrect password', field: 'password' });
  }

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(400).json({ message: 'Username does not exist', field: 'username' });
  }

  // Check if user account was deleted (user won't exist, but check anyway)
  // This is handled by the user not existing above

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(400).json({ message: 'Incorrect password', field: 'password' });
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    message: 'Successfully logged in!',
    token,
    refreshToken,
    user: {
      id: user._id,
      username: user.username,
      role: user.role,
    },
    redirectTo: user.role === 'admin' ? '/dashboard' : '/home',
  });
};

/* ---------- REGISTER ADMIN (ADMIN ONLY) ---------- */
export const registerAdmin = async (req: Request, res: Response): Promise<Response> => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'Email must contain @ symbol.', field: 'email' });
  }

  // Check if email already exists
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    return res.status(400).json({ message: 'Email already in use.', field: 'email' });
  }

  // Generate username from email (whole email without @ and everything after)
  const username = email.replace('@', '').replace(/\..*$/, ''); // Remove @ and everything after first dot

  // Check if username already exists (unlikely but possible)
  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    return res.status(400).json({ message: 'Username already exists for this email format.', field: 'email' });
  }

  // Generate password setup token
  const setupToken = crypto.randomBytes(32).toString('hex');
  const setupTokenExpiry = new Date();
  setupTokenExpiry.setHours(setupTokenExpiry.getHours() + 24); // 24 hours expiry

  // Create user without password (will be set via email link)
  const user = await User.create({
    username,
    email,
    passwordHash: '', // Temporary, will be set when password is created
    role: 'admin',
    resetToken: setupToken,
    resetTokenExpiry: setupTokenExpiry,
  });

  // Send password setup email
  const setupLink = `${CLIENT_URL}/setup-password?token=${setupToken}`;
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #E77728;">MangoTree Admin Account Setup</h2>
      <p>An admin account has been created for you. Please click on the link below to set your password:</p>
      <p><a href="${setupLink}" style="background-color: #E77728; color: #FFBC40; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Set Password</a></p>
      <p>This link will expire in 24 hours. If you have not requested this account, you can ignore this message.</p>
      <p>This message is automated therefore any response to it will be in vain. If you have any questions, email mangotree@support.com.</p>
      <p>Sincerely, the MangoTree team</p>
    </div>
  `;

  try {
    await sendEmail(email, 'MangoTree Admin Account Setup', emailHtml);
  } catch (error: any) {
    // If email fails, delete the user
    await User.findByIdAndDelete(user._id);
    return res.status(500).json({ message: 'Failed to send setup email. Please try again.', field: 'email' });
  }

  return res.status(201).json({
    message: 'Admin account created successfully. Password setup email sent.',
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
};

/* ---------- SETUP PASSWORD (FOR NEW ADMIN ACCOUNTS) ---------- */
export const setupPassword = async (req: Request, res: Response): Promise<Response> => {
  const { token, password } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Token is required.' });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long, and must contain at least one of each: capital letter, lower case letter, number and special character.', field: 'password' });
  }

  // Password complexity validation
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long, and must contain at least one of each: capital letter, lower case letter, number and special character.', field: 'password' });
  }

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: new Date() },
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  user.passwordHash = passwordHash;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  return res.json({ message: 'Password set successfully. You can now login.' });
};

/* ---------- REQUEST PASSWORD RESET ---------- */
export const requestPasswordReset = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'Email must contain @ symbol.', field: 'email' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'Email does not exist.', field: 'email' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date();
  resetTokenExpiry.setMinutes(resetTokenExpiry.getMinutes() + 15); // 15 minutes

  user.resetToken = resetToken;
  user.resetTokenExpiry = resetTokenExpiry;
  await user.save();

  const resetLink = `${CLIENT_URL}/reset-password?token=${resetToken}`;
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #E77728;">MangoTree Password Reset</h2>
      <p>You have requested a password change, please click on the link below and follow the instructions.</p>
      <p>This link will expire in 15 minutes, after that you will have to submit a new request.</p>
      <p><a href="${resetLink}" style="background-color: #E77728; color: #FFBC40; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
      <p>If you have not submitted this request, you can ignore this message.</p>
      <p>This message is automated therefore any response to it will be in vain. If you have any questions, email mangotree@support.com.</p>
      <p>Sincerely, the MangoTree team</p>
    </div>
  `;

  try {
    await sendEmail(email, 'MangoTree Password Reset', emailHtml);
    return res.json({ message: 'Email sent!' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to send email. Please try again.' });
  }
};

/* ---------- RESET PASSWORD ---------- */
export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
  const { token, password, email } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Token is required.' });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long, and must contain at least one of each: capital letter, lower case letter, number and special character.', field: 'password' });
  }

  // Password complexity validation
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long, and must contain at least one of each: capital letter, lower case letter, number and special character.', field: 'password' });
  }

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: new Date() },
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token.' });
  }

  if (email && user.email !== email) {
    return res.status(400).json({ message: 'Email does not match the token.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  user.passwordHash = passwordHash;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  return res.json({ message: 'Password reset successfully.' });
};

/* ---------- GET RESET TOKEN INFO ---------- */
export const getResetTokenInfo = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { token } = req.params;

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: new Date() },
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token.' });
  }

  return res.json({ email: user.email });
};
