/**
 * @file email.ts
 * @description Email service utility.
 * Primary provider: Resend (API-based)
 *
 * Environment variables required:
 * - RESEND_API_KEY: Resend API key (starts with "re_")
 * - RESEND_FROM_EMAIL: Sender email address for Resend
 */

import { Resend } from 'resend';
import logger from '../utils/logger';
import {
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,
} from '../config/env';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

/**
 * Email payload interface
 */
export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

/**
 * Dispatches an email to a specific recipient.
 * Attempts delivery via Resend API first.
 *
 * @param to - Recipient email address
 * @param subject - Email subject line
 * @param html - HTML body content
 * @returns Promise resolving on successful delivery
 * @throws {Error} If Resend fails
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
      let fromEmail = RESEND_FROM_EMAIL || 'support@mangotreeofficial.com';

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

      logger.warn("Resend returned an error...");
    } catch (error) {
      logger.error(error, "Resend failed...");
    }
  }
};