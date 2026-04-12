/**
 * @file ToReview.tsx
 * @description Admin content moderation queue for reviewing AI-flagged posts and comments.
 * This page serves as a human-in-the-loop interface where administrators can approve 
 * content to make it public or reject it with a specific reason.
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminAPI, FlaggedContent } from "../../../services/admin-api";
import Snackbar from "../../../components/snackbar/Snackbar";
import { useThemeLanguage } from "../../../context/ThemeLanguageContext";
import { getTranslation } from "../../../utils/translations";
import { useAdminData } from "../../../context/AdminDataContext";
import "../../../styles/shared.css";
import "./ToReview.css";
import Footer from "../../../components/global/Footer";
import GoBackButton from "../../../components/buttons/back/GoBackButton";
import { useSnackbar } from "../../../utils/snackbar";

// MUI Icon Imports
import RefreshIcon from "@mui/icons-material/Refresh";
import FlagIcon from "@mui/icons-material/Flag";

/**
 * @file ToReview.tsx
 * @description Admin content moderation queue - review AI-flagged posts and comments.
 * Displays content flagged by the AI moderation system for human approval or rejection.
 *
 * Features:
 * - List all flagged content (posts and comments) from AdminDataContext.flaggedContent
 * - View flagged content details with translation (EN/BG)
 * - Approve content (removes flagged status, makes it publicly visible)
 * - Reject content with reason (deletes the content)
 * - If URL provided in flag message, navigate directly to flagged item
 * - Live filtering: unread (no admin action yet) vs reviewed (already actioned)
 *
 * Workflow:
 * 1. AI flags post/comment as potentially inappropriate
 * 2. Post enters this queue (flagged: true, ai_moderation flag set)
 * 3. Admin reviews content
 * 4. Admin either:
 * - Approve: Content becomes visible (flagged=false, ai_moderation cleared)
 * - Reject: Content is deleted with reason
 *
 * Data Source:
 * - Uses AdminDataContext.flaggedContent (fetched by fetchFlaggedContent() or initialize())
 *
 * Access Control:
 * - Route protected by AdminRoute (admin only)
 *
 * Integration:
 * - Backend marks posts as flagged via AI service; flaggedContent endpoint returns those items
 * - Approve action clears flagged status and ai_moderation flag, making post visible
 *
 * @page
 * @requires useState - Flagged content list, selected content, filter state, loading, snackbar
 * @requires useEffect - Fetch flagged content on mount via AdminDataContext
 * @requires useNavigate - Navigate to flagged content's URL if available
 * @requires useThemeLanguage - Current language for content and translations
 * @requires useAdminData - Access to flaggedContent array and fetchFlaggedContent()
 * @requires postsAPI - Approve or reject flagged posts (admin endpoints)
 * @requires Snackbar - Feedback on approve/reject actions
 * @requires Footer - Footer component
 */

const ToReview = () => {
  const navigate = useNavigate();
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);
  const { contentId } = useParams<{ contentId?: string }>();
  const { flaggedContent, flaggedContentState, fetchFlaggedContent } =
    useAdminData();
  const { loading, error, hasFetched } = flaggedContentState;
  const [selectedContent, setSelectedContent] = useState<FlaggedContent | null>(
    null,
  );
  const [showDisapprove, setShowDisapprove] = useState(false);
  const [disapproveReason, setDisapproveReason] = useState("");
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

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
      showError(err.response?.data?.message || t("somethingWentWrong"));
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
      showSuccess(t("contentApprovedSuccess"));
      setSelectedContent(null);
      await fetchFlaggedContent();
    } catch (error: any) {
      showError(t("failedToApproveContent"));
    }
  };

  const handleDisapprove = async () => {
    if (!selectedContent || !disapproveReason.trim()) {
      showError(t("pleaseProvideDisapprovalReason"));
      return;
    }

    try {
      await adminAPI.disapproveContent(
        selectedContent._id,
        selectedContent.type as "post" | "comment",
        disapproveReason,
      );
      showSuccess(t("contentDisapprovedSuccess"));
      setSelectedContent(null);
      setShowDisapprove(false);
      setDisapproveReason("");
      await fetchFlaggedContent();
    } catch (error: any) {
      showError(t("failedToDisapproveContent"));
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
      <div>
        <div className="loading">{t("loading")}</div>
      </div>
    );
  }

  if (selectedContent) {
    return (
      <>
        <div>
          <div className="content-view">
            <div className="mb-6">
              <GoBackButton onClick={handleBackToList} />
            </div>
            <div className="content-card">
              <h2 className="m-0">{t("contentDetails")}</h2>
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
                  {t(selectedContent.content.category?.toLowerCase()) ||
                    selectedContent.content.category}
                </p>
              )}

              {selectedContent.type === "post" && (
                <div className="mt-5">
                  {/* 1. Title */}
                  <h3 className="mt-0 mb-4">{selectedContent.content.title}</h3>

                  {/* 2. Images */}
                  {selectedContent.content.image &&
                    selectedContent.content.image.length > 0 && (
                      <div className="mb-5">
                        {selectedContent.content.image.map(
                          (img: string, idx: number) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Post image ${idx + 1}`}
                              className="post-preview-image"
                            />
                          ),
                        )}
                      </div>
                    )}

                  {/* 3. Tags */}
                  {selectedContent.content.tags &&
                    selectedContent.content.tags.length > 0 && (
                      <div className="tags-container">
                        <strong>{t("tags")}:</strong>
                        <div className="tags-list">
                          {selectedContent.content.tags.map(
                            (tag: string, idx: number) => (
                              <span key={idx} className="tag-pill-filled">
                                {tag}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {/* 4. Description (content body) */}
                  <div>
                    <strong>{t("description")}:</strong>
                    <p className="post-description">
                      {selectedContent.content.content}
                    </p>
                  </div>
                </div>
              )}

              {/* Comments have simpler view */}
              {selectedContent.type === "comment" && (
                <div className="mt-5">
                  <p className="whitespace-pre-wrap">
                    {selectedContent.content.text ||
                      selectedContent.content.content}
                  </p>
                </div>
              )}
              {!showDisapprove ? (
                <div className="modal-actions mt-6">
                  <button
                    className="btn-danger"
                    onClick={() => setShowDisapprove(true)}
                  >
                    {t("disapprove")}
                  </button>
                  <button
                    className="btn-primary"
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
                <div className="mt-6">
                  <div className="form-group">
                    <label className="form-label">
                      {t("reasonForNotAllowing")}
                    </label>
                    <textarea
                      className="form-textarea mb-3"
                      value={disapproveReason}
                      onChange={(e) => setDisapproveReason(e.target.value)}
                      required
                      rows={4}
                      placeholder={t("enterReasonForDisapproval")}
                    />
                  </div>
                  <div className="modal-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setShowDisapprove(false);
                        setDisapproveReason("");
                      }}
                    >
                      {t("cancel")}
                    </button>
                    <button className="btn-danger" onClick={handleDisapprove}>
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
            onClose={closeSnackbar}
          />
          <Footer />
        </div>
      </>
    );
  }

  // Local EmptyState component for no data
  const EmptyState = ({
    icon,
    title,
    message,
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

  return (
    <div>
      <div className="page-container-header">
        <h1 className="page-container-title">{t("toReview")}</h1>
        <div className="page-container-actions">
          <button
            className="btn-secondary icon-btn"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshIcon sx={{ fontSize: "1rem" }} />
            {t("refresh")}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-box-colored">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!hasFetched ? (
        <div className="loading">
          No data loaded. Click Refresh to load data.
        </div>
      ) : flaggedContent.length === 0 ? (
        <EmptyState
          icon={<FlagIcon />}
          title={t("noFlaggedContent")}
        />
      ) : (
        <div className="cards-grid">
          {flaggedContent.map((content) => {
            const post = getContent(content.content);
            return (
              <div key={content._id} className="card">
                <div className="card-title">{getTypeLabel(content.type)}</div>
                {/* Title */}
                <h3 className="section-title-spacing">{post?.title}</h3>
                {/* Subtitle: Username and Category */}
                <p className="text-sm opacity-70 mb-3">
                  @{content.authorId?.username}
                  {content.content.category && (
                    <> • {t(content.content.category.toLowerCase())}</>
                  )}
                </p>
                <button
                  className="btn-secondary mt-auto w-100"
                  onClick={() => handleView(content)}
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
        onClose={closeSnackbar}
      />
      <Footer />
    </div>
  );
};

export default ToReview;