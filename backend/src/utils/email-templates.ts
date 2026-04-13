/**
 * @file email-templates.ts
 * @description Centralized HTML email template generators.
 * @see interfaces/email.ts for parameter type definitions.
 *
 * This module provides functions to generate consistent, bilingual HTML emails
 * for various user notifications such as 2FA codes, welcome messages, password resets, etc.
 * Each function accepts a parameter object that contains all necessary data to populate the template.
 * The generated HTML is designed to be visually appealing and mobile-responsive.
 */

import {
  Get2FAEmailTemplateParams,
  GetGenericEmailTemplateParams,
  GetWelcomeEmailTemplateParams,
  GetAdminCreatedEmailTemplateParams,
  GetPasswordResetEmailTemplateParams,
  GetAccountDeletedEmailTemplateParams,
  GetSuspensionEmailTemplateParams,
} from "../interfaces/email";

/**
 * Generates the HTML for a two-factor authentication verification email.
 * Includes a prominent 6-digit code display with security instructions.
 *
 * @param params - Object containing title, intro, code, securityNote, and signature
 * @returns HTML string for the email body
 * * @example
 * ```typescript
 * const html = get2FAEmailTemplate({ title: "Security Code", code: "123456", ... });
 * ```
 */
export const get2FAEmailTemplate = (params: Get2FAEmailTemplateParams): string => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
    <h2 style="color: #E77728; margin: 0 0 24px 0; font-size: 28px; text-align: center;">${params.title}</h2>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 20px 0;">Hello ${params.intro}</p>
    <div style="text-align: center; margin: 40px 0;">
      <div style="display: inline-block; background: #f5f5f5; padding: 20px 40px; border-radius: 8px; border: 2px dashed #E77728;">
        <h1 style="color: #E77728; margin: 0; font-size: 48px; letter-spacing: 12px; font-weight: bold;">${params.code}</h1>
      </div>
    </div>
    <p style="font-size: 14px; color: #666; margin: 20px 0;">${params.securityNote}</p>
    <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">${params.signature}</p>
  </div>
`;

/**
 * Generates a simple email with basic text formatting.
 * Used for general notifications that don't require complex layouts.
 *
 * @param params - Object containing title, body, and signature
 * @returns HTML string for the email body
 */
export const getGenericEmailTemplate = (params: GetGenericEmailTemplateParams): string => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
    <h2 style="color: #E77728; margin: 0 0 24px 0; font-size: 28px; text-align: center;">${params.title}</h2>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 30px 0;">${params.body}</p>
    <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">${params.signature}</p>
  </div>
`;

/**
 * Generates the welcome email for new users.
 * Congratulates the user and provides an introductory message to the community.
 *
 * @param params - Object containing title, username, greeting, body, and signature
 * @returns HTML string for the email body
 */
export const getWelcomeEmailTemplate = (params: GetWelcomeEmailTemplateParams): string => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
    <h2 style="color: #E77728; margin: 0 0 24px 0; font-size: 28px; text-align: center;">${params.title}</h2>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 20px 0;">Hello ${params.username},</p>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 30px 0;">${params.body}</p>
    <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">${params.signature}</p>
  </div>
`;

/**
 * Generates the admin account creation email.
 * Includes auto-generated credentials and strong instructions to change the default password.
 *
 * @param params - Object containing title, credentialsLabel, username, defaultPassword, and signature
 * @returns HTML string for the email body
 */
export const getAdminCreatedEmailTemplate = (params: GetAdminCreatedEmailTemplateParams): string => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
    <h2 style="color: #E77728; margin: 0 0 24px 0; font-size: 28px; text-align: center;">${params.title}</h2>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 20px 0;">${params.greeting}</p>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 20px 0;"><strong>${params.credentialsLabel}</strong></p>
    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 0 0 20px 0;">
      <p style="font-size: 16px; line-height: 1.8; color: #333; margin: 0 0 10px 0;">
        ${params.usernameLabel} <strong>${params.username}</strong><br>
        ${params.passwordLabel} <strong style="color: #d32f2f;">${params.defaultPassword}</strong>
      </p>
    </div>
    <p style="font-size: 16px; font-weight: bold; color: #d32f2f; margin: 20px 0;">
      ${params.instruction}
    </p>
    <p style="font-size: 14px; color: #666; margin: 20px 0;">${params.footer}</p>
    <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">${params.signature}</p>
  </div>
`;

/**
 * Generates the password reset email.
 * Includes a secure token-based link rendered as a call-to-action button.
 *
 * @param params - Object containing title, intro, resetLink, buttonText, and signature
 * @returns HTML string for the email body
 */
export const getPasswordResetEmailTemplate = (params: GetPasswordResetEmailTemplateParams): string => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
    <h2 style="color: #E77728; margin: 0 0 24px 0; font-size: 28px; text-align: center;">${params.title}</h2>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 20px 0;">${params.intro}</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${params.resetLink}" style="display: inline-block; background: #E77728; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">${params.buttonText}</a>
    </p>
    <p style="font-size: 14px; color: #666; margin: 20px 0;">${params.ignoreMsg}</p>
    <p style="font-size: 14px; color: #666; margin: 20px 0;">${params.automatedMsg}</p>
    <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">${params.signature}</p>
  </div>
`;

/**
 * Generates the account deletion confirmation email.
 * Notifies the user that their account and data have been removed from the system.
 *
 * @param params - Object containing title, body, and signature
 * @returns HTML string for the email body
 */
export const getAccountDeletedEmailTemplate = (params: GetAccountDeletedEmailTemplateParams): string => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
    <h2 style="color: #E77728; margin: 0 0 24px 0; font-size: 28px; text-align: center;">${params.title}</h2>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 30px 0;">${params.body}</p>
    <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">${params.signature}</p>
  </div>
`;

/**
 * Generates the account suspension notification email.
 * Informs the user of an administrative ban or temporary suspension.
 *
 * @param params - Object containing title, message, and signature
 * @returns HTML string for the email body
 */
export const getSuspensionEmailTemplate = (params: GetSuspensionEmailTemplateParams): string => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
    <h2 style="color: #E77728; margin: 0 0 24px 0; font-size: 28px; text-align: center;">${params.title}</h2>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 30px 0;">${params.message}</p>
    <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">${params.signature}</p>
  </div>
`;


/**
 * Dispatches the correct template based on the notification type.
 * Acts as a centralized factory for HTML email generation.
 *
 * @param type - Union of valid template types
 * @param data - Parameter object matching the required interface for the chosen type
 * @returns Populated HTML string
 * @throws {Error} If an unsupported template type is provided
 * * @example
 * ```typescript
 * const body = buildEmailBody('welcome', { username: "ChefJohn", ... });
 * ```
 */
export function buildEmailBody(
  type: 'welcome' | 'password-reset' | 'account-deleted' | 'admin-created' |
        'suspension' | '2fa' | 'generic',
  data: any
): string {
  switch (type) {
    case '2fa':
      return get2FAEmailTemplate(data);
    case 'welcome':
      return getWelcomeEmailTemplate(data);
    case 'password-reset':
      return getPasswordResetEmailTemplate(data);
    case 'account-deleted':
      return getAccountDeletedEmailTemplate(data);
    case 'admin-created':
      return getAdminCreatedEmailTemplate(data);
    case 'suspension':
      return getSuspensionEmailTemplate(data);
    case 'generic':
      return getGenericEmailTemplate(data);
    default:
      throw new Error(`Unknown email template type: ${type}`);
  }
} 