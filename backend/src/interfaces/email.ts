/**
 * @file email-templates.interface.ts
 * @description Type definitions for email template parameters.
 * These interfaces define the data structures required by the HTML 
 * template generators to produce consistent, bilingual emails.
 */

/**
 * @interface Get2FAEmailTemplateParams
 * @description Parameters for the 2FA verification email template.
 *
 * @property {string} title - Email title localized to user's language
 * @property {string} intro - Introductory text localized to user's language
 * @property {string} code - The 6-digit verification code
 * @property {string} securityNote - Security note about code expiry and safety
 * @property {string} signature - Email signature
 */
export interface Get2FAEmailTemplateParams {
  title: string;
  intro: string;
  code: string;
  securityNote: string;
  signature: string;
}

/**
 * @interface GetGenericEmailTemplateParams
 * @description Parameters for a generic email template.
 *
 * @property {string} title - Email title localized to user's language
 * @property {string} body - Main body content localized to user's language
 * @property {string} signature - Email signature
 */
export interface GetGenericEmailTemplateParams {
  title: string;
  body: string;
  signature: string;
}

/**
 * @interface GetWelcomeEmailTemplateParams
 * @description Parameters for a welcome email sent after registration.
 *
 * @property {string} username - User's chosen username
 * @property {string} title - Localized title
 * @property {string} greeting - Localized greeting
 * @property {string} body - Localized welcome message body
 * @property {string} signature - Localized signature
 */
export interface GetWelcomeEmailTemplateParams {
  username: string;
  title: string;
  greeting: string;
  body: string;
  signature: string;
}

/**
 * @interface GetAdminCreatedEmailTemplateParams
 * @description Parameters for admin account creation email.
 *
 * @property {string} username - Admin's username
 * @property {string} defaultPassword - Generated temporary password
 * @property {string} title - Localized title
 * @property {string} greeting - Localized greeting
 * @property {string} credentialsLabel - Localized credentials label
 * @property {string} usernameLabel - Localized username label
 * @property {string} passwordLabel - Localized password label
 * @property {string} instruction - Localized instruction about changing password
 * @property {string} footer - Localized footer message
 * @property {string} signature - Localized signature
 */
export interface GetAdminCreatedEmailTemplateParams {
  username: string;
  defaultPassword: string;
  title: string;
  greeting: string;
  credentialsLabel: string;
  usernameLabel: string;
  passwordLabel: string;
  instruction: string;
  footer: string;
  signature: string;
}

/**
 * @interface GetPasswordResetEmailTemplateParams
 * @description Parameters for password reset email.
 *
 * @property {string} resetLink - Reset link URL with token
 * @property {string} title - Localized title
 * @property {string} intro - Localized intro
 * @property {string} buttonText - Localized button text
 * @property {string} ignoreMsg - Localized ignore message
 * @property {string} automatedMsg - Localized automated message
 * @property {string} signature - Localized signature
 */
export interface GetPasswordResetEmailTemplateParams {
  resetLink: string;
  title: string;
  intro: string;
  buttonText: string;
  ignoreMsg: string;
  automatedMsg: string;
  signature: string;
}

/**
 * @interface GetAccountDeletedEmailTemplateParams
 * @description Parameters for account deletion email.
 *
 * @property {string} title - Localized title (self vs admin deletion)
 * @property {string} body - Localized body message explaining deletion
 * @property {string} signature - Localized signature
 */
export interface GetAccountDeletedEmailTemplateParams {
  title: string;
  body: string;
  signature: string;
}

/**
 * @interface GetSuspensionEmailTemplateParams
 * @description Parameters for account suspension notification email.
 *
 * @property {string} title - Localized title
 * @property {string} message - Localized suspension reason message
 * @property {string} signature - Localized signature
 */
export interface GetSuspensionEmailTemplateParams {
  title: string;
  message: string;
  signature: string;
}