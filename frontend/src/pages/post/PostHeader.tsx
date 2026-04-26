/**
 * @file PostHeader.tsx
 * @description Header component for the individual post page.
 */

import React from "react";
import GoBackButton from "../../components/buttons/back/GoBackButton";
import ShareButton from "../../components/buttons/share/ShareButton";

/**
 * @component
 * @description Renders navigation, title, translation controls, and sharing actions for a post.
 * @requires GoBackButton - Returns the user to the previous route.
 * @requires ShareButton - Shares the current post URL.
 * @param {PostHeaderProps} props - Component props.
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
