import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminAPI, Report } from "../../services/admin-api";
import Snackbar from "../../components/Snackbar";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation } from "../../utils/translations";
import { useAdminData } from "../../context/AdminDataContext";
import "../../styles/shared.css";
import "./Reports.css";
import api from "../../services/api";
import Footer from "../../components/Footer";
import GoBackButton from "../../components/GoBackButton";

/**
 * @file Reports.tsx
 * @description Admin page for handling user-submitted content reports.
 * Displays posts and comments reported by users for inappropriate content or violations.
 *
 * Features:
 * - List reported posts and comments (filterable by type)
 * - View report details: reason, reporter, reported content
 * - Dismiss reports (mark as reviewed, no action)
 * - Delete reported content (and optionally ban author)
 * - Ban author from delete modal checkbox
 * - Translation support for report reasons (EN/BG)
 * - Direct navigation to reported content's page
 *
 * Report Types:
 * - post: User reported a post
 * - comment: User reported a comment
 *
 * Actions:
 * - Dismiss: Mark report as "reviewed" without deleting content
 * - Delete Content: Delete the reported post/comment, optionally ban author
 *
 * Data Source:
 * - Uses AdminDataContext.reports (filtered to pending only) from fetchReports()
 *
 * Access Control:
 * - Route protected by AdminRoute (admin only)
 *
 * Architecture:
 * - Uses child component ReportItem for each report entry
 * - ReportItem contains modal for delete/ban actions
 * - Internationalization: translates report reasons using stored translations or Deepl API
 *
 * @page
 * @requires useState - Reports list, selected report type filter, report preview, modal states, loading
 * @requires useMemo - Computed filtered reports by type
 * @requires useEffect - No direct mount effect; data from AdminDataContext
 * @requires useThemeLanguage - Current UI language for translations
 * @requires useAdminData - Access to reports array (pending only) and reportsState
 * @requires useNavigate - Navigate to post detail page, admin home
 * @requires adminAPI - Get reports, update report status (dismiss), delete post/comment
 * @requires api - General API for Deepl translation, deleting users (for ban)
 * @requires Snackbar - Feedback on dismiss/delete/ban
 * @requires Footer - Footer component
 */

const detectLanguage = (text: string): "en" | "bg" => {
  if (!text) return "en";
  if (/[а-яА-ЯёЁ]/.test(text)) {
    return "bg";
  }
  return "en";
};

const deeplTranslate = async (
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<string> => {
  if (!text || sourceLang === targetLang) return text;
  try {
    const res = await api.post("/translate", { text, sourceLang, targetLang });
    return res.data.translation || text;
  } catch (err) {
    console.error("Translation error:", err);
    return text;
  }
};

const Reports = () => {
  const navigate = useNavigate();
  const { reportId } = useParams<{ reportId?: string }>();
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);
  const { reports, reportsState, fetchReports } = useAdminData();
  const { loading, error, hasFetched } = reportsState;
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [reason, setReason] = useState("");
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: "success" | "error";
  }>({ open: false, message: "", type: "success" });

  // Reason translation states
  const [showReasonTranslation, setShowReasonTranslation] = useState(false);
  const [reasonTranslationCache, setReasonTranslationCache] = useState<
    string | null
  >(null);
  const [reasonTranslating, setReasonTranslating] = useState(false);

  // Helper to display target type with proper pluralization
  const getTargetTypeLabel = (targetType: string) => {
    if (targetType === "comment") {
      return t("comments");
    }
    return t(targetType);
  };

  // Load selected report when reportId param changes
  useEffect(() => {
    if (reportId) {
      const report = reports.find((r) => r._id === reportId);
      if (report) {
        handleView(report);
      }
    }
  }, [reportId, reports]);

  const handleRefresh = async () => {
    try {
      await fetchReports();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: t("somethingWentWrong"),
        type: "error",
      });
    }
  };

  const handleView = async (report: Report) => {
    setSelectedReport(report);
    // Reset translation states when viewing a new report
    setShowReasonTranslation(false);
    setReasonTranslationCache(null);
    setReasonTranslating(false);
    // Update URL with report ID
    navigate(`/admin/dashboard/reports/${report._id}`, { replace: true });
  };

  const handleTranslateReason = async () => {
    if (!selectedReport) return;

    if (showReasonTranslation) {
      setShowReasonTranslation(false);
      return;
    }

    if (reasonTranslationCache) {
      setShowReasonTranslation(true);
      return;
    }

    setReasonTranslating(true);
    try {
      const reasonLang = detectLanguage(selectedReport.reason);
      const targetLang = reasonLang === "en" ? "bg" : "en";
      const translated = await deeplTranslate(
        selectedReport.reason,
        reasonLang,
        targetLang,
      );
      setReasonTranslationCache(translated);
      setShowReasonTranslation(true);
    } catch (error) {
      console.error("Failed to translate reason:", error);
    } finally {
      setReasonTranslating(false);
    }
  };

  const shouldShowTranslateButton = selectedReport
    ? detectLanguage(selectedReport.reason) !== language
    : false;

  const handleBackToList = () => {
    setSelectedReport(null);
    setShowReject(false);
    setShowDelete(false);
    setReason("");
    setShowReasonTranslation(false);
    setReasonTranslationCache(null);
    setReasonTranslating(false);
    navigate("/admin/dashboard/reports", { replace: true });
  };

  const handleReject = async () => {
    if (!selectedReport || !reason.trim()) {
      setSnackbar({
        open: true,
        message: t("pleaseProvideReason"),
        type: "error",
      });
      return;
    }

    try {
      await adminAPI.rejectReport(selectedReport._id, reason);
      setSnackbar({
        open: true,
        message: t("reportRejectedSuccess"),
        type: "success",
      });
      handleBackToList();
      await fetchReports();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t("failedToRejectReport"),
        type: "error",
      });
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedReport || !reason.trim()) {
      setSnackbar({
        open: true,
        message: t("pleaseProvideReason"),
        type: "error",
      });
      return;
    }

    try {
      await adminAPI.deleteReportedItem(selectedReport._id, reason);
      setSnackbar({
        open: true,
        message: t("itemDeletedSuccess"),
        type: "success",
      });
      handleBackToList();
      await fetchReports();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t("failedToDeleteItem"),
        type: "error",
      });
    }
  };

  const handlePreviewPost = () => {
    if (selectedReport) {
      navigate(`/admin/dashboard/reports/${selectedReport._id}/preview`);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="loading">{t("loading")}</div>
        <Footer />
      </div>
    );
  }

  // If a report is selected (either by URL param or state), show detail view
  if (selectedReport) {
    return (
      <div>
        <div className="content-view">
          <div className="mb-6">
            <GoBackButton onClick={handleBackToList} />
          </div>
          <div className="content-card">
            <h2 className="m-0">{t("reportDetails")}</h2>
            <p>
              <strong>{t("submittedBy")}:</strong>{" "}
              {selectedReport.reportedBy.username}
            </p>
            <p>
              <strong>{t("category")}:</strong>{" "}
              {getTargetTypeLabel(selectedReport.targetType)}
            </p>
            <div className="mt-5">
              <div className="info-row">
                <strong>{t("reasonDescription")}:</strong>
                {shouldShowTranslateButton && (
                  <button
                    onClick={handleTranslateReason}
                    disabled={reasonTranslating}
                    className={`btn-translate ${reasonTranslating ? 'opacity-70' : ''}`}
                  >
                    {reasonTranslating ? (
                      <span className="material-icons spin text-sm">refresh</span>
                    ) : (
                      <span className="material-icons text-sm">
                        {showReasonTranslation ? "translate" : "language"}
                      </span>
                    )}
                    <span>
                      {reasonTranslating
                        ? t("translating")
                        : showReasonTranslation
                          ? t("viewOriginal")
                          : t("translate")}
                    </span>
                  </button>
                )}
              </div>
              {(showReasonTranslation
                ? reasonTranslationCache
                : selectedReport.reason) && (
                <p className="whitespace-pre-wrap">
                  {showReasonTranslation
                    ? reasonTranslationCache
                    : selectedReport.reason}
                </p>
              )}
            </div>
            <div className="mt-5">
              <p>
                <strong>{t("referenceToItem")}:</strong>{" "}
                <button
                  onClick={handlePreviewPost}
                  className="link-button"
                >
                  {getTargetTypeLabel(selectedReport.targetType)} #
                  {selectedReport.targetId}
                </button>
              </p>
            </div>
            {!showReject && !showDelete ? (
              <div
                className="modal-actions mt-6"
              >
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowReject(true);
                    setShowDelete(false);
                  }}
                >
                  {t("reject")}
                </button>
                <button
                  className="btn-danger"
                  onClick={() => {
                    setShowDelete(true);
                    setShowReject(false);
                  }}
                >
                  {t("deleteItem")}
                </button>
              </div>
            ) : showReject ? (
              <div className="mt-6">
                <p className="mb-3">
                  {t("reasonForRejecting")}:
                </p>
                <textarea
                  className="form-textarea mb-3"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  placeholder={t("enterReasonForRejection")}
                />
                <div className="modal-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setShowReject(false);
                      setReason("");
                    }}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={handleReject}
                  >
                    {t("submitRejection")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <p className="mb-3">
                  {t("reasonForDeleting")}:
                </p>
                <textarea
                  className="form-textarea mb-3"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  placeholder={t("enterReasonForDeletion")}
                />
                <div className="modal-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setShowDelete(false);
                      setReason("");
                    }}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    className="btn-danger"
                    onClick={handleDeleteItem}
                  >
                    {t("deleteItem")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          open={snackbar.open}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
        <Footer />
      </div>
    );
  }

  // Otherwise show the list of reports
  return (
    <div>
      <div className="page-container-header">
        <h1 className="page-container-title">{t("reports")}</h1>
        <div className="page-container-actions">
          <button
            className="btn-secondary icon-btn"
            onClick={handleRefresh}
            disabled={loading}
          >
            <span className="material-icons text-base">
              refresh
            </span>
            {t("refresh")}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-box-colored">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="loading">{t("loading")}</div>
      ) : !hasFetched ? (
        <div className="loading">
          No data loaded. Click Refresh to load data.
        </div>
      ) : reports.length === 0 ? (
        <div className="loading">
          {t("noReports")}
        </div>
      ) : (
        <div className="cards-grid">
          {reports.map((report) => (
            <div key={report._id} className="card">
              <div className="card-title">
                {getTargetTypeLabel(report.targetType)}
              </div>
              <p className="text-sm opacity-70 mb-3">
                @{report.reportedBy.username}
              </p>
              <button
                className="btn-secondary mt-auto w-full"
                onClick={() => handleView(report)}
              >
                {t("view")}
              </button>
            </div>
          ))}
        </div>
      )}

      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
      <Footer />
    </div>
  );
};

export default Reports;
