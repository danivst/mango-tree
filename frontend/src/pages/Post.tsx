import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import UserSidebar from "../components/UserSidebar";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { getTranslation } from "../utils/translations";
import api, { postsAPI, usersAPI, Post as PostType, Comment } from "../services/api";
import "./admin/AdminPages.css";
import Snackbar from "../components/Snackbar";
import GoBackButton from "../components/GoBackButton";
import { getToken } from "../utils/auth";
import ReactMarkdown from "react-markdown";

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
        style={{
          background: "var(--theme-bg)",
          borderRadius: "12px",
          padding: "16px",
          border: "1px solid rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", gap: "12px" }}>
          {/* Comment Author Avatar */}
          <div
            onClick={() => navigate(`/users/${comment.userId?._id}`)}
            style={{
              width: isNested ? "32px" : "40px",
              height: isNested ? "32px" : "40px",
              borderRadius: "50%",
              objectFit: "cover",
              cursor: "pointer",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {comment.userId?.profileImage ? (
              <img
                src={comment.userId.profileImage}
                alt={comment.userId.username}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "var(--theme-accent)",
                  border: "2px solid var(--theme-text)",
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--theme-text)",
                  fontWeight: 600,
                  fontSize: isNested ? "12px" : "16px",
                }}
              >
                {comment.userId?.username?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Comment Header */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
              <span
                style={{
                  fontSize: isNested ? "12px" : "14px",
                  fontWeight: 600,
                  color: "var(--theme-text)",
                  cursor: "pointer",
                }}
                onClick={() => navigate(`/users/${comment.userId?._id}`)}
              >
                @{comment.userId?.username}
              </span>
              <span
                style={{
                  fontSize: isNested ? "11px" : "12px",
                  color: "var(--theme-text)",
                  opacity: 0.6,
                }}
              >
                {formatCommentTime(comment.createdAt)}
              </span>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
                {/* Like Button */}
                <button
                  onClick={() => onLike(comment._id)}
                  disabled={!currentUserId || likingComment[comment._id]}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 12px",
                    minWidth: "auto",
                    border: currentUserId ? "1px solid" : "none",
                    borderColor: isLiked ? "#e0245e" : "rgba(0,0,0,0.1)",
                    color: isLiked ? "#e0245e" : "var(--theme-text)",
                    background: isLiked ? "rgba(224, 36, 94, 0.1)" : "transparent",
                    cursor: currentUserId && !likingComment[comment._id] ? "pointer" : "not-allowed",
                    borderRadius: "8px",
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
                    onClick={() => onStartReply(comment._id)}
                    disabled={replyingToCommentId === comment._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 12px",
                      minWidth: "auto",
                      border: "1px solid rgba(0,0,0,0.1)",
                      color: "var(--theme-text)",
                      background: replyingToCommentId === comment._id ? "rgba(0,0,0,0.05)" : "transparent",
                      cursor: replyingToCommentId === comment._id ? "not-allowed" : "pointer",
                      borderRadius: "8px",
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
                    onClick={() => toggleRepliesVisibility(comment._id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 12px",
                      minWidth: "auto",
                      border: "1px solid rgba(0,0,0,0.1)",
                      color: "var(--theme-text)",
                      background: "transparent",
                      cursor: "pointer",
                      borderRadius: "8px",
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
                    onClick={() => onReport(comment._id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "4px 12px",
                      minWidth: "auto",
                      border: "1px solid #ff9800",
                      color: "#ff9800",
                      background: "rgba(255, 152, 0, 0.1)",
                      cursor: "pointer",
                      borderRadius: "8px",
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
                    onClick={() => onDelete(comment._id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 12px",
                      minWidth: "auto",
                      border: "1px solid #a50104",
                      color: "#a50104",
                      background: "rgba(165, 1, 4, 0.1)",
                      borderRadius: "8px",
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
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <p style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: isNested ? "13px" : "14px",
                color: "var(--theme-text)",
                lineHeight: 1.5,
                margin: 0,
                flex: 1
              }}>
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
                    <span className="material-icons" style={{ fontSize: "12px" }}>
                      {translatedCommentId === comment._id ? "translate" : "language"}
                    </span>
                    <span style={{ fontSize: "10px" }}>
                      {translatedCommentId === comment._id ? t("viewOriginal") : t("translate")}
                    </span>
                  </button>
                );
              })()}
            </div>

            {/* Reply Form */}
            {replyingToCommentId === comment._id && (
              <form onSubmit={handleSubmitReply} style={{ marginTop: '12px' }}>
                <textarea
                  value={replyTexts[comment._id] || ''}
                  onChange={(e) => onReplyTextChange(comment._id, e.target.value)}
                  placeholder={t("writeReply") || "Write a reply..."}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '14px',
                    resize: 'vertical',
                    minHeight: '60px',
                    boxSizing: 'border-box',
                  }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={onCancelReply}
                    disabled={submittingReply[comment._id]}
                    style={{
                      padding: '6px 16px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      background: 'transparent',
                      borderRadius: '8px',
                      cursor: submittingReply[comment._id] ? 'not-allowed' : 'pointer',
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: '13px',
                    }}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReply[comment._id] || !replyTexts[comment._id]?.trim()}
                    style={{
                      padding: '6px 16px',
                      border: 'none',
                      background: 'var(--theme-accent)',
                      color: 'var(--theme-text)',
                      borderRadius: '8px',
                      cursor: submittingReply[comment._id] || !replyTexts[comment._id]?.trim() ? 'not-allowed' : 'pointer',
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: '13px',
                      fontWeight: 500,
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
        <div style={{ marginTop: '12px' }}>
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
        message: error.response?.data?.message || t("somethingWentWrong"),
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
      return t("justNow") || "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      const unit = minutes === 1 ? (t("minute") || "minute") : (t("minutes") || "minutes");
      return language === "bg" ? `${t("ago")} ${minutes} ${unit}` : `${minutes} ${unit} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      const unit = hours === 1 ? (t("hour") || "hour") : (t("hours") || "hours");
      return language === "bg" ? `${t("ago")} ${hours} ${unit}` : `${hours} ${unit} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      const unit = days === 1 ? (t("day") || "day") : (t("days") || "days");
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
        message: t("mustBeLoggedIn") || "You must be logged in to like posts",
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
        message: error.response?.data?.message || t("actionFailed"),
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
        message: error.response?.data?.message || "Failed to translate content",
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
        message: error.response?.data?.message || "Failed to translate comment",
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
        message: t("mustBeLoggedIn") || "You must be logged in to follow users",
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
        message: error.response?.data?.message || t("actionFailed"),
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
        message: t("mustBeLoggedIn") || "You must be logged in to like comments",
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
        newLikes = currentLikes.filter(id => id !== currentUserId);
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
        message: error.response?.data?.message || t("actionFailed"),
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
        message: error.response?.data?.message || t("actionFailed"),
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
        message: t("commentDeleted") || "Comment deleted successfully",
        type: "success",
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || t("actionFailed"),
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
        message: t("postDeleted") || "Post deleted successfully",
        type: "success",
      });
      // Redirect to account page after successful deletion
      navigate("/account");
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || t("actionFailed"),
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
        message: t("mustBeLoggedIn") || "You must be logged in to comment",
        type: "error",
      });
      return;
    }

    if (!newComment.trim()) {
      setSnackbar({
        open: true,
        message: t("commentCannotBeEmpty") || "Comment cannot be empty",
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
        const errorMessage = response.data.reason || t(reasonKey) || t("commentRejected");

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
          message: t("commentAdded") || "Comment added successfully",
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
        message: t("mustBeLoggedIn") || "You must be logged in to reply",
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
        const errorMessage = response.data.reason || t(reasonKey) || t("commentRejected");

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
          message: t("replyAdded") || "Reply added",
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
        message: error.response?.data?.message || t("actionFailed"),
        type: "error",
      });
    } finally {
      setSubmittingReply(prev => ({ ...prev, [parentCommentId]: false }));
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex" }}>
        <UserSidebar />
        <div className="admin-page" style={{ flex: 1 }}>
          <div className="admin-loading">{t("loading")}</div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ display: "flex" }}>
        <UserSidebar />
        <div className="admin-page" style={{ flex: 1 }}>
          <div className="admin-loading">{t("somethingWentWrong")}</div>
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
    <div style={{ display: "flex" }}>
      <UserSidebar />
      <div className="admin-page" style={{ flex: 1 }}>
        <div style={{ marginBottom: "24px" }}>
          <GoBackButton />
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
            <h1 className="admin-page-title" style={{ margin: 0 }}>{displayTitle}</h1>
            {/* Translate Toggle Button */}
            {!isPostInUserLanguage && (
              <button
                onClick={handleTranslate}
                disabled={translating || actionLoading.report}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 12px",
                  border: "2px solid var(--theme-accent)",
                  background: "var(--theme-accent)",
                  color: "var(--theme-text)",
                  borderRadius: "8px",
                  cursor: translating || actionLoading.report ? "not-allowed" : "pointer",
                  fontSize: "12px",
                  fontWeight: 500,
                  opacity: translating || actionLoading.report ? 0.7 : 1,
                }}
                title={showTranslation ? t("viewOriginal") : t("translate")}
              >
                {translating ? (
                  <span className="material-icons spin" style={{ fontSize: "14px" }}>refresh</span>
                ) : (
                  <span className="material-icons" style={{ fontSize: "14px" }}>
                    {showTranslation ? "translate" : "language"}
                  </span>
                )}
                <span>{showTranslation ? t("viewOriginal") : t("translate")}</span>
              </button>
            )}
            {isWaitingForApproval && (
              <div style={{
                display: "inline-block",
                padding: "6px 16px",
                background: "rgba(255, 193, 7, 0.2)",
                color: "#ffc107",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: 500,
                border: "1px solid rgba(255, 193, 7, 0.5)",
              }}>
                {t("waitingForApproval") || "Waiting for approval"}
              </div>
            )}
          </div>
        </div>

        {/* Author, Follow, Like, and Category */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "8px" }}>
            {/* Author Profile Link */}
            <div
              style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
              onClick={() => navigate(`/users/${post.authorId._id}`)}
            >
              {post.authorId.profileImage ? (
                <img
                  src={post.authorId.profileImage}
                  alt={post.authorId.username}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "var(--theme-accent)",
                    border: "2px solid var(--theme-text)",
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--theme-text)",
                    fontWeight: 600,
                    fontSize: "18px",
                  }}
                >
                  {post.authorId.username.charAt(0).toUpperCase()}
                </div>
              )}
              <span style={{ fontSize: "16px", fontWeight: 500, color: "var(--theme-text)" }}>
                @{post.authorId.username}
              </span>
            </div>

            {/* Follow/Unfollow Button */}
            {currentUserId && currentUserId !== post.authorId._id && (
              <button
                className={`admin-button-secondary ${isFollowing ? "unfollow" : ""}`}
                onClick={handleFollow}
                disabled={actionLoading.follow}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  minWidth: "auto",
                  flexShrink: 0,
                  borderColor: isFollowing ? "#a50104" : undefined,
                  color: isFollowing ? "#a50104" : undefined,
                  background: isFollowing ? "rgba(165, 1, 4, 0.1)" : undefined,
                  opacity: actionLoading.follow ? 0.7 : 1,
                  cursor: actionLoading.follow ? "wait" : "pointer",
                }}
                title={isFollowing ? t("unfollow") : t("follow")}
              >
                {actionLoading.follow ? (
                  <span className="material-icons spin" style={{ fontSize: "16px" }}>refresh</span>
                ) : (
                  <>
                    <span className="material-icons" style={{ fontSize: "18px" }}>
                      {isFollowing ? "person_remove" : "person_add"}
                    </span>
                    {isFollowing ? (t("unfollow") || "Unfollow") : (t("follow") || "Follow")}
                  </>
                )}
              </button>
            )}

            {/* Like Button */}
            <button
              onClick={handleLike}
              disabled={actionLoading.like}
              className={`admin-button-secondary ${isLiked ? "liked" : ""}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                minWidth: "auto",
                flexShrink: 0,
                borderColor: isLiked ? "#e0245e" : undefined,
                color: isLiked ? "#e0245e" : undefined,
                background: isLiked ? "rgba(224, 36, 94, 0.1)" : undefined,
                opacity: actionLoading.like ? 0.7 : 1,
                cursor: actionLoading.like ? "wait" : "pointer",
              }}
              title={isLiked ? t("unlike") : t("like")}
            >
              {actionLoading.like ? (
                <span className="material-icons spin" style={{ fontSize: "16px" }}>refresh</span>
              ) : (
                <span className="material-icons" style={{ fontSize: "18px" }}>
                  {isLiked ? "favorite" : "favorite_border"}
                </span>
              )}
              <span>{likesCount} {likesCount === 1 ? (t("like") || "Like") : (t("likes") || " Likes")}</span>
            </button>

            {/* Delete Button - only show if user owns the post */}
            {currentUserId && currentUserId === post.authorId._id && (
              <button
                onClick={handleDeletePostClick}
                disabled={actionLoading.delete}
                className="admin-button-secondary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  minWidth: "auto",
                  flexShrink: 0,
                  border: "2px solid #a50104",
                  color: "#a50104",
                  background: "rgba(165, 1, 4, 0.1)",
                  opacity: actionLoading.delete ? 0.7 : 1,
                  cursor: actionLoading.delete ? "wait" : "pointer",
                }}
                title={t("deletePost")}
              >
                {actionLoading.delete ? (
                  <span className="material-icons spin" style={{ fontSize: "16px" }}>refresh</span>
                ) : (
                  <span className="material-icons" style={{ fontSize: "16px" }}>delete</span>
                )}
                <span>{t("deletePost")}</span>
              </button>
            )}

            {/* Report Button - only show if user doesn't own the post */}
            {currentUserId && currentUserId !== post.authorId._id && (
              <button
                onClick={() => setReportModalOpen(true)}
                disabled={actionLoading.report}
                className="admin-button-secondary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  minWidth: "auto",
                  flexShrink: 0,
                  borderColor: "#ff9800",
                  color: "#ff9800",
                  background: "rgba(255, 152, 0, 0.1)",
                  opacity: actionLoading.report ? 0.7 : 1,
                  cursor: actionLoading.report ? "wait" : "pointer",
                }}
                title={t("report")}
              >
                {actionLoading.report ? (
                  <span className="material-icons spin" style={{ fontSize: "16px" }}>refresh</span>
                ) : (
                  <span className="material-icons" style={{ fontSize: "18px" }}>warning</span>
                )}
                <span>{t("report")}</span>
              </button>
            )}
          </div>

          {/* Category */}
          <span
            style={{
              fontSize: "13px",
              fontWeight: 700,
              padding: "6px 14px",
              borderRadius: "8px",
              display: "inline-block",
              border: "2px solid",
              ...(post.category && getCategoryStyle(post.category.name) ? {
                borderColor: getCategoryStyle(post.category.name)!.borderColor,
                backgroundColor: getCategoryStyle(post.category.name)!.backgroundColor,
                color: getCategoryStyle(post.category.name)!.color,
              } : {
                // Default style for unknown categories
                borderColor: "var(--theme-text)",
                backgroundColor: "transparent",
                color: "var(--theme-text)",
              }),
            }}
          >
            {getCategoryDisplayName(post.category?.name || "")}
          </span>
        </div>

        {/* Image Carousel */}
        {post.image && post.image.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                position: "relative",
                width: "100%",
                maxHeight: "500px",
                borderRadius: "12px",
                overflow: "hidden",
                backgroundColor: "var(--theme-bg)",
              }}
            >
              <img
                src={post.image[currentImageIndex]}
                alt={`${displayTitle} - image ${currentImageIndex + 1}`}
                style={{
                  width: "100%",
                  height: "500px",
                  objectFit: "contain",
                }}
              />
              {post.image.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "12px",
                      transform: "translateY(-50%)",
                      background: "rgba(0,0,0,0.5)",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "40px",
                      height: "40px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span className="material-icons">chevron_left</span>
                  </button>
                  <button
                    onClick={handleNextImage}
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: "12px",
                      transform: "translateY(-50%)",
                      background: "rgba(0,0,0,0.5)",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "40px",
                      height: "40px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span className="material-icons">chevron_right</span>
                  </button>
                  <div
                    style={{
                      position: "absolute",
                      bottom: "12px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      display: "flex",
                      gap: "8px",
                    }}
                  >
                    {post.image.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          border: "none",
                          background: index === currentImageIndex ? "white" : "rgba(255,255,255,0.5)",
                          cursor: "pointer",
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
          <div style={{ marginBottom: "16px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {displayTags.map((tag, index) => (
              <span
                key={index}
                style={{
                  background: "transparent",
                  color: "var(--theme-text)",
                  padding: "4px 12px",
                  borderRadius: "16px",
                  fontSize: "12px",
                  border: "1px solid var(--theme-text)",
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        <div style={{ marginBottom: "32px" }}>
          <ReactMarkdown
            components={{
              p: ({node, ...props}) => <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "14px", color: "var(--theme-text)", lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }} {...props} />,
              strong: ({node, ...props}) => <strong style={{ fontWeight: 600 }} {...props} />,
              em: ({node, ...props}) => <em style={{ fontStyle: 'italic' }} {...props} />,
            }}
          >
            {displayContent}
          </ReactMarkdown>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--theme-text)", opacity: 0.2, marginBottom: "32px" }} />

        {/* Comment Form */}
        {currentUserId ? (
          <form onSubmit={handleSubmitComment} style={{ marginBottom: "32px" }}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t("writeComment") || "Write a comment..."}
              rows={3}
              className="admin-form-textarea"
              style={{ marginBottom: "12px" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="admin-button-primary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  opacity: submittingComment || !newComment.trim() ? 0.7 : 1,
                  cursor: submittingComment || !newComment.trim() ? "not-allowed" : "pointer",
                }}
              >
                {submittingComment ? (
                  <span className="material-icons spin" style={{ fontSize: "16px" }}>refresh</span>
                ) : (
                  <span className="material-icons" style={{ fontSize: "18px" }}>send</span>
                )}
                {t("postComment") || "Post Comment"}
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
              {t("mustBeLoggedInToComment") || "Please log in to leave a comment"}
            </p>
          </div>
        )}

        {/* Comments Section */}
        <h2 style={{ fontFamily: "Poppins, sans-serif", fontSize: "24px", fontWeight: 600, color: "var(--theme-text)", marginBottom: "24px" }}>
          {t("comments")} ({totalCommentCount})
        </h2>

        {comments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", opacity: 0.6 }}>
            {t("noComments") || "No comments yet"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
          <div className="admin-modal-overlay" onClick={() => {
            setReportModalOpen(false);
            setReportingCommentId(null);
          }}>
            <div className="admin-modal admin-modal-warning" onClick={(e) => e.stopPropagation()}>
              <h2 className="admin-modal-title">
                {t(reportingCommentId ? "reportComment" : "reportPost")}
              </h2>
              <p className="admin-modal-text">
                {t("reasonForReport")}:
              </p>
              <textarea
                className="admin-form-textarea"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={4}
                placeholder={t(reportingCommentId ? "enterReportReasonComment" : "enterReportReason")}
                style={{ marginBottom: "12px" }}
                autoFocus
              />
              <div className="admin-modal-actions">
                <button
                  className="admin-button-secondary"
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
                  className="admin-button-primary"
                  onClick={handleReport}
                  disabled={actionLoading.report}
                >
                  {actionLoading.report ? (
                    <span className="material-icons spin" style={{ fontSize: "16px" }}>refresh</span>
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
          <div className="admin-modal-overlay" onClick={cancelDeleteComment}>
            <div className="admin-modal admin-modal-danger" onClick={(e) => e.stopPropagation()}>
              <h2 className="admin-modal-title">{t("delete")}</h2>
              <p className="admin-modal-text">
                {t("confirmDeleteComment") || "Are you sure you want to delete this comment?"}
              </p>
              <div className="admin-modal-actions">
                <button
                  className="admin-button-secondary"
                  onClick={cancelDeleteComment}
                >
                  {t("close")}
                </button>
                <button
                  className="admin-button-danger"
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
          <div className="admin-modal-overlay" onClick={cancelDeletePost}>
            <div className="admin-modal admin-modal-danger" onClick={(e) => e.stopPropagation()}>
              <h2 className="admin-modal-title">{t("delete")}</h2>
              <p className="admin-modal-text">
                {t("confirmDeletePost") || "Are you sure you want to delete this post?"}
              </p>
              <div className="admin-modal-actions">
                <button
                  className="admin-button-secondary"
                  onClick={cancelDeletePost}
                >
                  {t("close")}
                </button>
                <button
                  className="admin-button-danger"
                  onClick={confirmDeletePost}
                >
                  {actionLoading.delete ? (
                    <span className="material-icons spin" style={{ fontSize: "16px" }}>refresh</span>
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
