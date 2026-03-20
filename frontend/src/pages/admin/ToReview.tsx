import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminAPI, FlaggedContent } from "../../services/adminAPI";
import Snackbar from "../../components/Snackbar";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation } from "../../utils/translations";
import { useAdminData } from "../../context/AdminDataContext";
import "./AdminPages.css";

const ToReview = () => {
  const navigate = useNavigate();
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);
  const { contentId } = useParams<{ contentId?: string }>();
  const { flaggedContent, flaggedContentState, fetchFlaggedContent } = useAdminData();
  const { loading, error, hasFetched } = flaggedContentState;
  const [selectedContent, setSelectedContent] = useState<FlaggedContent | null>(
    null,
  );
  const [showDisapprove, setShowDisapprove] = useState(false);
  const [disapproveReason, setDisapproveReason] = useState("");
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: "success" | "error";
  }>({ open: false, message: "", type: "success" });

  // Helper to display content type with proper pluralization
  const getTypeLabel = (type: string) => {
    if (type === "comment") {
      return t("comments");
    }
    return t(type);
  };


  // Load selected content when contentId param changes
  useEffect(() => {
    if (contentId) {
      const content = flaggedContent.find((c) => c._id === contentId);
      if (content) {
        handleView(content);
      }
    }
  }, [contentId, flaggedContent]);

  const handleRefresh = async () => {
    try {
      await fetchFlaggedContent();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || t("somethingWentWrong"),
        type: "error",
      });
    }
  };

  const handleBackToList = () => {
    setSelectedContent(null);
    setShowDisapprove(false);
    setDisapproveReason("");
    navigate("/admin/dashboard/review");
  };

  const handleView = (content: FlaggedContent) => {
    setSelectedContent(content);
    setShowDisapprove(false);
    setDisapproveReason("");
    // Update URL with content ID
    navigate(`/admin/dashboard/review/${content._id}`, { replace: true });
  };

  const handleApprove = async (contentId: string, type: "post" | "comment") => {
    try {
      await adminAPI.approveContent(contentId, type);
      setSnackbar({
        open: true,
        message: t("contentApprovedSuccess"),
        type: "success",
      });
      setSelectedContent(null);
      await fetchFlaggedContent();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || t("failedToApproveContent"),
        type: "error",
      });
    }
  };

  const handleDisapprove = async () => {
    if (!selectedContent || !disapproveReason.trim()) {
      setSnackbar({
        open: true,
        message: t("pleaseProvideDisapprovalReason"),
        type: "error",
      });
      return;
    }

    try {
      await adminAPI.disapproveContent(
        selectedContent._id,
        selectedContent.type as "post" | "comment",
        disapproveReason,
      );
      setSnackbar({
        open: true,
        message: t("contentDisapprovedSuccess"),
        type: "success",
      });
      setSelectedContent(null);
      setShowDisapprove(false);
      setDisapproveReason("");
      await fetchFlaggedContent();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message:
          error.response?.data?.message || t("failedToDisapproveContent"),
        type: "error",
      });
    }
  };

  // Get content in English only (no translation of post content)
  const getContent = (content: any) => {
    if (!content) return null;
    return {
      title: content.title,
      body: content.content,
    };
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">{t("loading")}</div>
      </div>
    );
  }

  if (selectedContent) {
    return (
      <>
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
            <h2 style={{ marginTop: 0 }}>{t("contentDetails")}</h2>
            <p>
              <strong>{t("type")}:</strong>{" "}
              {getTypeLabel(selectedContent.type)}
            </p>
            <p>
              <strong>{t("author")}:</strong>{" "}
              {selectedContent.authorId?.username}
            </p>
            {selectedContent.content.category && (
              <p>
                <strong>{t("category")}:</strong>{" "}
                {t(selectedContent.content.category?.toLowerCase()) || selectedContent.content.category}
              </p>
            )}

            {selectedContent.type === "post" && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "16px",
                  background: "rgba(0,0,0,0.05)",
                  borderRadius: "8px",
                }}
              >
                {/* 1. Title */}
                <h3 style={{ marginTop: 0, marginBottom: "16px" }}>
                  {selectedContent.content.title}
                </h3>

                {/* 2. Images */}
                {selectedContent.content.image &&
                  selectedContent.content.image.length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                      {selectedContent.content.image.map((img: string, idx: number) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Post image ${idx + 1}`}
                          style={{
                            maxWidth: "100%",
                            maxHeight: "400px",
                            objectFit: "contain",
                            marginBottom: "8px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                          }}
                        />
                      ))}
                    </div>
                  )}

                {/* 3. Tags */}
                {selectedContent.content.tags &&
                  selectedContent.content.tags.length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                      <strong>{t("tags") || "Tags"}:</strong>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                        {selectedContent.content.tags.map((tag: string, idx: number) => (
                          <span
                            key={idx}
                            style={{
                              background: "var(--theme-accent)",
                              color: "var(--theme-text)",
                              padding: "4px 12px",
                              borderRadius: "16px",
                              fontSize: "14px",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 4. Description (content body) */}
                <div>
                  <strong>{t("description") || "Description"}:</strong>
                  <p style={{ marginTop: "8px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {selectedContent.content.content}
                  </p>
                </div>
              </div>
            )}

            {/* Comments have simpler view */}
            {selectedContent.type === "comment" && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "16px",
                  background: "rgba(0,0,0,0.05)",
                  borderRadius: "8px",
                }}
              >
                <p style={{ whiteSpace: "pre-wrap" }}>
                  {selectedContent.content.text ||
                    selectedContent.content.content}
                </p>
              </div>
            )}
            {!showDisapprove ? (
              <div
                className="admin-modal-actions"
                style={{ marginTop: "24px" }}
              >
                <button
                  className="admin-button-danger"
                  onClick={() => setShowDisapprove(true)}
                >
                  {t("disapprove")}
                </button>
                <button
                  className="admin-button-primary"
                  onClick={() =>
                    handleApprove(
                      selectedContent._id,
                      selectedContent.type as "post" | "comment",
                    )
                  }
                >
                  {t("approve")}
                </button>
              </div>
            ) : (
              <div style={{ marginTop: "24px" }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">
                    {t("reasonForNotAllowing")}
                  </label>
                  <textarea
                    className="admin-form-textarea"
                    value={disapproveReason}
                    onChange={(e) => setDisapproveReason(e.target.value)}
                    required
                    rows={4}
                    placeholder={t("enterReasonForDisapproval")}
                  />
                </div>
                <div className="admin-modal-actions">
                  <button
                    className="admin-button-secondary"
                    onClick={() => {
                      setShowDisapprove(false);
                      setDisapproveReason("");
                    }}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    className="admin-button-danger"
                    onClick={handleDisapprove}
                  >
                    {t("submitDisapproval")}
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
      </div>
      </>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">{t("toReview")}</h1>
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

      {!hasFetched ? (
        <div className="admin-loading" style={{ textAlign: "center", padding: "40px" }}>
          No data loaded. Click Refresh to load data.
        </div>
      ) : flaggedContent.length === 0 ? (
        <div className="admin-loading">{t("noFlaggedContent")}</div>
      ) : (
        <div className="admin-cards-grid">
          {flaggedContent.map((content) => {
            const post = getContent(content.content);
            return (
              <div key={content._id} className="admin-card">
                <div className="admin-card-category">
                  {getTypeLabel(content.type)}
                </div>
                {/* Title */}
                <h3 style={{ margin: "12px 0 4px" }}>{post?.title}</h3>
                {/* Subtitle: Username and Category */}
                <p
                  style={{
                    fontSize: "14px",
                    opacity: 0.7,
                    marginBottom: "12px",
                  }}
                >
                  @{content.authorId?.username}
                  {content.content.category && (
                    <>
                      {" "}• {t(content.content.category.toLowerCase())}
                    </>
                  )}
                </p>
                <button
                  className="admin-button-secondary"
                  onClick={() => handleView(content)}
                  style={{ marginTop: "auto", width: "100%" }}
                >
                  {t("view")}
                </button>
              </div>
            );
          })}
        </div>
      )}
      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </div>
  );
};

export default ToReview;
