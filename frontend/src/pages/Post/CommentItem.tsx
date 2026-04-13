/**
 * @file CommentItem.tsx
 * @description Recursive component for rendering a single comment and its nested replies.
 * Optimized for responsive layouts to prevent horizontal overflow on small screens.
 */

import React, { useState } from 'react'; // Added useState
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
  onEditComment: (commentId: string, newText: string) => Promise<void>; // Add this
  updatingCommentId: string | null; // Add this
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
  onEditComment, // New
  updatingCommentId, // New
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
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  
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

  const handleSaveEdit = async () => {
    if (!editText.trim() || editText === comment.text) {
      setIsEditing(false);
      return;
    }
    await onEditComment(comment._id, editText.trim());
    setIsEditing(false);
  };

  const isNested = depth > 0;

  const getResponsiveMargin = () => {
    if (!isNested) return 0;
    const isMobile = window.innerWidth < 600;
    const marginStep = isMobile ? 12 : 20;
    const maxMargin = isMobile ? 36 : 100;
    return Math.min(depth * marginStep, maxMargin);
  };

  return (
    <div style={{ marginLeft: `${getResponsiveMargin()}px`, width: 'auto' }}>
      <div key={comment._id} id={`comment-${comment._id}`} className="comment-item">
        <div className="comment-body">
          <div onClick={() => navigate(`/users/${comment.userId?._id}`)} className="comment-avatar-container" style={{ width: isNested ? "32px" : "40px", height: isNested ? "32px" : "40px", flexShrink: 0 }}>
            {comment.userId?.profileImage ? (
              <img src={comment.userId.profileImage} alt={comment.userId.username} className="comment-avatar-image" />
            ) : (
              <div className="avatar-placeholder" style={{ fontSize: isNested ? "12px" : "16px" }}>{comment.userId?.username?.charAt(0).toUpperCase()}</div>
            )}
          </div>

          <div className="comment-main" style={{ minWidth: 0 }}>
            <div className="comment-header" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
              <span className="comment-author" style={{ fontSize: isNested ? "12px" : "14px", wordBreak: 'break-all' }} onClick={() => navigate(`/users/${comment.userId?._id}`)}>@{comment.userId?.username}</span>
              <span className="comment-time" style={{ fontSize: isNested ? "11px" : "12px", whiteSpace: 'nowrap' }}>
                {formatCommentTime(comment.createdAt)}
                {comment.updatedAt && new Date(comment.updatedAt).getTime() > new Date(comment.createdAt).getTime() + 1000 && (
                  <span style={{ fontStyle: 'italic', marginLeft: '4px' }}> ({t("edited")})</span>
                )}
              </span>

              <div className="comment-actions">
                <button className="btn-comment-action btn-like" onClick={() => onLike(comment._id)} disabled={!currentUserId || likingComment[comment._id]} style={{ border: currentUserId ? "1px solid" : "none", borderColor: isLiked ? "#e0245e" : "rgba(0,0,0,0.1)", color: isLiked ? "#e0245e" : "var(--theme-text)", background: isLiked ? "rgba(224, 36, 94, 0.1)" : "transparent", cursor: currentUserId && !likingComment[comment._id] ? "pointer" : "not-allowed", fontSize: isNested ? "10px" : "12px", opacity: likingComment[comment._id] ? 0.7 : 1 }} title={isLiked ? t("unlike") : t("like")}>
                  {likingComment[comment._id] ? <RefreshIcon className="spin" sx={{ fontSize: isNested ? 12 : 16 }} /> : (isLiked ? <FavoriteIcon sx={{ fontSize: isNested ? 12 : 16 }} /> : <FavoriteBorderIcon sx={{ fontSize: isNested ? 12 : 16 }} />)}
                  <span>{commentLikesCount}</span>
                </button>

                {currentUserId && <button className="btn-comment-action btn-reply" onClick={() => onStartReply(comment._id)} disabled={replyingToCommentId === comment._id} style={{ background: replyingToCommentId === comment._id ? "rgba(0,0,0,0.05)" : "transparent", cursor: replyingToCommentId === comment._id ? "not-allowed" : "pointer", fontSize: isNested ? "10px" : "12px" }} title={t("reply")}>{replyingToCommentId === comment._id ? <SendIcon sx={{ fontSize: isNested ? 12 : 16 }} /> : <ReplyIcon sx={{ fontSize: isNested ? 12 : 16 }} />}<span className="hide-on-mobile">{t("reply")}</span></button>}

                {comment.replies && comment.replies.length > 0 && <button className="btn-comment-action btn-toggle" onClick={() => toggleRepliesVisibility(comment._id)} style={{ fontSize: isNested ? "10px" : "12px" }} title={isRepliesHidden ? t("showReplies") : t("hideReplies")}>{isRepliesHidden ? <ExpandMoreIcon sx={{ fontSize: isNested ? 12 : 16 }} /> : <ExpandLessIcon sx={{ fontSize: isNested ? 12 : 16 }} />}<span className="hide-on-mobile">{isRepliesHidden ? t("showReplies") : t("hideReplies")}</span></button>}

                {currentUserId && !isCurrentUserOwner && <button className="btn-comment-action btn-report" onClick={() => onReport(comment._id)} style={{ fontSize: isNested ? "10px" : "12px" }} title={t("report")}><WarningIcon sx={{ fontSize: isNested ? 12 : 16 }} /><span className="hide-on-mobile">{t("report")}</span></button>}

                {isCurrentUserOwner && !isEditing && (
                  <button className="btn-comment-action" onClick={() => { setEditText(comment.text); setIsEditing(true); }} style={{ fontSize: isNested ? "10px" : "12px" }} title={t("edit")}>
                    <span className="material-icons" style={{ fontSize: isNested ? 12 : 16 }}>edit</span>
                  </button>
                )}

                {isCurrentUserOwner && <button className="btn-comment-action btn-delete" onClick={() => onDelete(comment._id)} style={{ fontSize: isNested ? "10px" : "12px" }} title={t("delete")}><DeleteIcon sx={{ fontSize: isNested ? 12 : 16 }} /></button>}

                <div className="btn-comment-action" style={{ fontSize: isNested ? "10px" : "12px", padding: '2px 4px' }}><ShareButton url={`${window.location.origin}/posts/${postId}#comment-${comment._id}`} title={`Comment by @${comment.userId?.username}`} description={comment.text} /></div>
              </div>
            </div>

            <div className="comment-content" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {isEditing ? (
                <div className="edit-comment-wrapper mt-2">
                  <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="reply-textarea" rows={3} autoFocus />
                  <div className="reply-buttons-container">
                    <button className="btn-cancel" onClick={() => setIsEditing(false)}>{t("cancel")}</button>
                    <button className="btn-submit-reply" onClick={handleSaveEdit} disabled={updatingCommentId === comment._id}>
                      {updatingCommentId === comment._id ? <RefreshIcon className="spin" sx={{ fontSize: 14 }} /> : t("save")}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="comment-text" style={{ fontSize: isNested ? "13px" : "14px", margin: 0 }}>
                  {translatedCommentId === comment._id ? commentTranslationCache[comment._id] || comment.text : comment.text}
                </p>
              )}

              {!isEditing && (() => {
                const commentLang = detectLanguage(comment.text);
                if (commentLang === language) return null;
                return (
                  <button onClick={(e) => { e.stopPropagation(); onTranslate(comment._id); }} className="post-translate-btn" style={{ alignSelf: 'flex-start', fontSize: isNested ? "10px" : "12px", marginTop: '4px' }} title={translatedCommentId === comment._id ? t("viewOriginal") : t("translate")}>
                    {translatedCommentId === comment._id ? <TranslateIcon sx={{ fontSize: 14 }} /> : <LanguageIcon sx={{ fontSize: 14 }} />}
                    <span>{translatedCommentId === comment._id ? t("viewOriginal") : t("translate")}</span>
                  </button>
                );
              })()}
            </div>

            {replyingToCommentId === comment._id && (
              <form onSubmit={handleSubmitReply} className="mt-3">
                <textarea value={replyTexts[comment._id] || ''} onChange={(e) => onReplyTextChange(comment._id, e.target.value)} placeholder={t("writeReply")} rows={3} className="reply-textarea" autoFocus />
                <div className="reply-buttons-container">
                  <button type="button" className="btn-cancel" onClick={onCancelReply} disabled={submittingReply[comment._id]}>{t("cancel")}</button>
                  <button type="submit" className="btn-submit-reply" disabled={submittingReply[comment._id] || !replyTexts[comment._id]?.trim()}>{submittingReply[comment._id] ? <RefreshIcon className="spin" sx={{ fontSize: 14 }} /> : t("reply")}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && !isRepliesHidden && (
        <div className="replies-container">
          {comment.replies.map((reply: Comment) => (
            <CommentItem key={reply._id} comment={reply} currentUserId={currentUserId} depth={depth + 1} onLike={onLike} onDelete={onDelete} onReport={onReport} onTranslate={onTranslate} onReply={onReply} onEditComment={onEditComment} updatingCommentId={updatingCommentId} translatedCommentId={translatedCommentId} commentTranslationCache={commentTranslationCache} translatingComment={translatingComment} replyingToCommentId={replyingToCommentId} replyTexts={replyTexts} submittingReply={submittingReply} likingComment={likingComment} onStartReply={onStartReply} onCancelReply={onCancelReply} onReplyTextChange={onReplyTextChange} hiddenReplies={hiddenReplies} toggleRepliesVisibility={toggleRepliesVisibility} t={t} language={language} formatCommentTime={formatCommentTime} navigate={navigate} postId={postId} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;