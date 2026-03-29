/**
 * @file email.ts
 * @description Email service utility with fallback mechanism.
 * Primary provider: Resend (API-based)
 * Fallback provider: SMTP via nodemailer (Gmail)
 *
 * Environment variables required:
 * - RESEND_API_KEY: Resend API key (starts with "re_")
 * - RESEND_FROM_EMAIL: Sender email address for Resend
 * - SMTP_USER: Gmail address for SMTP fallback
 * - SMTP_PASS: Gmail app password for SMTP fallback
 */

import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import {
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,
  SMTP_USER,
  SMTP_PASS
} from '../config/env';

/**
 * Email payload interface
 */
export interface EmailPayload {
  /** Recipient email address */
  to: string;
  /** Email subject line */
  subject: string;
  /** HTML body content */
  html: string;
}

/**
 * Sends an email with automatic fallback from Resend to SMTP.
 * Attempts Resend first if API key is configured and valid.
 * If Resend fails or is not configured, falls back to SMTP transport.
 *
 * @param to - Recipient email address
 * @param subject - Email subject line
 * @param html - HTML content for the email body
 * @returns Promise that resolves when email is successfully sent
 * @throws {Error} If both Resend and SMTP fail
 *
 * @example
 * ```typescript
 * await sendEmail(
 *   'user@example.com',
 *   'Welcome!',
 *   '<h1>Hello!</h1><p>Welcome to our app.</p>'
 * );
 * ```
 */
export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  // Attempt to use Resend if API key is configured
  if (RESEND_API_KEY && RESEND_API_KEY.startsWith('re_')) {
    try {
      const resend = new Resend(RESEND_API_KEY);
      let fromEmail = RESEND_FROM_EMAIL || 'onboarding@resend.dev';

      const result = await resend.emails.send({
        from: `MangoTree <${fromEmail}>`,
        to: [to],
        subject,
        html,
      });

      if (result.data && result.data.id) {
        console.log(`Email sent via Resend! ID: ${result.data.id}`);
        return;
      }

      console.warn('Resend returned an error, attempting SMTP fallback...');
    } catch (error) {
      console.error('Resend failed, attempting SMTP fallback...', error);
    }
  }

  // Attempt SMTP fallback if Resend fails or is not configured
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const fromEmail = SMTP_USER || RESEND_FROM_EMAIL;

    await transporter.sendMail({
      from: `"MangoTree Fallback" <${fromEmail}>`,
      to,
      subject: `[Backup] ${subject}`,
      html,
    });

    console.log(`Email sent successfully via SMTP to ${to}`);
  } catch (smtpError: any) {
    console.error('Critical: Both Resend and SMTP failed!');
    throw new Error(`Email System Failure: ${smtpError.message}`);
  }
};
