const ReportTargetType = {
  POST: 'post' as const,
  COMMENT: 'comment' as const,
  USER: 'user' as const
};

export type ReportTargetType = typeof ReportTargetType[keyof typeof ReportTargetType];

export default ReportTargetType;