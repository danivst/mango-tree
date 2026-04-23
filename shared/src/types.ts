// ============================================================================
// Enums and Basic Types
// ============================================================================

import { RoleType, RoleTypeValue } from "./enums/role-type";
import { ThemeType, ThemeTypeValue } from "./enums/theme-type";
import { LanguageType, LanguageTypeValue } from "./enums/language-type";
import {
  NotificationType,
  NotificationTypeValue,
} from "./enums/notification-type";
import {
  ReportTargetType,
  ReportTargetTypeValue,
} from "./enums/report-target-type";
import {
  ReportStatusType,
  ReportStatusTypeValue,
} from "./enums/report-status-type";

// Re-export for convenience
export { RoleType, RoleTypeValue };
export { ThemeType, ThemeTypeValue };
export { LanguageType, LanguageTypeValue };
export { NotificationType, NotificationTypeValue };
export { ReportTargetType, ReportTargetTypeValue };
export { ReportStatusType, ReportStatusTypeValue };

/**
 * Supported UI theme names.
 * @typedef {'dark' | 'purple' | 'cream' | 'light' | 'mango'} Theme
 */
export type Theme = (typeof ThemeTypeValue)[keyof typeof ThemeTypeValue];
export const ThemeValues = Object.values(ThemeTypeValue);

/**
 * Supported language codes.
 * @typedef {'en' | 'bg'} Language
 */
export type Language =
  (typeof LanguageTypeValue)[keyof typeof LanguageTypeValue];
export const LanguageValues = Object.values(LanguageTypeValue);

// ============================================================================
// Translation Types
// ============================================================================

/**
 * Bilingual translation structure for dynamically stored text.
 * Stores both Bulgarian (bg) and English (en) versions of content.
 *
 * @interface Translation
 * @property {string} bg - Bulgarian translation
 * @property {string} en - English translation
 */
export interface Translation {
  bg: string;
  en: string;
}

/**
 * Translation structure for category names.
 *
 * @interface CategoryTranslations
 * @property {Translation} name - Translated category name
 */
export interface CategoryTranslations {
  name: Translation;
}

/**
 * Translation structure for tag names.
 *
 * @interface TagTranslations
 * @property {Translation} name - Translated tag name
 */
export interface TagTranslations {
  name: Translation;
}

/**
 * Translation structure for comment text.
 *
 * @interface CommentTranslations
 * @property {string} bg - Bulgarian translation
 * @property {string} en - English translation
 */
export interface CommentTranslations {
  bg: string;
  en: string;
}

/**
 * Translation structure for notification messages.
 *
 * @interface NotificationTranslations
 * @property {Translation} message - Translated notification message
 */
export interface NotificationTranslations {
  message: Translation;
}

/**
 * Translation structure for report reasons.
 *
 * @interface ReportTranslations
 * @property {Translation} reason - Translated report reason
 */
export interface ReportTranslations {
  reason: Translation;
}

// ============================================================================
// User & Profile Types
// ============================================================================

/**
 * User preferences for receiving notifications.
 *
 * @interface NotificationPreferences
 * @property {boolean} emailReports - Receive email notifications for reports
 * @property {boolean} emailComments - Receive email notifications for comments
 * @property {boolean} inAppReports - Receive in-app notifications for reports
 * @property {boolean} inAppComments - Receive in-app notifications for comments
 */
export interface NotificationPreferences {
  emailReports: boolean;
  emailComments: boolean;
  inAppReports: boolean;
  inAppComments: boolean;
}
