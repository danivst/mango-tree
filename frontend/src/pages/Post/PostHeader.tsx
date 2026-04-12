/**
 * @file PostHeader.tsx
 * @description Header component for the individual post page. 
 * Manages high-level navigation, titles, content translation triggers, and sharing.
 * * Features:
 * - Integrated GoBackButton for easy navigation
 * - Responsive post title display with support for translated text
 * - Real-time translation toggle ("Translate" vs "View Original")
 * - Native share API integration via ShareButton
 * - Visual "Waiting for Approval" status for pending moderation content
 * * Architecture:
 * - Simple UI wrapper that decouples header actions from the main Post logic
 * - Controlled via props from Post.tsx for translation state and loading feedback
 * - Uses Flexbox/Grid via Post.css for layout alignment of title and actions
 */

import React from "react";
import GoBackButton from "../../components/buttons/back/GoBackButton";
import ShareButton from "../../components/buttons/share/ShareButton";

/**
 * @component
 * @requires GoBackButton - UI component for returning to the previous route
 * @requires ShareButton - Logic for sharing post URLs
 * @param {PostHeaderProps} props - Component props
 */
interface PostHeaderProps {
  post: any;
  displayTitle: string;
  showTranslation: boolean;
  translating: boolean;
  isPostInUserLanguage: boolean;
  isWaitingForApproval: boolean;
  actionLoadingReport: boolean;
  handleTranslate: () => void;
  t: (key: string) => string;
}

const PostHeader: React.FC<PostHeaderProps> = ({
  post,
  displayTitle,
  showTranslation,
  translating,
  isPostInUserLanguage,
  isWaitingForApproval,
  actionLoadingReport,
  handleTranslate,
  t,
}) => {
  return (
    <div style={{ marginBottom: "24px" }}>
      <GoBackButton />
      <div className="post-header">
        <h1 className="page-title page-title-no-margin">{displayTitle}</h1>
        <div className="post-header-actions">
          {!isPostInUserLanguage && (
            <button
              onClick={handleTranslate}
              disabled={translating || actionLoadingReport}
              className="post-translate-btn"
              style={{
                cursor: translating || actionLoadingReport ? "not-allowed" : "pointer",
                opacity: translating || actionLoadingReport ? 0.7 : 1,
              }}
              title={showTranslation ? t("viewOriginal") : t("translate")}
            >
              {translating ? (
                <span className="material-icons spin text-sm">refresh</span>
              ) : (
                <span className="material-icons text-sm">
                  {showTranslation ? "translate" : "language"}
                </span>
              )}
              <span>{showTranslation ? t("viewOriginal") : t("translate")}</span>
            </button>
          )}
          <ShareButton
            url={`${window.location.origin}/posts/${post._id}`}
            title={post.title}
            description={post.content}
          />
        </div>
        {isWaitingForApproval && (
          <div className="approval-badge">{t("waitingForApproval")}</div>
        )}
      </div>
    </div>
  );
};

export default PostHeader;