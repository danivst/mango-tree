const ReportStatusTypeValue = {
  PENDING: 'pending' as const,
  REVIEWED: 'reviewed' as const,
  REJECTED: 'rejected' as const,
  ACTION_TAKEN: 'action_taken' as const
};

export type ReportStatusType = typeof ReportStatusTypeValue[keyof typeof ReportStatusTypeValue];

export default ReportStatusTypeValue;