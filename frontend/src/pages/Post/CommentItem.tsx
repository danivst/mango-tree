/**
 * @file CommentItem.tsx
 * @description Recursive component for rendering a single comment and its nested replies.
 * Optimized for responsive layouts to prevent horizontal overflow on small screens.
 */

import React from 'react';
import { Comment } from '../../services/api';
import { detectLanguage } from '../../utils/language';
import ShareButton from '../../components/buttons/share/ShareButton';

// MUI Icon Imports
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import SendIcon from '@mui/icons-material/Send';
import ReplyIcon from '@mui/icons-material/Reply';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import WarningIcon from '@mui/icons-material/Warning';
import DeleteIcon from '@mui/icons-material/Delete';
import TranslateIcon from '@mui/icons-material/Translate';
import LanguageIcon from '@mui/icons-material/Language';
import RefreshIcon from '@mui/icons-material/Refresh';

interface CommentItemProps {
  comment: Comment;
  currentUserId: string | null;
  depth?: number;
  onLike: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onReport: (commentId: string) => void;
  onTranslate: (commentId: string) => void;
  onReply: (parentCommentId: string, text: string) => Promise<void>;
  translatedCommentId: string | null;
  commentTranslationCache: Record<string, string>;
  translatingComment: string | null;
  replyingToCommentId: string | null;
  replyTexts: Record<string, string>;
  submittingReply: Record<string, boolean>;
  likingComment: Record<string, boolean>;
  onStartReply: (commentId: string) => void;
  onCancelReply: () => void;
  onReplyTextChange: (commentId: string, text: string) => void;
  hiddenReplies: Record<string, boolean>;
  toggleRepliesVisibility: (commentId: string) => void;
  t: (key: string) => string;
  language: string;
  formatCommentTime: (date: Date | string) => string;
  navigate: any;
  postId: string;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  depth = 0,
  onLike,
  onDelete,
  onReport,
  onTranslate,
  onReply,
  translatedCommentId,
  commentTranslationCache,
  translatingComment,
  replyingToCommentId,
  replyTexts,
  submittingReply,
  likingComment,
  onStartReply,
  onCancelReply,
  onReplyTextChange,
  hiddenReplies,
  toggleRepliesVisibility,
  t,
  language,
  formatCommentTime,
  navigate,
  postId,
}) => {
  const commentLikesCount = comment.likes?.length || 0;
  const isLiked = currentUserId && comment.likes?.includes(currentUserId);
  const isCurrentUserOwner = currentUserId && comment.userId?._id === currentUserId;
  const isRepliesHidden = !!hiddenReplies[comment._id];

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const replyText = replyTexts[comment._id]?.trim();
    if (!replyText) return;
    await onReply(comment._id, replyText);
  };

  const isNested = depth > 0;

  /**
   * Responsive Indentation: 
   * On small screens, we cap the margin to ensure the text doesn't 
   * get squeezed into a tiny vertical column.
   */
  const getResponsiveMargin = () => {
    if (!isNested) return 0;
    const isMobile = window.innerWidth < 600;
    const marginStep = isMobile ? 12 : 20;
    const maxMargin = isMobile ? 36 : 100; // Cap indentation on mobile
    return Math.min(depth * marginStep, maxMargin);
  };

  return (
    <div style={{ marginLeft: `${getResponsiveMargin()}px`, width: 'auto' }}>
      <div
        key={comment._id}
        id={`comment-${comment._id}`}
        className="comment-item"
      >
        <div className="comment-body">
          {/* Comment Author Avatar */}
          <div
            onClick={() => navigate(`/users/${comment.userId?._id}`)}
            className="comment-avatar-container"
            style={{
              width: isNested ? "32px" : "40px",
              height: isNested ? "32px" : "40px",
              flexShrink: 0
            }}
          >
            {comment.userId?.profileImage ? (
              <img
                src={comment.userId.profileImage}
                alt={comment.userId.username}
                className="comment-avatar-image"
              />
            ) : (
              <div
                className="avatar-placeholder"
                style={{
                  fontSize: isNested ? "12px" : "16px",
                }}
              >
                {comment.userId?.username?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="comment-main" style={{ minWidth: 0 }}>
            {/* Comment Header - Flex wrap is critical here */}
            <div className="comment-header" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
              <span
                className="comment-author"
                style={{
                  fontSize: isNested ? "12px" : "14px",
                  wordBreak: 'break-all'
                }}
                onClick={() => navigate(`/users/${comment.userId?._id}`)}
              >
                @{comment.userId?.username}
              </span>
              <span
                className="comment-time"
                style={{
                  fontSize: isNested ? "11px" : "12px",
                  whiteSpace: 'nowrap'
                }}
              >
                {formatCommentTime(comment.createdAt)}
              </span>

              {/* Action Buttons Container */}
              <div className="comment-actions">
                {/* Like Button */}
                <button
                  className="btn-comment-action btn-like"
                  onClick={() => onLike(comment._id)}
                  disabled={!currentUserId || likingComment[comment._id]}
                  style={{
                    border: currentUserId ? "1px solid" : "none",
                    borderColor: isLiked ? "#e0245e" : "rgba(0,0,0,0.1)",
                    color: isLiked ? "#e0245e" : "var(--theme-text)",
                    background: isLiked ? "rgba(224, 36, 94, 0.1)" : "transparent",
                    cursor: currentUserId && !likingComment[comment._id] ? "pointer" : "not-allowed",
                    fontSize: isNested ? "10px" : "12px",
                    opacity: likingComment[comment._id] ? 0.7 : 1,
                  }}
                  title={isLiked ? t("unlike") : t("like")}
                >
                  {likingComment[comment._id] ? (
                    <RefreshIcon className="spin" sx={{ fontSize: isNested ? 12 : 16 }} />
                  ) : (
                    isLiked ? (
                      <FavoriteIcon sx={{ fontSize: isNested ? 12 : 16 }} />
                    ) : (
                      <FavoriteBorderIcon sx={{ fontSize: isNested ? 12 : 16 }} />
                    )
                  )}
                  <span>{commentLikesCount}</span>
                </button>

                {/* Reply Button */}
                {currentUserId && (
                  <button
                    className="btn-comment-action btn-reply"
                    onClick={() => onStartReply(comment._id)}
                    disabled={replyingToCommentId === comment._id}
                    style={{
                      background: replyingToCommentId === comment._id ? "rgba(0,0,0,0.05)" : "transparent",
                      cursor: replyingToCommentId === comment._id ? "not-allowed" : "pointer",
                      fontSize: isNested ? "10px" : "12px",
                    }}
                    title={t("reply")}
                  >
                    {replyingToCommentId === comment._id ? (
                      <SendIcon sx={{ fontSize: isNested ? 12 : 16 }} />
                    ) : (
                      <ReplyIcon sx={{ fontSize: isNested ? 12 : 16 }} />
                    )}
                    <span className="hide-on-mobile">{t("reply")}</span>
                  </button>
                )}

                {/* Toggle Replies Button */}
                {comment.replies && comment.replies.length > 0 && (
                  <button
                    className="btn-comment-action btn-toggle"
                    onClick={() => toggleRepliesVisibility(comment._id)}
                    style={{
                      fontSize: isNested ? "10px" : "12px",
                    }}
                    title={isRepliesHidden ? t("showReplies") : t("hideReplies")}
                  >
                    {isRepliesHidden ? (
                      <ExpandMoreIcon sx={{ fontSize: isNested ? 12 : 16 }} />
                    ) : (
                      <ExpandLessIcon sx={{ fontSize: isNested ? 12 : 16 }} />
                    )}
                    <span className="hide-on-mobile">
                      {isRepliesHidden ? t("showReplies") : t("hideReplies")}
                    </span>
                  </button>
                )}

                {/* Report Button */}
                {currentUserId && !isCurrentUserOwner && (
                  <button
                    className="btn-comment-action btn-report"
                    onClick={() => onReport(comment._id)}
                    style={{
                      fontSize: isNested ? "10px" : "12px",
                    }}
                    title={t("report")}
                  >
                    <WarningIcon sx={{ fontSize: isNested ? 12 : 16 }} />
                    <span className="hide-on-mobile">{t("report")}</span>
                  </button>
                )}

                {/* Delete Button */}
                {isCurrentUserOwner && (
                  <button
                    className="btn-comment-action btn-delete"
                    onClick={() => onDelete(comment._id)}
                    style={{
                      fontSize: isNested ? "10px" : "12px",
                    }}
                    title={t("delete")}
                  >
                    <DeleteIcon sx={{ fontSize: isNested ? 12 : 16 }} />
                  </button>
                )}

                {/* Share Button */}
                <div className="btn-comment-action" style={{ fontSize: isNested ? "10px" : "12px", padding: '2px 4px' }}>
                  <ShareButton
                    url={`${window.location.origin}/posts/${postId}#comment-${comment._id}`}
                    title={`Comment by @${comment.userId?.username}`}
                    description={comment.text}
                  />
                </div>
              </div>
            </div>

            {/* Comment Text and Translation */}
            <div className="comment-content" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p className="comment-text" style={{ fontSize: isNested ? "13px" : "14px", margin: 0 }}>
                {translatedCommentId === comment._id
                  ? commentTranslationCache[comment._id] || comment.text
                  : comment.text}
              </p>

              {/* Translate Button - Moved below text on mobile if needed */}
              {(() => {
                const commentLang = detectLanguage(comment.text);
                const isCommentInUserLanguage = commentLang === language;
                if (isCommentInUserLanguage) return null;
                return (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTranslate(comment._id);
                    }}
                    className="post-translate-btn"
                    style={{
                      alignSelf: 'flex-start',
                      fontSize: isNested ? "10px" : "12px",
                      marginTop: '4px'
                    }}
                    title={translatedCommentId === comment._id ? t("viewOriginal") : t("translate")}
                  >
                    {translatedCommentId === comment._id ? (
                      <TranslateIcon sx={{ fontSize: 14 }} />
                    ) : (
                      <LanguageIcon sx={{ fontSize: 14 }} />
                    )}
                    <span>
                      {translatedCommentId === comment._id ? t("viewOriginal") : t("translate")}
                    </span>
                  </button>
                );
              })()}
            </div>

            {/* Reply Form */}
            {replyingToCommentId === comment._id && (
              <form onSubmit={handleSubmitReply} className="mt-3">
                <textarea
                  value={replyTexts[comment._id] || ''}
                  onChange={(e) => onReplyTextChange(comment._id, e.target.value)}
                  placeholder={t("writeReply")}
                  rows={3}
                  className="reply-textarea"
                  autoFocus
                />
                <div className="reply-buttons-container">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={onCancelReply}
                    disabled={submittingReply[comment._id]}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    className="btn-submit-reply"
                    disabled={submittingReply[comment._id] || !replyTexts[comment._id]?.trim()}
                  >
                    {submittingReply[comment._id] ? (
                      <RefreshIcon className="spin" sx={{ fontSize: 14 }} />
                    ) : (
                      t("reply")
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Render Replies Recursive */}
      {comment.replies && comment.replies.length > 0 && !isRepliesHidden && (
        <div className="replies-container">
          {comment.replies.map((reply: Comment) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              currentUserId={currentUserId}
              depth={depth + 1}
              onLike={onLike}
              onDelete={onDelete}
              onReport={onReport}
              onTranslate={onTranslate}
              onReply={onReply}
              translatedCommentId={translatedCommentId}
              commentTranslationCache={commentTranslationCache}
              translatingComment={translatingComment}
              replyingToCommentId={replyingToCommentId}
              replyTexts={replyTexts}
              submittingReply={submittingReply}
              likingComment={likingComment}
              onStartReply={onStartReply}
              onCancelReply={onCancelReply}
              onReplyTextChange={onReplyTextChange}
              hiddenReplies={hiddenReplies}
              toggleRepliesVisibility={toggleRepliesVisibility}
              t={t}
              language={language}
              formatCommentTime={formatCommentTime}
              navigate={navigate}
              postId={postId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;