/**
 * @file Reports.tsx
 * @description Admin page for handling user-submitted content reports.
 * Displays posts and comments reported by users for inappropriate content or violations.
 * Provides tools for reviewing, dismissing, or deleting reported items with optional user banning.
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminAPI, Report } from "../../../services/admin-api";
import Snackbar from "../../../components/snackbar/Snackbar";
import { useThemeLanguage } from "../../../context/ThemeLanguageContext";
import { getTranslation } from "../../../utils/translations";
import { useAdminData } from "../../../context/AdminDataContext";
import "../../../styles/shared.css";
import "./Reports.css";
import api from "../../../services/api";
import Footer from "../../../components/global/Footer";
import GoBackButton from "../../../components/buttons/back/GoBackButton";
import { useSnackbar } from "../../../utils/snackbar";

// MUI Icon Imports
import RefreshIcon from '@mui/icons-material/Refresh';
import TranslateIcon from '@mui/icons-material/Translate';
import LanguageIcon from '@mui/icons-material/Language';
import FlagIcon from '@mui/icons-material/Flag';

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
    if (import.meta.env.DEV) {
      console.error("Translation error:", err);
    }
    return text;
  }
};

const ReportCard = ({ report, language, t, getTargetTypeLabel, handleView }: any) => {
  const [translated, setTranslated] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  // Check if we should even show the button for translating
  const isDifferentLang = detectLanguage(report.reason) !== language;

  const onTranslate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Toggle logic
    if (showTranslation) {
      setShowTranslation(false);
      return;
    }
    if (translated) {
      setShowTranslation(true);
      return;
    }

    // API Call logic
    setIsTranslating(true);
    try {
      const source = detectLanguage(report.reason);
      const target = language; // Translate TO the current UI language
      
      const result = await deeplTranslate(report.reason, source, target);
      
      setTranslated(result);
      setShowTranslation(true);
    } catch (err) {
      console.error("Translation failed:", err);
    } finally {
      setIsTranslating(false);
    }
  };

  // Determine what text to show in the 30-char preview
  const currentReason = showTranslation && translated ? translated : report.reason;
  const truncated = currentReason.length > 30 
    ? `${currentReason.substring(0, 30)}...` 
    : currentReason;

  return (
    <div className="card">
      <div className="info-row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div className="card-title" style={{ margin: 0 }}>
          {getTargetTypeLabel(report.targetType)}
        </div>
        
        {isDifferentLang && (
          <button 
            onClick={onTranslate}
            disabled={isTranslating}
            className={`btn-translate ${isTranslating ? 'opacity-70' : ''}`}
            style={{ padding: '2px 8px', fontSize: '0.70rem', gap: '4px', minHeight: '28px' }}
          >
            {isTranslating ? (
              <RefreshIcon className="spin" style={{ fontSize: '14px' }} />
            ) : showTranslation ? (
              <TranslateIcon style={{ fontSize: '14px' }} />
            ) : (
              <LanguageIcon style={{ fontSize: '14px' }} />
            )}
            <span>
              {isTranslating ? t("translating") : showTranslation ? t("viewOriginal") : t("translate")}
            </span>
          </button>
        )}
      </div>

      <p className="text-sm mb-4">
        <strong>{t("reason")}:</strong> {truncated}
      </p>

      <button
        className="btn-secondary mt-auto w-full"
        onClick={() => handleView(report)}
      >
        {t("view")}
      </button>
    </div>
  );
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
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  // Reason translation states
  const [showReasonTranslation, setShowReasonTranslation] = useState(false);
  const [reasonTranslationCache, setReasonTranslationCache] = useState<
    string | null
  >(null);
  const [reasonTranslating, setReasonTranslating] = useState(false);

  // Helper to display target type with proper pluralization
  const getTargetTypeLabel = (targetType: string) => {
    if (targetType === "comment") {
      return t("comment");
    }
    return t(targetType);
  };

  // Fetch reports on initial load (avoid requiring manual refresh)
  useEffect(() => {
    if (!hasFetched && !loading) {
      fetchReports().catch(() => {
        // error state handled by context; page also renders `error` if present
      });
    }
  }, [hasFetched, loading, fetchReports]);

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
      showError(t("somethingWentWrong"));
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
      if (import.meta.env.DEV) {
        console.error("Failed to translate reason:", error);
      }
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
      showError(t("pleaseProvideReason"));
      return;
    }

    try {
      await adminAPI.rejectReport(selectedReport._id, reason);
      showSuccess(t("reportRejectedSuccess"));
      handleBackToList();
      await fetchReports();
    } catch (error: any) {
      showError(t("failedToRejectReport"));
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedReport || !reason.trim()) {
      showError(t("pleaseProvideReason"));
      return;
    }

    try {
      await adminAPI.deleteReportedItem(selectedReport._id, reason);
      showSuccess(t("itemDeletedSuccess"));
      handleBackToList();
      await fetchReports();
    } catch (error: any) {
      showError(t("failedToDeleteItem"));
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
                      <RefreshIcon className="spin text-sm" />
                    ) : (
                      showReasonTranslation ? <TranslateIcon className="text-sm" /> : <LanguageIcon className="text-sm" />
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
          onClose={closeSnackbar}
        />
        <Footer />
      </div>
    );
  }

  // Local EmptyState component for no data
  const EmptyState = ({
    icon,
    title,
    message
  }: {
    icon: React.ReactNode;
    title: string;
    message?: string;
  }) => (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      {message && <p className="empty-state-message">{message}</p>}
    </div>
  );

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
            <RefreshIcon className="text-base" />
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
          {t("noDataLoaded")}. {t("clickRefreshToLoad")}.
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={<FlagIcon />}
          title={t("noReports")}
        />
      ) : (
        <div className="cards-grid">
          {reports.map((report) => (
            <ReportCard 
              key={report._id}
              report={report}
              language={language}
              t={t}
              getTargetTypeLabel={getTargetTypeLabel}
              handleView={handleView}
            />
          ))}
      </div>
      )}

      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={closeSnackbar}
      />
      <Footer />
    </div>
  );
};

export default Reports;