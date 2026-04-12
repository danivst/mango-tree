/**
 * @file Post.tsx
 * @description Single post detail page providing a comprehensive view of post content and threaded discussions.
 * Integrates markdown rendering, multi-image carousels, and an AI-moderated comment system.
 *
 * Features:
 * - Dynamic post content loading with Markdown support
 * - Interactive image gallery with carousel navigation
 * - Real-time engagement: Like/Unlike and Author Follow/Unfollow
 * - Multilingual Support: On-demand translation for both post content and individual comments (EN/BG)
 * - Threaded Conversations: Nested comment replies with recursive rendering via CommentItem
 * - Content Integrity: Reporting system for posts and comments, and AI-driven moderation feedback
 * - Thread Management: Persistent collapse/expand state for comment replies
 * - Deep Linking: Automatic smooth scroll and highlight for comment anchor IDs
 *
 * Architecture:
 * - Recursive Comment Tree: Manages flat comment data into nested structures using updateInTree and removeFromTree utilities
 * - State Management: Centralized handling of translation caches, loading indicators, and modal visibilities
 * - Performance: Memoized authentication checks and comment counter calculations to prevent unnecessary re-renders
 *
 * Translation System:
 * - Prioritizes server-side pre-calculated translations (post.translations)
 * - Falls back to a localized translation cache to minimize redundant API traffic
 * - Independent translation lifecycle for the post body and individual comment nodes
 */

import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import UserSidebar from "../../components/user/sidebar/UserSidebar";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation } from "../../utils/translations";
import api, { postsAPI, usersAPI, Post as PostType, Comment } from "../../services/api";
import "../../styles/shared.css";
import "./Post.css";
import Snackbar from "../../components/snackbar/Snackbar";
import { getCurrentUserId } from "../../utils/auth";
import { useSnackbar } from "../../utils/snackbar";
import { detectLanguage } from "../../utils/language";
import { formatTimeAgo } from "../../utils/display";
import { updateInTree, countAllInTree, removeFromTree } from "../../utils/tree";
import ReactMarkdown from "react-markdown";
import Footer from "../../components/global/Footer";

// Sub-components
import CommentItem from "./CommentItem";
import ReportModal from "./ReportModal";
import PostHeader from "./PostHeader";
import PostAuthorActions from "./PostAuthorActions";
import PostImageCarousel from "./PostImageCarousel";

/**
 * @page Post
 * @requires useParams - Extracts post ID from the URL path
 * @requires useThemeLanguage - Accesses the globally selected language for UI and content localization
 * @requires useSnackbar - Standardized hook for system notifications and alerts
 * @requires postsAPI - Service layer for post fetching, liking, and translation operations
 * @requires usersAPI - Service layer for following logic and profile verification
 * @requires updateInTree - Utility for immutably updating nested comment nodes
 */
const Post = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);
  const currentUserId = useMemo(() => getCurrentUserId(), []);

  const [post, setPost] = useState<PostType | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { snackbar, showSuccess, showError, showWarning, closeSnackbar } = useSnackbar();

  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [likingComment, setLikingComment] = useState<Record<string, boolean>>({});
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  // Post Translation State
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationCache, setTranslationCache] = useState<{
    title: string;
    content: string;
    tags?: string[];
  } | null>(null);
  const [translating, setTranslating] = useState(false);

  // Comment Translation State
  const [translatedCommentId, setTranslatedCommentId] = useState<string | null>(null);
  const [commentTranslationCache, setCommentTranslationCache] = useState<Record<string, string>>({});
  const [translatingComment, setTranslatingComment] = useState<string | null>(null);

  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<Record<string, boolean>>({});
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [hiddenReplies, setHiddenReplies] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState({ like: false, follow: false, report: false, delete: false });

  const totalCommentCount = useMemo(() => countAllInTree(comments), [comments]);

  useEffect(() => {
    if (id) { fetchPost(); fetchComments(); }
  }, [id]);

  /**
   * Effect handling URL fragments for direct comment linking.
   * If a hash exists (e.g., #comment-123), it scrolls the element into view and applies a temporary highlight.
   */
  useEffect(() => {
    const scrollToComment = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith("#comment-")) {
        const element = document.getElementById(hash.substring(1));
        if (element) {
          element.classList.add("highlighted-comment");
          element.scrollIntoView({ behavior: "smooth", block: "start" });
          setTimeout(() => element.classList.remove("highlighted-comment"), 2000);
        }
      }
    };
    const timer = setTimeout(scrollToComment, 100);
    return () => clearTimeout(timer);
  }, [comments]);

  const fetchPost = async () => {
    try {
      const data = await postsAPI.getPost(id!);
      setPost(data);
      setLikesCount(data.likes?.length || 0);
      if (currentUserId) {
        setIsLiked(data.likes?.includes(currentUserId) || false);
        const currentUser = await usersAPI.getCurrentUser();
        setIsFollowing(currentUser.following.includes(data.authorId?._id!));
      }
    } catch (error) {
      navigate("/home");
    } finally { setLoading(false); }
  };

  const fetchComments = async () => {
    try { const data = await postsAPI.getComments(id!); setComments(data); } catch (e) {}
  };

  const handleLike = async () => {
    if (!currentUserId) return showWarning(t("mustBeLoggedIn"));
    setActionLoading(p => ({ ...p, like: true }));
    try {
      if (isLiked) { await postsAPI.unlikePost(id!); setLikesCount(p => p - 1); }
      else { await postsAPI.likePost(id!); setLikesCount(p => p + 1); }
      setIsLiked(!isLiked);
    } catch (e) { showError(t("actionFailed")); }
    finally { setActionLoading(p => ({ ...p, like: false })); }
  };

  const handleTranslate = async () => {
    if (!post) return;
    if (showTranslation) return setShowTranslation(false);
    if (translationCache) return setShowTranslation(true);

    if (
      post.translations?.title?.[language] &&
      post.translations?.content?.[language] &&
      post.translations?.tags?.[language]
    ) {
      setTranslationCache({
        title: post.translations.title[language],
        content: post.translations.content[language],
        tags: post.translations.tags[language],
      });
      setShowTranslation(true);
      return;
    }

    setTranslating(true);
    try {
      const res = await postsAPI.translatePost(post._id, language);
      setTranslationCache({ title: res.title, content: res.content, tags: res.tags });
      setShowTranslation(true);
    } catch (e) { showError(t("failedToTranslateContent")); }
    finally { setTranslating(false); }
  };

  const handleTranslateComment = async (commentId: string) => {
    if (!post) return;
    if (translatedCommentId === commentId) {
      setTranslatedCommentId(null);
      return;
    }
    if (commentTranslationCache[commentId]) {
      setTranslatedCommentId(commentId);
      return;
    }

    setTranslatingComment(commentId);
    try {
      const response = await postsAPI.translateComment(commentId, language);
      setCommentTranslationCache(prev => ({ ...prev, [commentId]: response.text }));
      setTranslatedCommentId(commentId);
    } catch (error: any) {
      showError(t("failedToTranslateComment"));
    } finally {
      setTranslatingComment(null);
    }
  };

  const handleFollow = async () => {
    if (!currentUserId) return showWarning(t("mustBeLoggedIn"));
    setActionLoading(p => ({ ...p, follow: true }));
    try {
      await usersAPI.toggleFollow(post?.authorId?._id!);
      setIsFollowing(!isFollowing);
      showSuccess(!isFollowing ? t("successfullyFollowedUser") : t("successfullyUnfollowedUser"));
    } catch (e) { showError(t("actionFailed")); }
    finally { setActionLoading(p => ({ ...p, follow: false })); }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const response = await api.post(`/comments`, { postId: id, text: newComment.trim() });
      if (response.data.flagged) showError(t(response.data.error));
      else { setComments(prev => [response.data, ...prev]); setNewComment(""); showSuccess(t("commentAdded")); }
    } catch (error) { showError(t("actionFailed")); }
    finally { setSubmittingComment(false); }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!currentUserId) return showWarning(t("mustBeLoggedIn"));
    setLikingComment(prev => ({ ...prev, [commentId]: true }));
    try {
      const comment = comments.find(c => c._id === commentId);
      const hasLiked = comment?.likes?.includes(currentUserId!);
      const response = hasLiked ? await postsAPI.unlikeComment(commentId) : await postsAPI.likeComment(commentId);
      setComments(prev => updateInTree(prev, commentId, c => ({ ...c, likes: response.likes })));
    } catch (e) { showError(t("actionFailed")); }
    finally { setLikingComment(prev => ({ ...prev, [commentId]: false })); }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return showWarning(t("pleaseProvideReason"));
    setActionLoading(p => ({ ...p, report: true }));
    try {
      await api.post("/reports", { 
        targetType: reportingCommentId ? "comment" : "post", 
        targetId: reportingCommentId || post!._id, 
        reason: reportReason.trim() 
      });
      showSuccess(t("reportSubmitted"));
      setReportModalOpen(false); setReportReason(""); setReportingCommentId(null);
    } catch (e) { showError(t("actionFailed")); }
    finally { setActionLoading(p => ({ ...p, report: false })); }
  };

  const handleReply = async (parentCommentId: string, replyText: string) => {
    if (!currentUserId) return;
    setSubmittingReply(p => ({ ...p, [parentCommentId]: true }));
    try {
      const res = await api.post("/comments", { postId: id, text: replyText, parentCommentId });
      if (res.data.flagged) {
        showError(t(res.data.error));
      } else {
        setComments(prev => updateInTree(prev, parentCommentId, p => ({ ...p, replies: [...(p.replies || []), res.data] })));
        setReplyingToCommentId(null);
        showSuccess(t("replyAdded"));
      }
    } catch (e) { showError(t("actionFailed")); }
    finally { setSubmittingReply(p => ({ ...p, [parentCommentId]: false })); }
  };

  const confirmDeleteComment = async () => {
    try { 
      await api.delete(`/comments/${deleteCommentId}`); 
      setComments(p => removeFromTree(p, deleteCommentId!)); 
      showSuccess(t("commentDeleted")); 
    } catch (e) { showError(t("actionFailed")); } 
    finally { setDeleteCommentId(null); }
  };

  const confirmDeletePost = async () => {
    try { 
      await api.delete(`/posts/${post!._id}`); 
      showSuccess(t("postDeleted")); 
      setTimeout(() => navigate("/account"), 2000); 
    } catch (e) { showError(t("actionFailed")); }
  };

  if (loading || !post) return <div className="post-container"><UserSidebar /><div className="page-container"><div className="loading">{t("loading")}</div></div></div>;

  const displayTitle = showTranslation ? (translationCache?.title || post.translations?.title?.[language] || post.title) : post.title;
  const displayContent = showTranslation ? (translationCache?.content || post.translations?.content?.[language] || post.content) : post.content;
  const displayTags = showTranslation ? (translationCache?.tags || post.translations?.tags?.[language] || post.tags) : post.tags;

  return (
    <div className="post-container">
      <UserSidebar />
      <div className="page-container">
        <PostHeader 
          post={post} displayTitle={displayTitle} showTranslation={showTranslation} translating={translating}
          isPostInUserLanguage={detectLanguage(post.title) === language} isWaitingForApproval={post.isApproved === false}
          actionLoadingReport={actionLoading.report} handleTranslate={handleTranslate} t={t}
        />

        <PostAuthorActions 
          post={post} currentUserId={currentUserId} isFollowing={isFollowing} isLiked={isLiked} likesCount={likesCount}
          actionLoading={actionLoading} handleFollow={handleFollow} handleLike={handleLike} navigate={navigate}
          handleDeletePostClick={() => setDeletePostId(post._id)} setReportModalOpen={setReportModalOpen} t={t}
        />

        <PostImageCarousel 
          images={post.image} currentIndex={currentImageIndex} displayTitle={displayTitle}
          handlePrev={() => setCurrentImageIndex(p => (p - 1 + post.image.length) % post.image.length)}
          handleNext={() => setCurrentImageIndex(p => (p + 1) % post.image.length)} setIndex={setCurrentImageIndex}
        />

        {displayTags && displayTags.length > 0 && (
          <div className="tags-container">
            {displayTags.map((tag: string, i: number) => <span key={i} className="tag">#{tag}</span>)}
          </div>
        )}

        <div className="mb-8">
          <ReactMarkdown components={{ p: props => <p className="markdown-paragraph" {...props} /> }}>
            {displayContent}
          </ReactMarkdown>
        </div>

        <hr className="divider" />

        {currentUserId ? (
          <form onSubmit={handleSubmitComment} className="mb-8">
            <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder={t("writeComment")} rows={3} className="form-textarea mb-3" />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" disabled={submittingComment || !newComment.trim()} className="btn-primary">
                {submittingComment ? <span className="material-icons spin">refresh</span> : <span className="material-icons">send</span>}
                {t("postComment")}
              </button>
            </div>
          </form>
        ) : <div className="login-prompt"><p>{t("mustBeLoggedInToComment")}</p></div>}

        <h2 className="section-heading">{t("comments")} ({totalCommentCount})</h2>

        {comments.length === 0 ? (
          <div className="empty-state"><span className="material-icons">chat_bubble_outline</span><h3 className="empty-state-title">{t("noComments")}</h3></div>
        ) : (
          <div className="d-flex flex-column gap-4">
            {comments.map(c => (
              <CommentItem 
                key={c._id} comment={c} currentUserId={currentUserId} depth={0} onLike={handleLikeComment}
                onDelete={id => setDeleteCommentId(id)} onReport={id => { setReportingCommentId(id); setReportModalOpen(true); }}
                onTranslate={handleTranslateComment} onReply={handleReply}
                translatedCommentId={translatedCommentId} commentTranslationCache={commentTranslationCache}
                translatingComment={translatingComment} replyingToCommentId={replyingToCommentId} replyTexts={replyTexts}
                submittingReply={submittingReply} likingComment={likingComment} onStartReply={id => setReplyingToCommentId(id)}
                onCancelReply={() => setReplyingToCommentId(null)} onReplyTextChange={(id, txt) => setReplyTexts(p => ({ ...p, [id]: txt }))}
                hiddenReplies={hiddenReplies} toggleRepliesVisibility={id => setHiddenReplies(p => ({ ...p, [id]: !p[id] }))}
                t={t} language={language} formatCommentTime={d => formatTimeAgo(d, language, t)} navigate={navigate} postId={post._id}
              />
            ))}
          </div>
        )}

        <Snackbar message={snackbar.message} type={snackbar.type} open={snackbar.open} onClose={closeSnackbar} />
        <Footer />

        <ReportModal 
          open={reportModalOpen} reason={reportReason} onReasonChange={setReportReason} reportingCommentId={reportingCommentId}
          loading={actionLoading.report} onReport={handleReport} onCancel={() => { setReportModalOpen(false); setReportReason(""); setReportingCommentId(null); }} t={t}
        />

        {deleteCommentId && (
          <div className="modal-overlay" onClick={() => setDeleteCommentId(null)}>
            <div className="modal modal-danger" onClick={e => e.stopPropagation()}>
              <h2 className="modal-title">{t("delete")}</h2><p>{t("confirmDeleteComment")}</p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setDeleteCommentId(null)}>{t("close")}</button>
                <button className="btn-danger" onClick={confirmDeleteComment}>{t("delete")}</button>
              </div>
            </div>
          </div>
        )}

        {deletePostId && (
          <div className="modal-overlay" onClick={() => setDeletePostId(null)}>
            <div className="modal modal-danger" onClick={e => e.stopPropagation()}>
              <h2 className="modal-title">{t("delete")}</h2><p>{t("confirmDeletePost")}</p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setDeletePostId(null)}>{t("close")}</button>
                <button className="btn-danger" onClick={confirmDeletePost}>{t("delete")}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Post;