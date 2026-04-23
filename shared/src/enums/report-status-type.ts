/**
 * @file report-status-type.ts
 * @description Report status enumeration.
 * Tracks the lifecycle of a content report from submission to resolution.
 */

/**
 * Status values for content reports.
 */
const ReportStatusTypeValue = {
  /** Report is newly submitted, awaiting review */
  PENDING: "pending" as const,
  /** Report has been reviewed, awaiting action */
  REVIEWED: "reviewed" as const,
  /** Report was rejected (content kept) */
  REJECTED: "rejected" as const,
  /** Action was taken (content removed, user warned, etc.) */
  ACTION_TAKEN: "action_taken" as const,
};

export type ReportStatusType =
  (typeof ReportStatusTypeValue)[keyof typeof ReportStatusTypeValue];

export { ReportStatusTypeValue };
export default ReportStatusTypeValue;
