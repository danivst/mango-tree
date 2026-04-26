/**
 * @file ReportModal.tsx
 * @description Modal for reporting a post or comment.
 * Allows users to enter a specific reason for reporting content. The modal dynamically
 * adjusts its labels and placeholders depending on whether a post or a comment is being reported.
 */

import React from 'react';

import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * @interface ReportModalProps
 * @description Props for the ReportModal component.
 *
 * @property {boolean} open - Whether modal is visible
 * @property {string} reason - Current reason text state
 * @property {(reason: string) => void} onReasonChange - Reason text change handler
 * @property {string | null} reportingCommentId - If set, reporting a comment (null means reporting post)
 * @property {boolean} loading - Whether report submission is in progress
 * @property {() => void} onReport - Submit report handler
 * @property {() => void} onCancel - Cancel/close handler
 * @property {(key: string) => string} t - Translation function
 */
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

/**
 * @component ReportModal
 * @description Renders a modal dialog with a textarea for user feedback on content violations.
 * Features auto-focus on the input field and a loading state for the submission button.
 *
 * @param {ReportModalProps} props - Component props
 * @returns {JSX.Element | null} The rendered report modal or null if not open
 */
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
  /**
   * Guard clause: prevent rendering if the modal is closed.
   */
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
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onReport}
            disabled={loading}
          >
            {loading ? (
              <RefreshIcon className="spin text-base" sx={{ fontSize: 20 }} />
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