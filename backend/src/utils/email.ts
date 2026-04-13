/**
 * @file email.ts
 * @description Email service utility with fallback mechanism.
 * Primary provider: Resend (API-based)
 * Fallback provider: SMTP via nodemailer (Gmail)
 *
 * Environment variables required:
 * - RESEND_API_KEY: Resend API key (starts with "re_")
 * - RESEND_FROM_EMAIL: Sender email address for Resend
 * - SMTP_HOST: SMTP server hostname (e.g., smtp.gmail.com)
 * - SMTP_PORT: SMTP server port (e.g., 587 or 465)
 * - SMTP_USER: Gmail address for SMTP fallback
 * - SMTP_PASS: Gmail app password for SMTP fallback
 */

import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import logger from '../utils/logger';
import {
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS
} from '../config/env';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: Number(SMTP_PORT) === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

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
 * Dispatches an email to a specific recipient.
 * Attempts delivery via Resend API first. If unsuccessful or unconfigured, falls back to SMTP via Nodemailer.
 *
 * @param to - Recipient email address
 * @param subject - Email subject line
 * @param html - HTML body content
 * @returns Promise resolving on successful delivery
 * @throws {Error} If both Resend and SMTP fallback fail
 *
 * @example
 * ```typescript
 * await sendEmail("user@example.com", "Hello!", "<h1>Welcome</h1>");
 * ```
 */
export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  // Attempt to use Resend if API key is configured
  if (resend && RESEND_API_KEY.startsWith('re_')) {
    try {
      let fromEmail = RESEND_FROM_EMAIL || 'onboarding@resend.dev';

      const result = await resend.emails.send({
        from: `MangoTree <${fromEmail}>`,
        to: [to],
        subject,
        html,
      });

      if (result.data && result.data.id) {
        logger.info({ emailId: result.data.id, recipient: to }, "Email sent via Resend");
        return;
      }

      logger.warn("Resend returned an error, attempting SMTP fallback...");
    } catch (error) {
      logger.error(error, "Resend failed, attempting SMTP fallback...");
    }
  }

  // Attempt SMTP fallback if Resend fails or is not configured
  try {
    const fromEmail = SMTP_USER || RESEND_FROM_EMAIL;

    await transporter.sendMail({
      from: `"MangoTree Fallback" <${fromEmail}>`,
      to,
      subject: `[Backup] ${subject}`,
      html,
    });

    logger.info({ recipient: to }, "Email sent successfully via SMTP");
  } catch (smtpError: any) {
    logger.error(smtpError, "Critical: Both Resend and SMTP failed!");
    throw new Error(`Email System Failure: ${smtpError.message}`);
  }
};