/**
 * @file ReportCommentView.tsx
 * @description Specialized view for previewing a reported comment.
 */

import React from "react";
import RefreshIcon from '@mui/icons-material/Refresh';
import TranslateIcon from '@mui/icons-material/Translate';
import LanguageIcon from '@mui/icons-material/Language';
import { Comment } from "../../../services/api";
import { Language } from "../../../utils/translations";

interface ReportCommentViewProps {
  comment: Comment;
  language: Language;
  t: (key: string) => string;
  commentShowTranslation: boolean;
  commentTranslating: boolean;
  commentTranslationCache: string | null;
  onTranslateComment: (id: string) => void;
  detectLanguage: (text: string) => "en" | "bg";
}

const ReportCommentView: React.FC<ReportCommentViewProps> = ({
  comment,
  language,
  t,
  commentShowTranslation,
  commentTranslating,
  commentTranslationCache,
  onTranslateComment,
  detectLanguage,
}) => {
  const commentLanguage = detectLanguage(comment.text);
  const isCommentInUserLanguage = commentLanguage === language;

  const displayCommentText = commentShowTranslation
    ? commentTranslationCache || (comment.translations as Record<string, string>)?.[language] || comment.text
    : comment.text;

  const formatCommentTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return t("justNow");
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      const unit = minutes === 1 ? t("minute") : t("minutes");
      return language === "bg" ? `${t("ago")} ${minutes} ${unit}` : `${minutes} ${unit} ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      const unit = hours === 1 ? t("hour") : t("hours");
      return language === "bg" ? `${t("ago")} ${hours} ${unit}` : `${hours} ${unit} ago`;
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      const unit = days === 1 ? t("day") : t("days");
      return language === "bg" ? `${t("ago")} ${days} ${unit}` : `${days} ${unit} ago`;
    }
    return date.toLocaleDateString(language === "bg" ? "bg-BG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="mb-24">
      <div className="comment-header">
        <div className="flex items-center gap-12">
          {comment.userId?.profileImage ? (
            <img 
              src={comment.userId.profileImage} 
              alt={comment.userId.username || "user"} 
              className="comment-author-avatar" 
            />
          ) : (
            <div className="comment-author-avatar-fallback">
              {comment.userId?.username?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <div>
            <p className="comment-username">@{comment.userId?.username || t("anonymous")}</p>
            <p className="comment-time">{formatCommentTime(comment.createdAt)}</p>
          </div>
        </div>
        {!isCommentInUserLanguage && (
          <button 
            onClick={() => onTranslateComment(comment._id)} 
            disabled={commentTranslating} 
            className="btn-translate"
          >
            {commentTranslating ? (
              <RefreshIcon className="spin icon-sm" />
            ) : commentShowTranslation ? (
              <TranslateIcon className="icon-sm" />
            ) : (
              <LanguageIcon className="icon-sm" />
            )}
            <span>{commentShowTranslation ? t("viewOriginal") : t("translate")}</span>
          </button>
        )}
      </div>
      <p className="comment-text">{displayCommentText}</p>
    </div>
  );
};

export default ReportCommentView;