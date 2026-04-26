/**
 * @file report-target-type.ts
 * @description Shared report target values.
 */

const ReportTargetType = {
  POST: "post" as const,
  COMMENT: "comment" as const,
  USER: "user" as const,
};

export type ReportTargetType =
  (typeof ReportTargetType)[keyof typeof ReportTargetType];

export { ReportTargetType as ReportTargetTypeValue };
export default ReportTargetType;
