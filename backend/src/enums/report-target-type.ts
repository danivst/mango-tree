/**
 * @file report-target-type.ts
 * @description Report target type enumeration.
 * Indicates what kind of content is being reported.
 */

/**
 * Content types that can be reported.
 */
const ReportTargetType = {
  /** A post is being reported */
  POST: 'post' as const,
  /** A comment is being reported */
  COMMENT: 'comment' as const,
  /** A user account is being reported */
  USER: 'user' as const
};

export type ReportTargetType = typeof ReportTargetType[keyof typeof ReportTargetType];

export default ReportTargetType;