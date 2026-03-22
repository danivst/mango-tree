const NotificationType = {
  LIKE: 'like' as const,
  COMMENT: 'comment' as const,
  REPLY: 'reply' as const,
  FOLLOW: 'follow' as const,
  REPORT_FEEDBACK: 'report_feedback' as const,
  POST_DELETED: 'post_deleted' as const,
  SYSTEM: 'system' as const,
};

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export default NotificationType;