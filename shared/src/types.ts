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

export { RoleType, RoleTypeValue };
export { ThemeType, ThemeTypeValue };
export { LanguageType, LanguageTypeValue };
export { NotificationType, NotificationTypeValue };
export { ReportTargetType, ReportTargetTypeValue };
export { ReportStatusType, ReportStatusTypeValue };

/**
 * @typedef {'dark' | 'purple' | 'cream' | 'light' | 'mango'} Theme
 * @description Supported UI theme names.
 */
export type Theme = (typeof ThemeTypeValue)[keyof typeof ThemeTypeValue];
export const ThemeValues = Object.values(ThemeTypeValue);

/**
 * @typedef {'en' | 'bg'} Language
 * @description Supported language codes.
 */
export type Language =
  (typeof LanguageTypeValue)[keyof typeof LanguageTypeValue];
export const LanguageValues = Object.values(LanguageTypeValue);

/**
 * @interface Translation
 * @description Bilingual translation structure for stored text.
 * @property {string} bg - Bulgarian translation.
 * @property {string} en - English translation.
 */
export interface Translation {
  bg: string;
  en: string;
}

/**
 * @interface CategoryTranslations
 * @description Translation structure for category names.
 * @property {Translation} name - Translated category name.
 */
export interface CategoryTranslations {
  name: Translation;
}

/**
 * @interface TagTranslations
 * @description Translation structure for tag names.
 * @property {Translation} name - Translated tag name.
 */
export interface TagTranslations {
  name: Translation;
}

/**
 * @interface CommentTranslations
 * @description Translation structure for comment text.
 * @property {string} bg - Bulgarian translation.
 * @property {string} en - English translation.
 */
export interface CommentTranslations {
  bg: string;
  en: string;
}

/**
 * @interface NotificationTranslations
 * @description Translation structure for notification messages.
 * @property {Translation} message - Translated notification message.
 */
export interface NotificationTranslations {
  message: Translation;
}

/**
 * @interface ReportTranslations
 * @description Translation structure for report reasons.
 * @property {Translation} reason - Translated report reason.
 */
export interface ReportTranslations {
  reason: Translation;
}

/**
 * @interface NotificationPreferences
 * @description User notification preferences.
 * @property {boolean} emailReports - Whether report notifications are sent by email.
 * @property {boolean} emailComments - Whether comment notifications are sent by email.
 * @property {boolean} inAppReports - Whether report notifications are shown in-app.
 * @property {boolean} inAppComments - Whether comment notifications are shown in-app.
 */
export interface NotificationPreferences {
  emailReports: boolean;
  emailComments: boolean;
  inAppReports: boolean;
  inAppComments: boolean;
}
