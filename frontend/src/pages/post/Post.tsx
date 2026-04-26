/**
 * @file Post.tsx
 * @description Single post detail page providing a comprehensive view of post content and threaded discussions.
 * Integrates markdown rendering, multi-image carousels and an AI-moderated comment system.
 * Includes in-place editing capabilities, multi-image management, and AI moderation logic.
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import UserSidebar from "../../components/user/sidebar/UserSidebar";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation } from "../../utils/translations";
import api, { postsAPI, usersAPI, Post as PostType, Comment } from "../../services/api";
import "../../styles/shared.css";
import "./Post.css";
import "../user/upload/Upload.css";
import Snackbar from "../../components/snackbar/Snackbar";
import { useAuth } from "../../utils/useAuth";
import { useSnackbar } from "../../utils/snackbar";
import { detectLanguage } from "../../utils/language";
import { formatTimeAgo } from "../../utils/display";
import { updateInTree, countAllInTree, removeFromTree } from "../../utils/tree";
import ReactMarkdown from "react-markdown";
import Footer from "../../components/global/Footer";
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { useNotifications } from "../../context/NotificationContext";

import CommentItem from "./CommentItem";
import ReportModal from "./ReportModal";
import PostHeader from "./PostHeader";
import PostAuthorActions from "./PostAuthorActions";
import PostImageCarousel from "./PostImageCarousel";

interface Tag {
  _id: string;
  name: string;
}

const Post = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useThemeLanguage();
  const { refreshUnreadCount } = useNotifications();
  const { user } = useAuth();
  const t = (key: string) => getTranslation(language, key);
  const currentUserId = user?._id || null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [post, setPost] = useState<PostType | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { snackbar, showSuccess, showError, showWarning, closeSnackbar } = useSnackbar();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState<string>("");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [updating, setUpdating] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");

  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [likingComment, setLikingComment] = useState<Record<string, boolean>>({});
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  const [showTranslation, setShowTranslation] = useState(false);
  const [translationCache, setTranslationCache] = useState<{
    title: string;
    content: string;
    tags?: string[];
  } | null>(null);
  const [translating, setTranslating] = useState(false);

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
  const [updatingCommentId, setUpdatingCommentId] = useState<string | null>(null);

  const totalCommentCount = useMemo(() => countAllInTree(comments), [comments]);

  useEffect(() => {
    if (id) { fetchPost(); fetchComments(); }
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTagDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [id]);

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

  const fetchCategories = async () => {
    try {
      const response = await api.get("/categories");
      setCategories(response.data);
    } catch (e) { showError(t("failedToLoadCategories")); }
  };

  const fetchTags = async () => {
    try {
      const response = await api.get("/tags");
      setAllTags(response.data);
    } catch (e) { showError(t("failedToLoadTags")); }
  };

  const startEditing = () => {
    if (categories.length === 0) fetchCategories();
    if (allTags.length === 0) fetchTags();
    
    setEditTitle(post?.title || "");
    setEditDescription(post?.content || "");

    const categoryId = typeof post?.category === 'object' 
      ? post.category._id 
      : post?.category;
      
    setEditCategory(categoryId || "");
    setEditImages(post?.image || []);
    setEditTags(post?.tags?.map((tag: any) => typeof tag === 'object' ? tag._id : tag) || []);
    setIsEditing(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const base64Promises = files.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    try {
      const newImages = await Promise.all(base64Promises);
      setEditImages(prev => [...prev, ...newImages]);
    } catch (err) {
      showError(t("failedToUploadImage"));
    }
  };

  const removeImage = (index: number) => {
    setEditImages(prev => prev.filter((_, i) => i !== index));
    if (currentImageIndex >= editImages.length - 1) {
      setCurrentImageIndex(Math.max(0, editImages.length - 2));
    }
  };

  const handleAddTag = (tagId: string) => {
    if (!editTags.includes(tagId)) {
      setEditTags([...editTags, tagId]);
    }
    setShowTagDropdown(false);
  };

  const handleRemoveTag = (tagId: string) => {
    setEditTags(editTags.filter((id) => id !== tagId));
  };

  const handleUpdatePost = async () => {
    const selectedCat = categories.find(c => c._id === editCategory);
    const isQuestion = selectedCat?.name.toLowerCase() === "question";
    
    if (!isQuestion && editImages.length === 0) {
      return showError(t("selectFileError"));
    }

    setUpdating(true);
    try {
      const response = await api.put(`/posts/${post!._id}`, {
        title: editTitle.trim(),
        content: editDescription,
        category: editCategory, 
        image: editImages,
        tags: editTags 
      });

      if (response.data.flagged || response.data.error) {
        showError(t(response.data.error)); 
        await refreshUnreadCount(); 
      } else {
        const successMsg = response.status === 202 ? t("postPendingAdminReview") : t("postUpdatedSuccess");
        response.status === 202 ? showWarning(successMsg) : showSuccess(successMsg);

        await refreshUnreadCount(); 
        setPost(response.data.post || response.data);
        setIsEditing(false);

        if (response.status === 202) {
          setTimeout(() => navigate("/home"), 2000);
        }
      }
    } catch (error: any) {
      showError(t(error.response?.data?.error || "somethingWentWrong"));
    } finally {
      setUpdating(false);
    }
  };

  const handleEditComment = async (commentId: string, newText: string) => {
    setUpdatingCommentId(commentId);
    try {
      const response = await api.put(`/comments/${commentId}`, { text: newText });

      if (response.data.flagged) {
        showError(t("commentUpdateFail"));
      } else {
        setComments(prev => updateInTree(prev, commentId, c => ({ 
          ...c, 
          text: response.data.text,
          updatedAt: response.data.updatedAt,
          translations: response.data.translations 
        })));
        showSuccess(t("commentUpdateSuccess"));
      }
    } catch (error: any) {
      showError(t("actionFailed"));
    } finally {
      setUpdatingCommentId(null);
    }
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
    if (translatedCommentId === commentId) { setTranslatedCommentId(null); return; }
    if (commentTranslationCache[commentId]) { setTranslatedCommentId(commentId); return; }
    setTranslatingComment(commentId);
    try {
      const response = await postsAPI.translateComment(commentId, language);
      setCommentTranslationCache(prev => ({ ...prev, [commentId]: response.text }));
      setTranslatedCommentId(commentId);
    } catch (error: any) { showError(t("failedToTranslateComment")); }
    finally { setTranslatingComment(null); }
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
      if (res.data.flagged) showError(t(res.data.error));
      else {
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
  const displayTags = showTranslation 
    ? (translationCache?.tags || post.translations?.tags?.[language])
    : post.tags?.map((tag: any) => typeof tag === 'object' ? tag.name : tag);

  const hasChanges = editTitle !== post?.title || 
                    editDescription !== post?.content || 
                    editCategory !== (typeof post?.category === 'object' ? post?.category?._id : post?.category) ||
                    JSON.stringify(editImages) !== JSON.stringify(post?.image) ||
                    JSON.stringify(editTags) !== JSON.stringify(post?.tags?.map((tag: any) => typeof tag === 'object' ? tag._id : tag));

  return (
    <div className="post-container">
      <UserSidebar />
      <div className="page-container">
        {isEditing && (
            <div className="d-flex gap-2 justify-content-end mb-4 sticky-top bg-theme-bg py-2 z-10" style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                <button className="btn-secondary" onClick={() => setIsEditing(false)} disabled={updating}>{t("close")}</button>
                {hasChanges && (
                  <button className="btn-primary" onClick={handleUpdatePost} disabled={updating}>
                    {updating ? <span className="material-icons spin">refresh</span> : t("saveChanges")}
                  </button>
                )}
            </div>
        )}
        {isEditing ? (
          <div className="mb-4">
            <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="form-input" style={{ fontSize: '2rem', fontWeight: 'bold', width: '100%' }} placeholder={t("title")} />
          </div>
        ) : (
          <PostHeader post={post} displayTitle={displayTitle} showTranslation={showTranslation} translating={translating} isPostInUserLanguage={detectLanguage(post.title!) === language} isWaitingForApproval={post.isApproved === false} actionLoadingReport={actionLoading.report} handleTranslate={handleTranslate} t={t} />
        )}
        {isEditing ? (
          <div className="edit-mode-category mb-4">
            <label className="form-label">{t("category")}</label>
            <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="form-select" style={{ maxWidth: '250px' }}>
              {categories.map((cat) => <option key={cat._id} value={cat._id}>{t(cat.name.toLowerCase()) || cat.name}</option>)}
            </select>
          </div>
        ) : (
          <PostAuthorActions post={post} currentUserId={currentUserId} isFollowing={isFollowing} isLiked={isLiked} likesCount={likesCount} actionLoading={actionLoading} handleFollow={handleFollow} handleLike={handleLike} navigate={navigate} handleDeletePostClick={() => setDeletePostId(post._id)} setReportModalOpen={setReportModalOpen} t={t} onEdit={startEditing} />
        )}
        <div className="image-carousel-wrapper" style={{ position: 'relative' }}>
          <PostImageCarousel images={isEditing ? editImages : post.image} currentIndex={currentImageIndex} displayTitle={displayTitle} handlePrev={() => setCurrentImageIndex(p => (p - 1 + (isEditing ? editImages.length : post.image.length)) % (isEditing ? editImages.length : post.image.length))} handleNext={() => setCurrentImageIndex(p => (p + 1) % (isEditing ? editImages.length : post.image.length))} setIndex={setCurrentImageIndex} />
          {isEditing && (
            <div className="edit-image-overlay">
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} accept="image/*" />
                <button type="button" className="btn-secondary edit-add-img-btn" onClick={() => fileInputRef.current?.click()}><AddIcon sx={{ fontSize: 18 }} /> {t("add")}</button>
                {editImages.length > 0 && <button type="button" className="btn-danger edit-remove-img-btn" onClick={() => removeImage(currentImageIndex)}><CloseIcon sx={{ fontSize: 18 }} /> {t("delete")}</button>}
            </div>
          )}
        </div>
        <div className="mt-4 mb-4">
            {isEditing ? (
                <div className="tags-container" style={{ minHeight: '40px' }}>
                    {editTags.map((tagId) => {
                        const tag = allTags.find((tg) => tg._id === tagId);
                        return tag ? (
                            <span key={tagId} className="tag-pill">{t(tag.name.toLowerCase()) || tag.name}
                                <button type="button" onClick={() => handleRemoveTag(tagId)} className="tag-pill-remove"><CloseIcon sx={{ fontSize: 14 }} /></button>
                            </span>
                        ) : null;
                    })}
                    <div className="relative" ref={dropdownRef}>
                        <button type="button" onClick={() => setShowTagDropdown(!showTagDropdown)} className="tag-add-button">{showTagDropdown ? <CloseIcon sx={{ fontSize: 18 }} /> : <AddIcon sx={{ fontSize: 18 }} />}</button>
                        {showTagDropdown && (
                            <div className="tag-dropdown">
                                <div className="tag-dropdown-search"><input type="text" value={tagSearchQuery} onChange={(e) => setTagSearchQuery(e.target.value)} placeholder={t("searchTags")} className="tag-search-input" onClick={(e) => e.stopPropagation()} autoFocus /></div>
                                <div className="tag-dropdown-list">
                                    {allTags.filter(tag => !editTags.includes(tag._id) && tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())).map(tag => (
                                        <div key={tag._id} onClick={() => handleAddTag(tag._id)} className="tag-dropdown-item">{t(tag.name.toLowerCase()) || tag.name}</div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                displayTags && displayTags.length > 0 && <div className="tags-container">{displayTags.map((tag: string, i: number) => <span key={i} className="tag">#{tag}</span>)}</div>
            )}
        </div>
        <div className="content-area mt-4">
          {isEditing ? (
            <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="form-textarea mb-4" rows={12} placeholder={t("description")} />
          ) : (
            <div className="mb-8">
                <ReactMarkdown components={{ p: props => <p className="markdown-paragraph" {...props} /> }}>{displayContent}</ReactMarkdown>
            </div>
          )}
        </div>
        <hr className="divider" />
        {currentUserId ? (
          <form onSubmit={handleSubmitComment} className="mb-8">
            <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder={t("writeComment")} rows={3} className="form-textarea mb-3" />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" disabled={submittingComment || !newComment.trim()} className="btn-primary">{submittingComment ? <span className="material-icons spin">refresh</span> : <span className="material-icons">send</span>}{t("postComment")}</button>
            </div>
          </form>
        ) : <div className="login-prompt"><p>{t("mustBeLoggedInToComment")}</p></div>}

        <h2 className="section-heading">{t("comments")} ({totalCommentCount})</h2>
        {comments.length === 0 ? <div className="empty-state"><span className="material-icons">chat_bubble_outline</span><h3 className="empty-state-title">{t("noComments")}</h3></div> : (
          <div className="d-flex flex-column gap-4">
            {comments.map(c => <CommentItem key={c._id} comment={c} currentUserId={currentUserId} depth={0} onLike={handleLikeComment} onDelete={id => setDeleteCommentId(id)} onReport={id => { setReportingCommentId(id); setReportModalOpen(true); }} onTranslate={handleTranslateComment} onReply={handleReply} onEditComment={handleEditComment} updatingCommentId={updatingCommentId} translatedCommentId={translatedCommentId} commentTranslationCache={commentTranslationCache} translatingComment={translatingComment} replyingToCommentId={replyingToCommentId} replyTexts={replyTexts} submittingReply={submittingReply} likingComment={likingComment} onStartReply={id => setReplyingToCommentId(id)} onCancelReply={() => setReplyingToCommentId(null)} onReplyTextChange={(id, txt) => setReplyTexts(p => ({ ...p, [id]: txt }))} hiddenReplies={hiddenReplies} toggleRepliesVisibility={id => setHiddenReplies(p => ({ ...p, [id]: !p[id] }))} t={t} language={language} formatCommentTime={d => formatTimeAgo(d, language, t)} navigate={navigate} postId={post._id} />)}
          </div>
        )}
        <Snackbar message={snackbar.message} type={snackbar.type} open={snackbar.open} onClose={closeSnackbar} />
        <Footer />
        <ReportModal open={reportModalOpen} reason={reportReason} onReasonChange={setReportReason} reportingCommentId={reportingCommentId} loading={actionLoading.report} onReport={handleReport} onCancel={() => { setReportModalOpen(false); setReportReason(""); setReportingCommentId(null); }} t={t} />
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
