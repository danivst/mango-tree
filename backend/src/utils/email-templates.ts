/**
 * @file email-templates.ts
 * @description Centralized HTML email template generators.
 * All email templates follow a consistent design language:
 * - Primary color: #E77728 (MangoTree orange)
 * - Font: 'Segoe UI', Arial, sans-serif
 * - Max width: 600px
 * - Responsive design with inline styles
 *
 * Each template function returns an HTML string ready to be passed to the email service.
 * Templates support bilingual content (English/Bulgarian) through parameters.
 */

import { getLocalizedText } from "./get-translation";

/**
 * Parameters for the 2FA verification email template.
 */
export interface Get2FAEmailTemplateParams {
  /** Email title localized to user's language */
  title: string;
  /** Introductory text localized to user's language */
  intro: string;
  /** The 6-digit verification code */
  code: string;
  /** Security note about code expiry and safety */
  securityNote: string;
  /** Email signature */
  signature: string;
}

/**
 * Generates the HTML for a two-factor authentication verification email.
 * Features a prominently displayed code in a dashed orange box.
 *
 * @param params - Template parameters
 * @returns HTML string for the 2FA email
 *
 * @example
 * ```typescript
 * const html = get2FAEmailTemplate({
 *   title: "MangoTree Two-Factor Authentication",
 *   intro: "To log in, use the following code:",
 *   code: "123456",
 *   securityNote: "This code expires in 10 minutes.",
 *   signature: "Sincerely, the MangoTree team"
 * });
 * ```
 */
export const get2FAEmailTemplate = (
  params: Get2FAEmailTemplateParams
): string => `
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
 * Parameters for a generic email template (simple title/body/signature).
 */
export interface GetGenericEmailTemplateParams {
  /** Email title localized to user's language */
  title: string;
  /** Main body content localized to user's language */
  body: string;
  /** Email signature */
  signature: string;
}

/**
 * Generates a simple email with title, body, and signature.
 * Suitable for notifications and announcements.
 *
 * @param params - Template parameters
 * @returns HTML string for the email
 *
 * @example
 * ```typescript
 * const html = getGenericEmailTemplate({
 *   title: "Welcome to MangoTree!",
 *   body: "Your account has been created successfully.",
 *   signature: "The MangoTree Team"
 * });
 * ```
 */
export const getGenericEmailTemplate = (
  params: GetGenericEmailTemplateParams
): string => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
    <h2 style="color: #E77728; margin: 0 0 24px 0; font-size: 28px; text-align: center;">${params.title}</h2>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 30px 0;">${params.body}</p>
    <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">${params.signature}</p>
  </div>
`;

/**
 * Parameters for a welcome email sent after registration.
 */
export interface GetWelcomeEmailTemplateParams {
  /** User's chosen username */
  username: string;
  /** Localized title */
  title: string;
  /** Localized greeting */
  greeting: string;
  /** Localized welcome message body */
  body: string;
  /** Localized signature */
  signature: string;
}

/**
 * Generates the welcome email for new users.
 *
 * @param params - Template parameters
 * @returns HTML string for the welcome email
 */
export const getWelcomeEmailTemplate = (
  params: GetWelcomeEmailTemplateParams
): string => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
    <h2 style="color: #E77728; margin: 0 0 24px 0; font-size: 28px; text-align: center;">${params.title}</h2>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 20px 0;">Hello ${params.username},</p>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 20px 0;">${params.greeting}</p>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 30px 0;">${params.body}</p>
    <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">${params.signature}</p>
  </div>
`;

/**
 * Parameters for admin account creation email.
 */
export interface GetAdminCreatedEmailTemplateParams {
  /** Admin's username */
  username: string;
  /** Generated temporary password */
  defaultPassword: string;
  /** Localized title */
  title: string;
  /** Localized greeting */
  greeting: string;
  /** Localized credentials label */
  credentialsLabel: string;
  /** Localized username label */
  usernameLabel: string;
  /** Localized password label */
  passwordLabel: string;
  /** Localized instruction about changing password */
  instruction: string;
  /** Localized footer message */
  footer: string;
  /** Localized signature */
  signature: string;
}

/**
 * Generates the admin account creation email with credentials.
 * Includes a highlighted box with username and temporary password.
 *
 * @param params - Template parameters
 * @returns HTML string for the admin creation email
 */
export const getAdminCreatedEmailTemplate = (
  params: GetAdminCreatedEmailTemplateParams
): string => `
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
 * Parameters for password reset email.
 */
export interface GetPasswordResetEmailTemplateParams {
  /** Reset link URL with token */
  resetLink: string;
  /** Localized title */
  title: string;
  /** Localized intro */
  intro: string;
  /** Localized button text */
  buttonText: string;
  /** Localized ignore message */
  ignoreMsg: string;
  /** Localized automated message */
  automatedMsg: string;
  /** Localized signature */
  signature: string;
}

/**
 * Generates the password reset email with a call-to-action button.
 *
 * @param params - Template parameters
 * @returns HTML string for the password reset email
 */
export const getPasswordResetEmailTemplate = (
  params: GetPasswordResetEmailTemplateParams
): string => `
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
 * Parameters for account deletion email.
 */
export interface GetAccountDeletedEmailTemplateParams {
  /** Localized title (different for self vs admin deletion) */
  title: string;
  /** Localized body message explaining deletion */
  body: string;
  /** Localized signature */
  signature: string;
}

/**
 * Generates the account deletion confirmation email.
 *
 * @param params - Template parameters
 * @returns HTML string for the deletion email
 */
export const getAccountDeletedEmailTemplate = (
  params: GetAccountDeletedEmailTemplateParams
): string => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
    <h2 style="color: #E77728; margin: 0 0 24px 0; font-size: 28px; text-align: center;">${params.title}</h2>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 30px 0;">${params.body}</p>
    <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">${params.signature}</p>
  </div>
`;

/**
 * Parameters for account suspension/notification email.
 */
export interface GetSuspensionEmailTemplateParams {
  /** Localized title */
  title: string;
  /** Localized suspension reason message (includes reason) */
  message: string;
  /** Localized signature */
  signature: string;
}

/**
 * Generates the account suspension notification email.
 * Used when an admin suspends a user's account.
 *
 * @param params - Template parameters
 * @returns HTML string for the suspension email
 */
export const getSuspensionEmailTemplate = (
  params: GetSuspensionEmailTemplateParams
): string => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
    <h2 style="color: #E77728; margin: 0 0 24px 0; font-size: 28px; text-align: center;">${params.title}</h2>
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 30px 0;">${params.message}</p>
    <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">${params.signature}</p>
  </div>
`;

/**
 * Helper function to build an email body using the appropriate template.
 * This function can be used by email service to choose template based on type.
 *
 * @param type - Email template type
 * @param data - Data required for the specific template
 * @returns HTML string
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
