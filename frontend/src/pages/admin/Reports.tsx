import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminAPI, Report } from "../../services/adminAPI";
import Snackbar from "../../components/Snackbar";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation } from "../../utils/translations";
import { useAdminData } from "../../context/AdminDataContext";
import "./AdminPages.css";
import api from "../../services/api";
import Footer from "../../components/Footer";

const detectLanguage = (text: string): 'en' | 'bg' => {
  if (!text) return 'en';
  if (/[а-яА-ЯёЁ]/.test(text)) {
    return 'bg';
  }
  return 'en';
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
  const [reasonTranslationCache, setReasonTranslationCache] = useState<string | null>(null);
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
        message: err.response?.data?.message || t("somethingWentWrong"),
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
      const translated = await deeplTranslate(selectedReport.reason, reasonLang, targetLang);
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
        message: error.response?.data?.message || t("failedToRejectReport"),
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
        message: error.response?.data?.message || t("failedToDeleteItem"),
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
      <div className="admin-page">
        <div className="admin-loading">{t("loading")}</div>
        <Footer />
      </div>
    );
  }

  // If a report is selected (either by URL param or state), show detail view
  if (selectedReport) {
    return (
      <div className="admin-page">
        <div className="admin-content-view">
          <div style={{ marginBottom: "24px" }}>
            <button
              onClick={handleBackToList}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                border: "2px solid var(--theme-text)",
                borderRadius: "12px",
                background: "transparent",
                color: "var(--theme-text)",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              <span className="material-icons" style={{ fontSize: "18px" }}>
                arrow_back
              </span>
              {t("goBack") || "Go Back"}
            </button>
          </div>
          <div className="admin-content-card">
            <h2 style={{ marginTop: 0 }}>{t("reportDetails")}</h2>
            <p>
              <strong>{t("submittedBy")}:</strong>{" "}
              {selectedReport.reportedBy.username}
            </p>
            <p>
              <strong>{t("category")}:</strong>{" "}
              {getTargetTypeLabel(selectedReport.targetType)}
            </p>
            <div style={{ marginTop: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <strong>{t("reasonDescription")}:</strong>
                {shouldShowTranslateButton && (
                  <button
                    onClick={handleTranslateReason}
                    disabled={reasonTranslating}
                    style={{
                      padding: "4px 10px",
                      border: "2px solid var(--theme-accent)",
                      background: "var(--theme-accent)",
                      color: "var(--theme-text)",
                      borderRadius: "8px",
                      cursor: reasonTranslating ? "not-allowed" : "pointer",
                      fontSize: "12px",
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      opacity: reasonTranslating ? 0.7 : 1,
                    }}
                  >
                    {reasonTranslating ? (
                      <span className="material-icons spin" style={{ fontSize: "14px" }}>refresh</span>
                    ) : (
                      <span className="material-icons" style={{ fontSize: "14px" }}>
                        {showReasonTranslation ? "translate" : "language"}
                      </span>
                    )}
                    <span>
                      {reasonTranslating
                        ? t("translating") || "Translating..."
                        : showReasonTranslation
                        ? t("viewOriginal")
                        : t("translate")
                      }
                    </span>
                  </button>
                )}
              </div>
              {(showReasonTranslation ? reasonTranslationCache : selectedReport.reason) && (
                <p style={{ whiteSpace: "pre-wrap" }}>
                  {showReasonTranslation ? reasonTranslationCache : selectedReport.reason}
                </p>
              )}
            </div>
            <div style={{ marginTop: "20px" }}>
              <p>
                <strong>{t("referenceToItem")}:</strong>{" "}
                <button
                  onClick={handlePreviewPost}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--theme-text)",
                    textDecoration: "underline",
                    fontWeight: 500,
                    cursor: "pointer",
                    padding: 0,
                    fontFamily: "inherit",
                  }}
                >
                  {getTargetTypeLabel(selectedReport.targetType)} #{selectedReport.targetId}
                </button>
              </p>
            </div>
            {!showReject && !showDelete ? (
              <div
                className="admin-modal-actions"
                style={{ marginTop: "24px" }}
              >
                <button
                  className="admin-button-secondary"
                  onClick={() => {
                    setShowReject(true);
                    setShowDelete(false);
                  }}
                >
                  {t("reject")}
                </button>
                <button
                  className="admin-button-danger"
                  onClick={() => {
                    setShowDelete(true);
                    setShowReject(false);
                  }}
                >
                  {t("deleteItem")}
                </button>
              </div>
            ) : showReject ? (
              <div style={{ marginTop: "24px" }}>
                <p style={{ marginBottom: "12px" }}>
                  {t("reasonForRejecting")}:
                </p>
                <textarea
                  className="admin-form-textarea"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  placeholder={t("enterReasonForRejection")}
                  style={{ marginBottom: "12px" }}
                />
                <div className="admin-modal-actions">
                  <button
                    className="admin-button-secondary"
                    onClick={() => {
                      setShowReject(false);
                      setReason("");
                    }}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    className="admin-button-secondary"
                    onClick={handleReject}
                  >
                    {t("submitRejection")}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: "24px" }}>
                <p style={{ marginBottom: "12px" }}>
                  {t("reasonForDeleting")}:
                </p>
                <textarea
                  className="admin-form-textarea"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  placeholder={t("enterReasonForDeletion")}
                  style={{ marginBottom: "12px" }}
                />
                <div className="admin-modal-actions">
                  <button
                    className="admin-button-secondary"
                    onClick={() => {
                      setShowDelete(false);
                      setReason("");
                    }}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    className="admin-button-danger"
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
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">{t("reports")}</h1>
        <div className="admin-page-actions">
          <button
            className="admin-button-secondary"
            onClick={handleRefresh}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span className="material-icons" style={{ fontSize: '16px' }}>refresh</span>
            {t('refresh') || 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-error" style={{ color: '#d32f2f', marginBottom: '16px', padding: '12px', background: '#ffebee', borderRadius: '8px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="admin-loading">{t("loading")}</div>
      ) : !hasFetched ? (
        <div className="admin-loading" style={{ textAlign: "center", padding: "40px" }}>
          No data loaded. Click Refresh to load data.
        </div>
      ) : reports.length === 0 ? (
        <div className="admin-loading">{t("noReports") || "No reports submitted"}</div>
      ) : (
        <div className="admin-cards-grid">
          {reports.map((report) => (
            <div key={report._id} className="admin-card">
              <div className="admin-card-category">
                {getTargetTypeLabel(report.targetType)}
              </div>
              <p
                style={{
                  fontSize: "14px",
                  opacity: 0.7,
                  marginBottom: "12px",
                }}
              >
                @{report.reportedBy.username}
              </p>
              <button
                className="admin-button-secondary"
                onClick={() => handleView(report)}
                style={{ marginTop: "auto", width: "100%" }}
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
