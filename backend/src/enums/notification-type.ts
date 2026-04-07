/**
 * @file notification-type.ts
 * @description Notification type enumeration.
 * Categorizes the different kinds of in-app notifications users can receive.
 */

/**
 * Types of notifications that can be sent to users.
 */
const NotificationType = {
  /** Post received a like */
  LIKE: 'like' as const,
  /** Post received a new comment */
  COMMENT: 'comment' as const,
  /** Comment received a reply */
  REPLY: 'reply' as const,
  /** User started following you */
  FOLLOW: 'follow' as const,
  /** Report received an admin's decision/response */
  REPORT_FEEDBACK: 'report_feedback' as const,
  /** Post was deleted by moderation */
  POST_DELETED: 'post_deleted' as const,
  /** System announcement or alert */
  SYSTEM: 'system' as const,
  /** New login to account detected */
  NEW_LOGIN: 'new_login' as const
};

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export default NotificationType;