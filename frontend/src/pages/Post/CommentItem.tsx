/**
 * @file CommentItem.tsx
 * @description Recursive component for rendering a single comment and its nested replies.
 * Handles like, reply, delete, report, and translation actions.
 *
 * @component
 */

import React from 'react';
import { Comment } from '../../services/api';
import { detectLanguage } from '../../utils/language';
import ShareButton from '../../components/ShareButton';

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

  return (
    <div style={{ marginLeft: isNested ? '20px' : 0 }}>
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

          <div className="comment-main">
            {/* Comment Header */}
            <div className="comment-header">
              <span
                className="comment-author"
                style={{
                  fontSize: isNested ? "12px" : "14px",
                }}
                onClick={() => navigate(`/users/${comment.userId?._id}`)}
              >
                @{comment.userId?.username}
              </span>
              <span
                className="comment-time"
                style={{
                  fontSize: isNested ? "11px" : "12px",
                }}
              >
                {formatCommentTime(comment.createdAt)}
              </span>

              {/* Action Buttons */}
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
                    <span className="material-icons spin" style={{ fontSize: isNested ? "12px" : "16px" }}>refresh</span>
                  ) : (
                    <span className="material-icons" style={{ fontSize: isNested ? "12px" : "16px" }}>
                      {isLiked ? "favorite" : "favorite_border"}
                    </span>
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
                    <span className="material-icons" style={{ fontSize: isNested ? "12px" : "16px" }}>
                      {replyingToCommentId === comment._id ? "send" : "reply"}
                    </span>
                    <span>{replyingToCommentId === comment._id ? t("reply") : t("reply")}</span>
                  </button>
                )}

                {/* Toggle Replies Button - only if there are replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <button
                    className="btn-comment-action btn-toggle"
                    onClick={() => toggleRepliesVisibility(comment._id)}
                    style={{
                      fontSize: isNested ? "10px" : "12px",
                    }}
                    title={isRepliesHidden ? t("showReplies") : t("hideReplies")}
                  >
                    <span className="material-icons" style={{ fontSize: isNested ? "12px" : "16px" }}>
                      {isRepliesHidden ? "expand_more" : "expand_less"}
                    </span>
                    <span>
                      {isRepliesHidden
                        ? t("showReplies")
                        : t("hideReplies")}
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
                    <span className="material-icons" style={{ fontSize: isNested ? "12px" : "16px" }}>warning</span>
                    <span>{t("report")}</span>
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
                    <span className="material-icons" style={{ fontSize: isNested ? "12px" : "16px" }}>delete</span>
                  </button>
                )}

                {/* Share Button */}
                <div className="btn-comment-action" style={{ fontSize: isNested ? "10px" : "12px" }}>
                  <ShareButton
                    url={`${window.location.origin}/posts/${postId}#comment-${comment._id}`}
                    title={`Comment by @${comment.userId?.username}`}
                    description={comment.text}
                  />
                </div>
              </div>
            </div>

            {/* Comment Text */}
            <div className="comment-content">
              <p className="comment-text" style={{ fontSize: isNested ? "13px" : "14px" }}>
                {translatedCommentId === comment._id
                  ? commentTranslationCache[comment._id] || comment.text
                  : comment.text}
              </p>

              {/* Translate Button */}
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
                    disabled={false}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "6px 10px",
                      border: "2px solid var(--theme-accent)",
                      background: "var(--theme-accent)",
                      color: "var(--theme-text)",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: isNested ? "10px" : "12px",
                      fontWeight: 500,
                      flexShrink: 0,
                    }}
                    title={translatedCommentId === comment._id ? t("viewOriginal") : t("translate")}
                  >
                    <span className="material-icons text-xs">
                      {translatedCommentId === comment._id ? "translate" : "language"}
                    </span>
                    <span className="text-10">
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
                    style={{
                      cursor: submittingReply[comment._id] ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    className="btn-submit-reply"
                    disabled={submittingReply[comment._id] || !replyTexts[comment._id]?.trim()}
                    style={{
                      cursor: submittingReply[comment._id] || !replyTexts[comment._id]?.trim() ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {submittingReply[comment._id] ? (
                      <span className="material-icons spin" style={{ fontSize: '14px' }}>refresh</span>
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

      {/* Render Replies */}
      {comment.replies && comment.replies.length > 0 && !isRepliesHidden && (
        <div className="mt-3">
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
