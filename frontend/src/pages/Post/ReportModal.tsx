/**
 * @file ReportModal.tsx
 * @description Modal for reporting a post or comment.
 * Allows user to enter a reason for reporting content.
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.open - Whether modal is visible
 * @param {string} props.reason - Current reason text
 * @param {(reason: string) => void} props.onReasonChange - Reason text change handler
 * @param {string | null} props.reportingCommentId - If set, reporting a comment (null means reporting post)
 * @param {boolean} props.loading - Whether report submission is in progress
 * @param {() => void} props.onReport - Submit report handler
 * @param {() => void} props.onCancel - Cancel/close handler
 * @param {(key: string) => string} props.t - Translation function
 * @returns {JSX.Element}
 */
import React from 'react';

interface ReportModalProps {
  open: boolean;
  reason: string;
  onReasonChange: (reason: string) => void;
  reportingCommentId: string | null;
  loading: boolean;
  onReport: () => void;
  onCancel: () => void;
  t: (key: string) => string;
}

const ReportModal: React.FC<ReportModalProps> = ({
  open,
  reason,
  onReasonChange,
  reportingCommentId,
  loading,
  onReport,
  onCancel,
  t
}) => {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-warning" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">
          {t(reportingCommentId ? "reportComment" : "reportPost")}
        </h2>
        <p className="modal-text">
          {t("reasonForReport")}:
        </p>
        <textarea
          className="form-textarea mb-3"
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          rows={4}
          placeholder={t(reportingCommentId ? "enterReportReasonComment" : "enterReportReason")}
          autoFocus
        />
        <div className="modal-actions">
          <button
            className="btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {t("cancel")}
          </button>
          <button
            className="btn-primary"
            onClick={onReport}
            disabled={loading}
          >
            {loading ? (
              <span className="material-icons spin text-base">refresh</span>
            ) : (
              t("report")
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
