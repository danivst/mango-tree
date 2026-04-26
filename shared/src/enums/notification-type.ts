/**
 * @file notification-type.ts
 * @description Shared notification type values.
 */

const NotificationType = {
  LIKE: "like" as const,
  COMMENT: "comment" as const,
  REPLY: "reply" as const,
  FOLLOW: "follow" as const,
  REPORT_FEEDBACK: "report_feedback" as const,
  DELETED: "deleted" as const,
  SUCCESS: "success" as const,
  FAIL: "fail" as const,
  SYSTEM: "system" as const,
  NEW_LOGIN: "new_login" as const,
};

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export { NotificationType as NotificationTypeValue };
export default NotificationType;
