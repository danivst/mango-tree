import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import UserSidebar from "../components/UserSidebar";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { getTranslation } from "../utils/translations";
import api, { postsAPI, usersAPI, Post as PostType, Comment } from "../services/api";
import "../styles/shared.css";
import "./Post.css";
import Snackbar from "../components/Snackbar";
import GoBackButton from "../components/GoBackButton";
import { getToken } from "../utils/auth";
import ReactMarkdown from "react-markdown";

/**
 * @file Post.tsx
 * @description Single post detail page with full content view and threaded comments.
 * Displays a post with title, content (markdown), images, tags, author info, and interactive comments.
 *
 * Features:
 * - Full post display with markdown rendering
 * - Image gallery with preview
 * - Like/unlike post with instant UI feedback
 * - Comment section with nested replies (unlimited depth)
 * - Comment actions: like, reply, delete (own), report
 * - Real-time translation for post and comments (EN/BG)
 * - Translation caching to avoid repeated API calls
 * - Comment collapse/expand for nested threads
 * - Pagination for comments (load more)
 * - AI moderation status display (flagged, rejected)
 * - Responsive design with GoBackButton
 *
 * Architecture:
 * - CommentItem: Recursive component for nested comment rendering
 * - State management: translation caching, reply toggles, comment pagination, loading states
 * - Markdown rendering using react-markdown (sanitization handled by library)
 * - Language detection via Cyrillic character check
 *
 * Translation System:
 * - Post-level: Uses post.translations if available, otherwise fetches from API
 * - Comment-level: Similar caching + fetch pattern
 * - Button shows "Translate" or "View Original" based on current state
 *
 * Comment Threading:
 * - Comments stored flat with parentId field
 * - Recursive CommentItem builds tree structure in render
 * - Nested replies indented with margin-left
 * - Toggle to show/hide deep reply threads
 * - Replies count shown on parent comment
 *
 * @page
 * @requires useState - Post data, comments, UI states (translation, replies, etc.)
 * @requires useEffect - Fetch post and initial comments on mount
 * @requires useParams - Get post ID from route /posts/:id
 * @requires useNavigate - Navigate to author profile, back navigation
 * @requires useThemeLanguage - Current UI language for translations and content display
 * @requires postsAPI - Fetch post, like/unlike, comments, translation, delete comment
 * @requires usersAPI - Fetch user profile for author link
 * @requires api - General API for report actions
 * @requires Snackbar - Feedback (delete, report, error)
 * @requires GoBackButton - Navigate back to previous page
 * @requires UserSidebar - Navigation sidebar
 */

// Simple language detection based on Cyrillic characters
const detectLanguage = (text: string): 'en' | 'bg' => {
  if (!text) return 'en';
  // Check for Cyrillic characters (Bulgarian)
  if (/[а-яА-Я]/.test(text)) {
    return 'bg';
  }
  return 'en';
};

// Recursive Comment Item Component
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Post = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);

  const currentUserId = useMemo(() => {
    const token = getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || null;
    } catch {
      return null;
    }
  }, []);

  const [post, setPost] = useState<PostType | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: "success" | "error";
  }>({ open: false, message: "", type: "success" });
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [likingComment, setLikingComment] = useState<Record<string, boolean>>({});
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationCache, setTranslationCache] = useState<{ title: string; content: string; tags?: string[] } | null>(null);
  const [translating, setTranslating] = useState(false);

  // Comment translation state
  const [translatedCommentId, setTranslatedCommentId] = useState<string | null>(null);
  const [commentTranslationCache, setCommentTranslationCache] = useState<Record<string, string>>({});
  const [translatingComment, setTranslatingComment] = useState<string | null>(null);

  // Reply state
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<Record<string, boolean>>({});

  // Compute total comment count including nested replies
  const totalCommentCount = useMemo(() => {
    const countAll = (cmts: Comment[]): number => {
      return cmts.reduce((acc, cmt) => {
        const replyCount = cmt.replies ? countAll(cmt.replies) : 0;
        return acc + 1 + replyCount;
      }, 0);
    };
    return countAll(comments);
  }, [comments]);

  const [actionLoading, setActionLoading] = useState<{
    like: boolean;
    follow: boolean;
    report: boolean;
    delete: boolean;
  }>({ like: false, follow: false, report: false, delete: false });
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);

  // Track which comments have hidden replies
  const [hiddenReplies, setHiddenReplies] = useState<Record<string, boolean>>({});

  const toggleRepliesVisibility = (commentId: string) => {
    setHiddenReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  useEffect(() => {
    if (id) {
      fetchPost();
      fetchComments();
    }
  }, [id]);

  const fetchPost = async () => {
    if (!id) return;
    try {
      const data = await postsAPI.getPost(id);
      setPost(data);
      setLikesCount(data.likes?.length || 0);

      // Check if current user has liked the post
      if (currentUserId) {
        setIsLiked(data.likes?.includes(currentUserId) || false);

        // Check if current user follows the author by fetching current user's profile
        try {
          const currentUser = await usersAPI.getCurrentUser();
          const authorId = data.authorId?._id;
          setIsFollowing(currentUser.following.includes(authorId!));
        } catch (err) {
          // Silently fail - follow status will remain false
          console.error("Failed to check follow status:", err);
        }
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t("somethingWentWrong"),
        type: "error",
      });
      setTimeout(() => navigate("/home"), 1500);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!id) return;
    try {
      const data = await postsAPI.getComments(id);
      setComments(data);
    } catch (error: any) {
      console.error("Failed to fetch comments:", error);
    }
  };

  const getCategoryDisplayName = (categoryName: string) => {
    const translated = t(categoryName.toLowerCase());
    if (translated && translated !== categoryName.toLowerCase()) {
      return translated;
    }
    return categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
  };

  const getCategoryStyle = (categoryName: string) => {
    const styles: Record<string, { borderColor: string; backgroundColor: string; color: string }> = {
      flex: {
        borderColor: "#2196F3",
        backgroundColor: "rgba(33, 150, 243, 0.15)", // Light blue
        color: "#1976D2" // Darker blue for text
      },
      recipe: {
        borderColor: "#4CAF50",
        backgroundColor: "rgba(76, 175, 80, 0.15)", // Light green
        color: "#388E3C" // Darker green for text
      },
      question: {
        borderColor: "#9C27B0",
        backgroundColor: "rgba(156, 39, 176, 0.15)", // Light purple
        color: "#7B1FA2" // Darker purple for text
      },
    };
    return styles[categoryName.toLowerCase()] || null;
  };

  const handleNextImage = () => {
    if (post?.image && post.image.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % post.image.length);
    }
  };

  const handlePrevImage = () => {
    if (post?.image && post.image.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + post.image.length) % post.image.length);
    }
  };

  const formatCommentTime = (date: Date | string) => {
    const dateObj = new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return t("justNow");
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      const unit = minutes === 1 ? t("minute") : t("minutes");
      return language === "bg" ? `${t("ago")} ${minutes} ${unit}` : `${minutes} ${unit} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      const unit = hours === 1 ? t("hour") : t("hours");
      return language === "bg" ? `${t("ago")} ${hours} ${unit}` : `${hours} ${unit} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      const unit = days === 1 ? t("day") : t("days");
      return language === "bg" ? `${t("ago")} ${days} ${unit}` : `${days} ${unit} ago`;
    } else {
      return dateObj.toLocaleDateString(language === "bg" ? "bg-BG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  const handleLike = async () => {
    if (!currentUserId) {
      setSnackbar({
        open: true,
        message: t("mustBeLoggedIn"),
        type: "error",
      });
      return;
    }

    setActionLoading(prev => ({ ...prev, like: true }));
    try {
      if (isLiked) {
        await postsAPI.unlikePost(id!);
        setLikesCount(prev => prev - 1);
      } else {
        await postsAPI.likePost(id!);
        setLikesCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t("actionFailed"),
        type: "error",
      });
    } finally {
      setActionLoading(prev => ({ ...prev, like: false }));
    }
  };

  const handleTranslate = async () => {
    if (!post) return;

    if (showTranslation) {
      // Toggle back to original
      setShowTranslation(false);
      return;
    }

    // If we already have cached translation, just show it
    if (translationCache) {
      setShowTranslation(true);
      return;
    }

    // If stored translation exists for UI language (including tags), use it directly without fetching
    if (
      post.translations?.title?.[language] &&
      post.translations?.content?.[language] &&
      post.translations?.tags?.[language] &&
      post.translations.tags[language].length > 0
    ) {
      setTranslationCache({
        title: post.translations.title[language],
        content: post.translations.content[language],
        tags: post.translations.tags[language],
      });
      setShowTranslation(true);
      return;
    }

    // Need to fetch translation
    setTranslating(true);
    try {
      const targetLang = language; // translate to UI language
      const response = await postsAPI.translatePost(post._id, targetLang);
      setTranslationCache({
        title: response.title,
        content: response.content,
        tags: response.tags,
      });
      setShowTranslation(true);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t("failedToTranslateContent"),
        type: "error",
      });
    } finally {
      setTranslating(false);
    }
  };

  const handleTranslateComment = async (commentId: string) => {
    if (!post) return;

    if (translatedCommentId === commentId) {
      // Toggle back to original
      setTranslatedCommentId(null);
      return;
    }

    // If we already have cached translation, just show it
    if (commentTranslationCache[commentId]) {
      setTranslatedCommentId(commentId);
      return;
    }

    // Fetch translation
    setTranslatingComment(commentId);
    try {
      const response = await postsAPI.translateComment(commentId, language);
      setCommentTranslationCache(prev => ({ ...prev, [commentId]: response.text }));
      setTranslatedCommentId(commentId);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t("failedToTranslateComment"),
        type: "error",
      });
    } finally {
      setTranslatingComment(null);
    }
  };

  const handleFollow = async () => {
    if (!currentUserId) {
      setSnackbar({
        open: true,
        message: t("mustBeLoggedIn"),
        type: "error",
      });
      return;
    }

    const authorId = post?.authorId?._id;
    if (!authorId) return;

    setActionLoading(prev => ({ ...prev, follow: true }));
    try {
      await usersAPI.toggleFollow(authorId);
      const newFollowingState = !isFollowing;
      setIsFollowing(newFollowingState);
      setSnackbar({
        open: true,
        message: newFollowingState ? t("successfullyFollowedUser") : t("successfullyUnfollowedUser"),
        type: "success",
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t("actionFailed"),
        type: "error",
      });
    } finally {
      setActionLoading(prev => ({ ...prev, follow: false }));
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!currentUserId) {
      setSnackbar({
        open: true,
        message: t("mustBeLoggedIn"),
        type: "error",
      });
      return;
    }

    setLikingComment(prev => ({ ...prev, [commentId]: true }));
    try {
      const comment = comments.find(c => c._id === commentId);
      if (!comment) return;

      const currentLikes = comment.likes || [];
      const hasLiked = currentLikes.includes(currentUserId);

      let response;
      let newLikes: string[];
      if (hasLiked) {
        response = await postsAPI.unlikeComment(commentId);
        newLikes = currentLikes.filter((id: string) => id !== currentUserId);
      } else {
        response = await postsAPI.likeComment(commentId);
        newLikes = [...currentLikes, currentUserId];
      }

      // Update the comment in the tree with the fresh likes count
      setComments(prev => updateCommentInTree(prev, commentId, (c) => ({
        ...c,
        likes: response.likes || newLikes
      })));
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t("actionFailed"),
        type: "error",
      });
    } finally {
      setLikingComment(prev => ({ ...prev, [commentId]: false }));
    }
  };

  const handleReport = async () => {
    if (!post) {
      setSnackbar({
        open: true,
        message: t("somethingWentWrong"),
        type: "error",
      });
      return;
    }

    if (!currentUserId) {
      setSnackbar({
        open: true,
        message: t("mustBeLoggedIn"),
        type: "error",
      });
      return;
    }

    if (!reportReason.trim()) {
      setSnackbar({
        open: true,
        message: t("pleaseProvideReason"),
        type: "error",
      });
      return;
    }

    setActionLoading(prev => ({ ...prev, report: true }));
    try {
      // Determine target based on what's being reported
      const targetId = reportingCommentId || post._id;
      const targetType = reportingCommentId ? 'comment' : 'post';

      // Check if trying to report own content
      if (targetType === 'post' && post.authorId._id === currentUserId) {
        setSnackbar({
          open: true,
          message: t("cannotReportOwnPost"),
          type: "error",
        });
        return;
      }

      if (targetType === 'comment') {
        const comment = comments.find(c => c._id === reportingCommentId);
        if (comment?.userId?._id === currentUserId) {
          setSnackbar({
            open: true,
            message: t("cannotReportOwnComment"),
            type: "error",
          });
          return;
        }
      }

      await api.post('/reports', {
        targetType,
        targetId,
        reason: reportReason.trim(),
      });

      setSnackbar({
        open: true,
        message: t("reportSubmitted"),
        type: "success",
      });

      // Close modal and reset reason
      setReportModalOpen(false);
      setReportReason("");
      setReportingCommentId(null);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t("actionFailed"),
        type: "error",
      });
    } finally {
      setActionLoading(prev => ({ ...prev, report: false }));
    }
  };

  const handleReportComment = (commentId: string) => {
    if (!currentUserId) {
      setSnackbar({
        open: true,
        message: t("mustBeLoggedIn"),
        type: "error",
      });
      return;
    }
    setReportingCommentId(commentId);
    setReportModalOpen(true);
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeleteCommentId(commentId);
  };

  const confirmDeleteComment = async () => {
    if (!deleteCommentId) return;

    try {
      await api.delete(`/comments/${deleteCommentId}`);
      setComments(prev => deleteCommentFromTree(prev, deleteCommentId));
      setSnackbar({
        open: true,
        message: t("commentDeleted"),
        type: "success",
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t("actionFailed"),
        type: "error",
      });
    } finally {
      setDeleteCommentId(null);
    }
  };

  const cancelDeleteComment = () => {
    setDeleteCommentId(null);
  };

  const handleDeletePostClick = () => {
    if (!post) return;
    setDeletePostId(post._id);
  };

  const confirmDeletePost = async () => {
    if (!deletePostId) return;
    try {
      await api.delete(`/posts/${deletePostId}`);
      setSnackbar({
        open: true,
        message: t("postDeleted"),
        type: "success",
      });
      // Redirect to account page after successful deletion
      navigate("/account");
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t("actionFailed"),
        type: "error",
      });
    } finally {
      setDeletePostId(null);
    }
  };

  const cancelDeletePost = () => {
    setDeletePostId(null);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      setSnackbar({
        open: true,
        message: t("mustBeLoggedIn"),
        type: "error",
      });
      return;
    }

    if (!newComment.trim()) {
      setSnackbar({
        open: true,
        message: t("commentCannotBeEmpty"),
        type: "error",
      });
      return;
    }

    setSubmittingComment(true);
    try {
      const commentData = {
        postId: id,
        text: newComment.trim(),
      };
      console.log('Submitting comment:', commentData);
      const response = await api.post(`/comments`, commentData);
      console.log('Comment created response:', response.data);

      // Check if comment was flagged by AI moderation (server returns flagged: true)
      if (response.data.flagged || response.data.error) {
        // Comment was rejected by moderation
        const reasonKey = response.data.error;
        const errorMessage = t(reasonKey);

        setSnackbar({
          open: true,
          message: errorMessage,
          type: "error",
        });
      } else {
        // Add the new comment to the list
        setComments(prev => [response.data, ...prev]);
        setNewComment("");
        setSnackbar({
          open: true,
          message: t("commentAdded"),
          type: "success",
        });
      }
    } catch (error: any) {
      console.error('Failed to post comment:', error);
      console.error('Error response:', error.response?.data);
      const errData = error.response?.data;
      let errorMessage: string;

      if (errData?.error) {
        // Use translation key for known errors (except moderation which is now handled above)
        errorMessage = t(errData.error);
      } else if (errData?.message) {
        // Fallback to raw message
        errorMessage = errData.message;
      } else {
        errorMessage = t("actionFailed");
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        type: "error",
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  // Tree manipulation helpers for nested comments
  const updateCommentInTree = (commentsTree: Comment[], commentId: string, updater: (comment: Comment) => Comment): Comment[] => {
    return commentsTree.map(comment => {
      if (comment._id === commentId) {
        return updater(comment);
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentInTree(comment.replies, commentId, updater)
        };
      }
      return comment;
    });
  };

  const deleteCommentFromTree = (commentsTree: Comment[], commentId: string): Comment[] => {
    return commentsTree.filter(comment => {
      if (comment._id === commentId) {
        return false;
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: deleteCommentFromTree(comment.replies, commentId)
        };
      }
      return true;
    });
  };

  // Reply handlers
  const handleStartReply = (commentId: string) => {
    setReplyingToCommentId(commentId);
    setReplyTexts(prev => ({ ...prev, [commentId]: '' }));
  };

  const handleCancelReply = () => {
    setReplyingToCommentId(null);
  };

  const handleReplyTextChange = (commentId: string, text: string) => {
    setReplyTexts(prev => ({ ...prev, [commentId]: text }));
  };

  const handleReply = async (parentCommentId: string, replyText: string) => {
    if (!currentUserId) {
      setSnackbar({
        open: true,
        message: t("mustBeLoggedIn"),
        type: "error",
      });
      return;
    }

    const postIdParam = id;
    if (!postIdParam) return;

    setSubmittingReply(prev => ({ ...prev, [parentCommentId]: true }));
    try {
      const response = await api.post('/comments', {
        postId: postIdParam,
        text: replyText,
        parentCommentId: parentCommentId,
      });

      // Check if reply was flagged by AI moderation
      if (response.data.flagged || response.data.error) {
        // Reply was rejected
        const reasonKey = response.data.error;
        const errorMessage = t(reasonKey);

        setSnackbar({
          open: true,
          message: errorMessage,
          type: "error",
        });
      } else {
        const newReply = response.data;

        // Optimistically add reply to the tree
        setComments(prev => {
          const updatedTree = updateCommentInTree(prev, parentCommentId, (parent) => ({
            ...parent,
            replies: [...(parent.replies || []), newReply]
          }));
          return updatedTree;
        });

        setSnackbar({
          open: true,
          message: t("replyAdded"),
          type: "success",
        });

        // Reset reply state
        setReplyingToCommentId(null);
        setReplyTexts(prev => {
          const newState = { ...prev };
          delete newState[parentCommentId];
          return newState;
        });
      }
    } catch (error: any) {
      console.error('Failed to post reply:', error);
      setSnackbar({
        open: true,
        message: t("actionFailed"),
        type: "error",
      });
    } finally {
      setSubmittingReply(prev => ({ ...prev, [parentCommentId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="post-container">
        <UserSidebar />
        <div className="page-container">
          <div className="loading">{t("loading")}</div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-container">
        <UserSidebar />
        <div className="page-container">
          <div className="loading">{t("somethingWentWrong")}</div>
        </div>
      </div>
    );
  }

  // Detect the original language of the post based on title
  const postLanguage = detectLanguage(post.title);
  const isPostInUserLanguage = postLanguage === language;
  const isWaitingForApproval = post.isApproved === false;

  // Determine which language to display
  const displayTitle = showTranslation
    ? (translationCache?.title || post.translations?.title?.[language] || post.title)
    : post.title;
  const displayContent = showTranslation
    ? (translationCache?.content || post.translations?.content?.[language] || post.content)
    : post.content;
  const displayTags = showTranslation
    ? (translationCache?.tags || post.translations?.tags?.[language] || post.tags)
    : post.tags;

  return (
    <div className="post-container">
      <UserSidebar />
      <div className="page-container">
        <div style={{ marginBottom: "24px" }}>
          <GoBackButton />
          <div className="post-header">
            <h1 className="page-title page-title-no-margin">{displayTitle}</h1>
            {/* Translate Toggle Button */}
            {!isPostInUserLanguage && (
              <button
                onClick={handleTranslate}
                disabled={translating || actionLoading.report}
                className="post-translate-btn"
                style={{
                  cursor: translating || actionLoading.report ? "not-allowed" : "pointer",
                  opacity: translating || actionLoading.report ? 0.7 : 1,
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
            {isWaitingForApproval && (
              <div className="approval-badge">
                {t("waitingForApproval")}
              </div>
            )}
          </div>
        </div>

        {/* Author, Follow, Like, and Category */}
        <div className="mb-6">
          <div className="author-container">
            {/* Author Profile Link */}
            <div
              className="author-link"
              onClick={() => navigate(`/users/${post.authorId._id}`)}
            >
              {post.authorId.profileImage ? (
                <img
                  src={post.authorId.profileImage}
                  alt={post.authorId.username}
                  className="author-avatar"
                />
              ) : (
                <div className="author-avatar-placeholder">
                  {post.authorId.username.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="author-username">
                @{post.authorId.username}
              </span>
            </div>

            {/* Follow/Unfollow Button */}
            {currentUserId && currentUserId !== post.authorId._id && (
              <button
                className={`btn-secondary post-action-btn ${isFollowing ? "unfollow" : ""}`}
                onClick={handleFollow}
                disabled={actionLoading.follow}
                style={{
                  borderColor: isFollowing ? "#a50104" : undefined,
                  color: isFollowing ? "#a50104" : undefined,
                  background: isFollowing ? "rgba(165, 1, 4, 0.1)" : undefined,
                  opacity: actionLoading.follow ? 0.7 : 1,
                  cursor: actionLoading.follow ? "wait" : "pointer",
                }}
                title={isFollowing ? t("unfollow") : t("follow")}
              >
                {actionLoading.follow ? (
                  <span className="material-icons spin text-base">refresh</span>
                ) : (
                  <>
                    <span className="material-icons text-lg">
                      {isFollowing ? "person_remove" : "person_add"}
                    </span>
                    {isFollowing ? t("unfollow") : t("follow")}
                  </>
                )}
              </button>
            )}

            {/* Like Button */}
            <button
              onClick={handleLike}
              disabled={actionLoading.like}
              className={`btn-secondary post-action-btn ${isLiked ? "liked" : ""}`}
              style={{
                borderColor: isLiked ? "#e0245e" : undefined,
                color: isLiked ? "#e0245e" : undefined,
                background: isLiked ? "rgba(224, 36, 94, 0.1)" : undefined,
                opacity: actionLoading.like ? 0.7 : 1,
                cursor: actionLoading.like ? "wait" : "pointer",
              }}
              title={isLiked ? t("unlike") : t("like")}
            >
              {actionLoading.like ? (
                <span className="material-icons spin text-base">refresh</span>
              ) : (
                <span className="material-icons text-lg">
                  {isLiked ? "favorite" : "favorite_border"}
                </span>
              )}
              <span>{likesCount} {likesCount === 1 ? t("like") : t("likes")}</span>
            </button>

            {/* Delete Button - only show if user owns the post */}
            {currentUserId && currentUserId === post.authorId._id && (
              <button
                onClick={handleDeletePostClick}
                disabled={actionLoading.delete}
                className="btn-secondary post-action-btn btn-delete"
                style={{
                  opacity: actionLoading.delete ? 0.7 : 1,
                  cursor: actionLoading.delete ? "wait" : "pointer",
                }}
                title={t("deletePost")}
              >
                {actionLoading.delete ? (
                  <span className="material-icons spin text-base">refresh</span>
                ) : (
                  <span className="material-icons text-base">delete</span>
                )}
                <span>{t("deletePost")}</span>
              </button>
            )}

            {/* Report Button - only show if user doesn't own the post */}
            {currentUserId && currentUserId !== post.authorId._id && (
              <button
                onClick={() => setReportModalOpen(true)}
                disabled={actionLoading.report}
                className="btn-secondary post-action-btn btn-report"
                style={{
                  opacity: actionLoading.report ? 0.7 : 1,
                  cursor: actionLoading.report ? "wait" : "pointer",
                }}
                title={t("report")}
              >
                {actionLoading.report ? (
                  <span className="material-icons spin text-base">refresh</span>
                ) : (
                  <span className="material-icons text-lg">warning</span>
                )}
                <span>{t("report")}</span>
              </button>
            )}
          </div>

          {/* Category */}
          <span
            className="category-badge"
            style={{
              borderColor: post.category && getCategoryStyle(post.category.name) ? getCategoryStyle(post.category.name)!.borderColor : "var(--theme-text)",
              backgroundColor: post.category && getCategoryStyle(post.category.name) ? getCategoryStyle(post.category.name)!.backgroundColor : "transparent",
              color: post.category && getCategoryStyle(post.category.name) ? getCategoryStyle(post.category.name)!.color : "var(--theme-text)",
            }}
          >
            {getCategoryDisplayName(post.category?.name || "")}
          </span>
        </div>

        {/* Image Carousel */}
        {post.image && post.image.length > 0 && (
          <div className="mb-6">
            <div className="image-carousel">
              <img
                src={post.image[currentImageIndex]}
                alt={`${displayTitle} - image ${currentImageIndex + 1}`}
                className="post-image"
              />
              {post.image.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="carousel-nav-btn carousel-prev"
                  >
                    <span className="material-icons">chevron_left</span>
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="carousel-nav-btn carousel-next"
                  >
                    <span className="material-icons">chevron_right</span>
                  </button>
                  <div className="image-indicators">
                    {post.image.map((_: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className="image-indicator"
                        style={{
                          background: index === currentImageIndex ? "white" : "rgba(255,255,255,0.5)",
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {displayTags && displayTags.length > 0 && (
          <div className="tags-container">
            {displayTags.map((tag: string, index: number) => (
              <span
                key={index}
                className="tag"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        <div className="mb-8">
          <ReactMarkdown
            components={{
              p: ({node, ...props}) => <p className="markdown-paragraph" {...props} />,
              strong: ({node, ...props}) => <strong className="markdown-strong" {...props} />,
              em: ({node, ...props}) => <em className="markdown-em" {...props} />,
            }}
          >
            {displayContent}
          </ReactMarkdown>
        </div>

        <hr className="divider" />

        {/* Comment Form */}
        {currentUserId ? (
          <form onSubmit={handleSubmitComment} className="mb-8">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t("writeComment")}
              rows={3}
              className="form-textarea mb-3"
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="btn-primary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  opacity: submittingComment || !newComment.trim() ? 0.7 : 1,
                  cursor: submittingComment || !newComment.trim() ? "not-allowed" : "pointer",
                }}
              >
                {submittingComment ? (
                  <span className="material-icons spin text-base">refresh</span>
                ) : (
                  <span className="material-icons text-lg">send</span>
                )}
                {t("postComment")}
              </button>
            </div>
          </form>
        ) : (
          <div style={{
            textAlign: "center",
            padding: "24px",
            background: "var(--theme-bg)",
            borderRadius: "12px",
            marginBottom: "32px",
            border: "1px dashed var(--theme-text)",
            opacity: 0.8
          }}>
            <p style={{ margin: 0, color: "var(--theme-text)" }}>
              {t("mustBeLoggedInToComment")}
            </p>
          </div>
        )}

        {/* Comments Section */}
        <h2 className="section-heading">
          {t("comments")} ({totalCommentCount})
        </h2>

        {comments.length === 0 ? (
          <div className="loading-centered opacity-60">
            {t("noComments")}
          </div>
        ) : (
          <div className="d-flex flex-column gap-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                currentUserId={currentUserId}
                depth={0}
                onLike={handleLikeComment}
                onDelete={handleDeleteComment}
                onReport={handleReportComment}
                onTranslate={handleTranslateComment}
                onReply={handleReply}
                translatedCommentId={translatedCommentId}
                commentTranslationCache={commentTranslationCache}
                translatingComment={translatingComment}
                replyingToCommentId={replyingToCommentId}
                replyTexts={replyTexts}
                submittingReply={submittingReply}
                likingComment={likingComment}
                onStartReply={handleStartReply}
                onCancelReply={handleCancelReply}
                onReplyTextChange={handleReplyTextChange}
                hiddenReplies={hiddenReplies}
                toggleRepliesVisibility={toggleRepliesVisibility}
                t={t}
                language={language}
                formatCommentTime={formatCommentTime}
                navigate={navigate}
              />
            ))}
          </div>
        )}

        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          open={snackbar.open}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
        <footer className="page-footer">
          <p>{t("copyright")}</p>
        </footer>

        {/* Report Modal */}
        {reportModalOpen && (
          <div className="modal-overlay" onClick={() => {
            setReportModalOpen(false);
            setReportingCommentId(null);
          }}>
            <div className="modal modal-warning" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">
                {t(reportingCommentId ? "reportComment" : "reportPost")}
              </h2>
              <p className="modal-text">
                {t("reasonForReport")}:
              </p>
              <textarea
                className="form-textarea mb-3"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={4}
                placeholder={t(reportingCommentId ? "enterReportReasonComment" : "enterReportReason")}
                autoFocus
              />
              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setReportModalOpen(false);
                    setReportReason("");
                    setReportingCommentId(null);
                  }}
                  disabled={actionLoading.report}
                >
                  {t("cancel")}
                </button>
                <button
                  className="btn-primary"
                  onClick={handleReport}
                  disabled={actionLoading.report}
                >
                  {actionLoading.report ? (
                    <span className="material-icons spin text-base">refresh</span>
                  ) : (
                    t("report")
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Comment Confirmation Modal */}
        {deleteCommentId && (
          <div className="modal-overlay" onClick={cancelDeleteComment}>
            <div className="modal modal-danger" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">{t("delete")}</h2>
              <p className="modal-text">
                {t("confirmDeleteComment")}
              </p>
              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={cancelDeleteComment}
                >
                  {t("close")}
                </button>
                <button
                  className="btn-danger"
                  onClick={confirmDeleteComment}
                >
                  {t("delete")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Post Confirmation Modal */}
        {deletePostId && (
          <div className="modal-overlay" onClick={cancelDeletePost}>
            <div className="modal modal-danger" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">{t("delete")}</h2>
              <p className="modal-text">
                {t("confirmDeletePost")}
              </p>
              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={cancelDeletePost}
                >
                  {t("close")}
                </button>
                <button
                  className="btn-danger"
                  onClick={confirmDeletePost}
                >
                  {actionLoading.delete ? (
                    <span className="material-icons spin text-base">refresh</span>
                  ) : (
                    t("delete")
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Post;
