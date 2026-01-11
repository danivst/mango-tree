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

  if (!username || username.length < 3) {
    return res.status(400).json({ message: 'Username must be at least 3 characters long.', field: 'username' });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long.', field: 'password' });
  }

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(400).json({ message: 'Username does not exist', field: 'username' });
  }

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
  });
};

/* ---------- REQUEST PASSWORD RESET ---------- */
export const requestPasswordReset = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    console.log('📧 Password reset request received');
    const { email } = req.body;
    console.log('📧 Request email:', email);

    if (!email) {
      console.error('❌ No email provided in request');
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.error('❌ User not found with email:', email);
      return res.status(400).json({ message: 'No user with that email.' });
    }

    console.log('✅ User found, generating reset token...');
    const token = crypto.randomBytes(32).toString('hex');

    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
    await user.save();
    console.log('✅ Reset token saved to database');

    const resetUrl = `${CLIENT_URL}/reset-password?token=${token}`;
    console.log('🔗 Reset URL:', resetUrl);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #E77728;">MangoTree Password Reset</h2>
        <p>You have requested a password change, please click on the link below and follow the instructions. This link will expire in 15 minutes, after that you will have to submit a new request.</p>
        <p style="margin: 20px 0;">
          <a href="${resetUrl}" style="background-color: #E77728; color: #FFBC40; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 600;">Reset Password</a>
        </p>
        <p>If you have not submitted this request, you can ignore this message.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">This message is automated therefore any response to it will be in vain. If you have any questions, email <a href="mailto:mangotree@support.com">mangotree@support.com</a>.</p>
        <p style="color: #666; font-size: 12px;">Sincerely, the MangoTree team</p>
      </div>
    `;

    console.log('📤 Sending email via Resend...');
    await sendEmail(
      email,
      'MangoTree Password Reset',
      emailHtml
    );
    console.log('✅ Email sent successfully');

    return res.json({ message: 'Password reset email sent.' });
  } catch (error: any) {
    console.error('❌ Error in requestPasswordReset:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ message: error.message || 'Failed to send password reset email.' });
  }
};

/* ---------- GET RESET TOKEN INFO ---------- */
export const getResetTokenInfo = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { token } = req.params;

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token.' });
  }

  return res.json({ email: user.email });
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

  // Password validation
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

  const passwordHash = await bcrypt.hash(password, 10);

  user.passwordHash = passwordHash;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  return res.json({ message: 'Password reset successful.' });
};