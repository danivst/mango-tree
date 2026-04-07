import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { adminAPI, Report } from "../../services/admin-api";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation, Language } from "../../utils/translations";
import {
  postsAPI,
  usersAPI,
  UserProfile,
  Comment,
  Post as PostType,
} from "../../services/api";
import api from "../../services/api";
import { Category } from "../../services/admin-api";
import "../../styles/shared.css";
import "../Post.css";
import "./ReportPostPreview.css";
import Snackbar from "../../components/Snackbar";
import Footer from "../../components/Footer";
import GoBackButton from "../../components/GoBackButton";
import ShareButton from "../../components/ShareButton";
import PastUsernames from "../../components/PastUsernames";
import { useSnackbar } from "../../utils/snackbar";

/**
 * @file ReportPostPreview.tsx
 * @description Admin detailed view of a reported post with full context and moderation actions.
 * Shows the post being reported, report details, reporter info, and provides action buttons.
 *
 * Features:
 * - Display reported post: title, content, author, images, tags, category
 * - Show report details: reporter, reason, additional context, timestamps
 * - Translate post content if needed (EN/BG)
 * - Post actions:
 *   - Dismiss report (keep post, mark report reviewed)
 *   - Delete post with ban option (delete post and optionally ban author)
 *   - View reported content directly (navigate to post)
 *
 * Workflow:
 * 1. Admin opens report from Reports page → navigates to this page with reportId param
 * 2. Fetches report details and associated post via Admin API
 * 3. Admin reviews content and takes action
 *
 * Data Sources:
 * - Report: GET /api/admin/reports/:reportId
 * - Post: GET /api/posts/:postId
 *
 * Access Control:
 * - Route protected by AdminRoute (admin only)
 *
 * State:
 * - Report and post data loading states
 * - Modal for delete/ban confirmation
 * - Snackbar for feedback
 *
 * @page
 * @requires useState - Report data, post data, modals, loading, snackbar
 * @requires useEffect - Fetch report and post on mount (when reportId changes)
 * @requires useParams - Get reportId from route /admin/report-post-preview/:reportId
 * @requires useNavigate - Go back to reports list or to post page
 * @requires useThemeLanguage - Language for translation
 * @requires adminAPI - Fetch single report, get post, dismiss report, delete post/comment
 * @requires postsAPI - Fetch post details (if needed)
 * @requires Snackbar - Action feedback
 * @requires Footer - Footer component
 */

const ReportPostPreview = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);

  const [report, setReport] = useState<Report | null>(null);
  const [post, setPost] = useState<PostType | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { snackbar, showError, closeSnackbar } = useSnackbar();

  // Translation states (for post preview)
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationCache, setTranslationCache] = useState<{
    title: string;
    content: string;
    tags?: string[];
  } | null>(null);
  const [translating, setTranslating] = useState(false);

  // Translation states for comment
  const [commentShowTranslation, setCommentShowTranslation] = useState(false);
  const [commentTranslationCache, setCommentTranslationCache] = useState<
    string | null
  >(null);
  const [commentTranslating, setCommentTranslating] = useState(false);

  // States for user preview
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<PostType[]>([]);
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [selectedUserCategoryId, setSelectedUserCategoryId] = useState<
    string | null
  >(null);

  // Compute special categories (recipe, question, flex) for tabs in correct order
  const specialCategories = useMemo(() => {
    if (!userCategories.length) return [];
    const lowerNames = ["recipe", "question", "flex"];
    const filtered = userCategories.filter((cat) =>
      lowerNames.includes(cat.name.toLowerCase()),
    );
    // Sort according to desired order: recipe -> question -> flex
    const order = ["recipe", "question", "flex"];
    return filtered.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      return order.indexOf(aName) - order.indexOf(bName);
    });
  }, [userCategories]);

  // Filter posts by selected category
  const filteredPosts = useMemo(() => {
    if (!selectedUserCategoryId) return userPosts; // Show all posts when "All" selected
    return userPosts.filter(
      (post) => post.category && post.category._id === selectedUserCategoryId,
    );
  }, [userPosts, selectedUserCategoryId]);

  useEffect(() => {
    if (reportId) {
      fetchReportAndPost();
    }
  }, [reportId]);

  const fetchReportAndPost = async () => {
    if (!reportId) return;
    try {
      const reports = await adminAPI.getReports();
      const currentReport = reports.find((r) => r._id === reportId);
      if (!currentReport) {
        showError(t("somethingWentWrong"));
        return;
      }
      setReport(currentReport);

      if (currentReport.targetType === "post") {
        // For post reports: fetch the post only (no comments)
        const postData = await postsAPI.getPost(currentReport.targetId);
        setPost(postData);
        setComments([]); // No comments to show
      } else if (currentReport.targetType === "comment") {
        // For comment reports: fetch the specific comment AND the post it belongs to
        try {
          const commentData = await postsAPI.getComment(currentReport.targetId);
          // Fetch the post that the comment is on
          const postData = await postsAPI.getPost(commentData.postId);
          setPost(postData);
          setComments([commentData]); // Only this comment in the comments array
        } catch (err) {
          console.error("Failed to fetch comment or post:", err);
          setPost(null);
          setComments([]);
        }
      } else if (currentReport.targetType === "user") {
        // For user reports: fetch user profile data and user's posts
        try {
          // Reset selected category for new user
          setSelectedUserCategoryId(null);
          // Fetch user details using usersAPI
          const userData = await usersAPI.getUser(currentReport.targetId);
          setUser(userData);

          // Fetch user's posts (include all for admin moderation)
          const postsResponse = await api.get<PostType[]>(
            `/posts/author/${currentReport.targetId}`,
          );
          setUserPosts(postsResponse.data);

          // Fetch categories for post category names (and tabs if needed)
          const categoriesResponse = await api.get<Category[]>("/categories");
          setUserCategories(categoriesResponse.data);
        } catch (err) {
          console.error("Failed to fetch user data:", err);
          setUser(null);
          setUserPosts([]);
          setUserCategories([]);
        }
      }
    } catch (error: any) {
      showError(t("somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  };

  // Determine which language to use for category names
  // For user profile previews, use the user's language if set to bg, otherwise use admin's UI language
  const categoryDisplayLanguage: Language =
    report?.targetType === "user" && user?.language === "bg" ? "bg" : language;

  const getCategoryDisplayName = (
    categoryName: string,
    lang: Language = categoryDisplayLanguage,
  ) => {
    const translated = getTranslation(lang, categoryName.toLowerCase());
    if (translated && translated !== categoryName.toLowerCase()) {
      return translated;
    }
    return categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
  };

  const handleNextImage = () => {
    if (post?.image && post.image.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % post.image.length);
    }
  };

  const handlePrevImage = () => {
    if (post?.image && post.image.length > 0) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + post.image.length) % post.image.length,
      );
    }
  };

  const formatCommentTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return t("justNow");
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      const unit =
        minutes === 1 ? t("minute") : t("minutes");
      return language === "bg"
        ? `${t("ago")} ${minutes} ${unit}`
        : `${minutes} ${unit} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      const unit = hours === 1 ? t("hour") : t("hours");
      return language === "bg"
        ? `${t("ago")} ${hours} ${unit}`
        : `${hours} ${unit} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      const unit = days === 1 ? t("day") : t("days");
      return language === "bg"
        ? `${t("ago")} ${days} ${unit}`
        : `${days} ${unit} ago`;
    } else {
      return date.toLocaleDateString(language === "bg" ? "bg-BG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  // Language detection for translation
  const detectLanguage = (text: string): "en" | "bg" => {
    if (!text) return "en";
    if (/[а-яА-Я]/.test(text)) {
      return "bg";
    }
    return "en";
  };

  const handleTranslate = async () => {
    if (!post) return;

    if (showTranslation) {
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
      const response = await postsAPI.translatePost(post._id, language);
      setTranslationCache({
        title: response.title,
        content: response.content,
        tags: response.tags,
      });
      setShowTranslation(true);
    } catch (error: any) {
      showError(t("somethingWentWrong"));
    } finally {
      setTranslating(false);
    }
  };

  const handleTranslateComment = async (commentId: string) => {
    if (!commentId) return;

    if (commentShowTranslation) {
      setCommentShowTranslation(false);
      return;
    }

    // If we already have cached translation, just show it
    if (commentTranslationCache) {
      setCommentShowTranslation(true);
      return;
    }

    // Get the current comment from the array
    const comment = comments.find((c) => c._id === commentId);
    if (!comment) return;

    // If stored translation exists for UI language, use it directly without fetching
    if (comment.translations?.[language]) {
      setCommentTranslationCache(comment.translations[language]);
      setCommentShowTranslation(true);
      return;
    }

    // Need to fetch translation
    setCommentTranslating(true);
    try {
      const response = await postsAPI.translateComment(commentId, language);
      setCommentTranslationCache(response.text);
      setCommentShowTranslation(true);
    } catch (error: any) {
      showError(t("somethingWentWrong"));
    } finally {
      setCommentTranslating(false);
    }
  };

  // Local EmptyState component for no data
  const EmptyState = ({
    icon,
    title,
    message
  }: {
    icon: React.ReactNode;
    title: string;
    message?: string;
  }) => (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      {message && <p className="empty-state-message">{message}</p>}
    </div>
  );

  if (loading) {
    return (
      <div>
        <div className="section-spacing">
          <GoBackButton />
        </div>
        <div className="loading">{t("loading")}</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div>
        <div className="section-spacing">
          <GoBackButton />
        </div>
        <div className="loading">{t("somethingWentWrong")}</div>
      </div>
    );
  }

  // Handle POST report: show post (read-only, no interactions/comments)
  if (report.targetType === "post") {
    if (!post) {
      return (
        <div>
          <div className="loading">{t("somethingWentWrong")}</div>
        </div>
      );
    }

    const postLanguage = detectLanguage(post.title);
    const isPostInUserLanguage = postLanguage === language;
    const isWaitingForApproval = post.isApproved === false;
    const displayTitle = showTranslation
      ? translationCache?.title ||
        post.translations?.title?.[language] ||
        post.title
      : post.title;
    const displayContent = showTranslation
      ? translationCache?.content ||
        post.translations?.content?.[language] ||
        post.content
      : post.content;
    const displayTags = showTranslation
      ? translationCache?.tags ||
        post.translations?.tags?.[language] ||
        post.tags
      : post.tags;

    return (
      <div>
        <div className="mb-24">
          <GoBackButton />
          <div className="post-preview-header">
            <h1 className="page-container-title">
              {displayTitle}
            </h1>
            {/* Translate Toggle Button */}
            {!isPostInUserLanguage && (
              <button
                onClick={handleTranslate}
                disabled={translating}
                className="btn-translate"
              >
                {translating ? (
                  <span className="material-icons spin icon-sm">
                    refresh
                  </span>
                ) : (
                  <span className="material-icons icon-sm">
                    {showTranslation ? "translate" : "language"}
                  </span>
                )}
                <span>
                  {showTranslation ? t("viewOriginal") : t("translate")}
                </span>
              </button>
            )}
            {isWaitingForApproval && (
              <div className="approval-badge">
                {t("waitingForApproval")}
              </div>
            )}
          </div>
        </div>

        {/* Author (no buttons) */}
        <div className="mb-24">
          <div className="author-info">
            {post.authorId.profileImage ? (
              <img
                src={post.authorId.profileImage}
                alt={post.authorId.username}
                className="author-avatar"
              />
            ) : (
              <div className="author-avatar-fallback">
                {post.authorId.username.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="author-username">
              @{post.authorId.username}
            </span>
          </div>
        </div>

        {/* Category Badge */}
        {post.category && (
          <span
            className={`category-badge ${
              ["flex", "recipe", "question"].includes(post.category.name.toLowerCase())
                ? post.category.name.toLowerCase()
                : "default"
            }`}
          >
            {getCategoryDisplayName(post.category.name)}
          </span>
        )}

        {/* Image Carousel */}
        {post.image && post.image.length > 0 && (
          <div className="mb-24">
            <div className="image-carousel">
              <img
                src={post.image[currentImageIndex]}
                alt={`${displayTitle} - image ${currentImageIndex + 1}`}
              />
              {post.image.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="carousel-nav-btn prev"
                  >
                    <span className="material-icons">chevron_left</span>
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="carousel-nav-btn next"
                  >
                    <span className="material-icons">chevron_right</span>
                  </button>
                  <div className="carousel-indicators">
                    {post.image.map((_: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`carousel-indicator ${index === currentImageIndex ? 'active' : ''}`}
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
                className="tag-pill"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        <div className="mb-32">
          <p className="description-text">
            {displayContent}
          </p>
        </div>

        {/* No comments or interaction buttons in admin preview */}

        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          open={snackbar.open}
          onClose={closeSnackbar}
        />
        <Footer />
      </div>
    );
  }

  // Handle COMMENT report: show the post and the single reported comment
  if (report.targetType === "comment") {
    const comment = comments[0] || null;

    if (!comment) {
      return (
        <div>
          <div className="loading">{t("somethingWentWrong")}</div>
        </div>
      );
    }

    // Compute displayed comment text based on translation state
    const displayCommentText = commentShowTranslation
      ? commentTranslationCache ||
        comment.translations?.[language] ||
        comment.text
      : comment.text;

    return (
      <div>
        <div className="mb-24">
          <GoBackButton />
        </div>

        {/* Comment Content */}
        <div className="mb-24">
          <div className="comment-header">
            <div className="flex items-center gap-12">
              {/* Comment Author Avatar */}
              {comment.userId?.profileImage ? (
                <img
                  src={comment.userId.profileImage}
                  alt={comment.userId.username}
                  className="comment-author-avatar"
                />
              ) : (
                <div className="comment-author-avatar-fallback">
                  {comment.userId?.username?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="comment-username">
                  @{comment.userId?.username}
                </p>
                <p className="comment-time">
                  {formatCommentTime(comment.createdAt)}
                </p>
              </div>
            </div>
            {/* Translate Button for Comment */}
            <button
              onClick={() => handleTranslateComment(comment._id)}
              disabled={commentTranslating}
              className="btn-translate"
            >
              {commentTranslating ? (
                <span className="material-icons spin icon-sm">
                  refresh
                </span>
              ) : (
                <span className="material-icons icon-sm">
                  {commentShowTranslation ? "translate" : "language"}
                </span>
              )}
              <span>
                {commentShowTranslation ? t("viewOriginal") : t("translate")}
              </span>
            </button>
          </div>
          <p className="comment-text">
            {displayCommentText}
          </p>
        </div>

        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          open={snackbar.open}
          onClose={closeSnackbar}
        />
        <Footer />
      </div>
    );
  }

  // Handle USER report: show user profile (read-only)
  if (report.targetType === "user") {
    if (!user) {
      return (
        <div>
          <div className="loading">{t("somethingWentWrong")}</div>
        </div>
      );
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString(
        language === "bg" ? "bg-BG" : "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        },
      );
    };

    return (
      <div>
        <div className="mb-24">
          <GoBackButton />
        </div>
        <div className="preview-header">
          {/* Profile Picture */}
          <div className="relative">
            <div className="preview-avatar">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.username}
                />
              ) : (
                <div className="preview-avatar-placeholder">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="d-flex justify-between items-center gap-3 mb-8">
              <h1 className="preview-username mb-0">
                @{user.username}
              </h1>
              <ShareButton
                url={`${window.location.origin}/users/${user._id}`}
                title={`@${user.username} - MangoTree Profile`}
                description={user.bio || ""}
              />
            </div>
            <p className="preview-member-since">
              {t("memberSince")}: {formatDate(user.createdAt)}
            </p>

            {/* Stats */}
            <div className="preview-stats">
              <div className="preview-stat-item">
                <div className="preview-stat-value">
                  {userPosts.length}
                </div>
                <div className="preview-stat-label">
                  {t("posts")}
                </div>
              </div>
              <div className="preview-stat-item">
                <div className="preview-stat-value">
                  {user.followers?.length || 0}
                </div>
                <div className="preview-stat-label">
                  {t("followers")}
                </div>
              </div>
              <div className="preview-stat-item">
                <div className="preview-stat-value">
                  {user.following?.length || 0}
                </div>
                <div className="preview-stat-label">
                  {t("following")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <div className="mb-24">
            <h3 className="preview-bio-title">
              {t("bio")}
            </h3>
            <p className="preview-bio-content">
              {user.bio}
            </p>
          </div>
        )}

        {/* Previous Usernames */}
        {user.pastUsernames && user.pastUsernames.length > 0 && (
          <PastUsernames pastUsernames={user.pastUsernames} className="mb-24" />
        )}

        {/* Divider */}
        <hr className="preview-divider" />

        {/* Category Tabs */}
        {userCategories.length > 0 && (
          <div className="preview-category-tabs">
            {/* All Button */}
            <button
              onClick={() => setSelectedUserCategoryId(null)}
              className={`preview-category-tab ${selectedUserCategoryId === null ? 'active' : ''}`}
            >
              {t("all")}
            </button>
            {specialCategories
              .filter((category) => category._id)
              .map((category) => (
                <button
                  key={category._id}
                  onClick={() => setSelectedUserCategoryId(category._id)}
                  className={`preview-category-tab ${selectedUserCategoryId === category._id ? 'active' : ''}`}
                >
                  {getCategoryDisplayName(category.name)}
                </button>
              ))}
          </div>
        )}

        {/* Posts Grid */}
        {filteredPosts.length === 0 ? (
          <EmptyState
            icon={<span className="material-icons">article</span>}
            title={t("noPostsFound")}
          />
        ) : (
          <div className="cards-grid">
            {filteredPosts.map((post) => (
              <div
                key={post._id}
                className="card preview-post-card"
              >
                {/* Post Image if exists */}
                {post.image && post.image.length > 0 && (
                  <div className="preview-post-image-container">
                    <img
                      src={post.image[0]}
                      alt={post.title}
                    />
                  </div>
                )}
                {/* Post Title */}
                <h3 className="preview-post-card-title">
                  {post.title}
                </h3>
                {/* Category & Date */}
                <div className="preview-post-meta">
                  <span>
                    {post.category
                      ? getCategoryDisplayName(post.category.name)
                      : "—"}
                  </span>
                  <span>{formatDate(post.createdAt)}</span>
                </div>
                {/* Likes count */}
                <div className="preview-post-likes">
                  <span className="material-icons icon-md">
                    favorite
                  </span>
                  {post.likes?.length || 0}
                </div>
              </div>
            ))}
          </div>
        )}

        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          open={snackbar.open}
          onClose={closeSnackbar}
        />
        <Footer />
      </div>
    );
  }

  // Fallback for unknown target type
  return (
    <div>
      <div className="mb-24">
        <GoBackButton />
      </div>
      <div className="loading">{t("somethingWentWrong")}</div>
      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={closeSnackbar}
      />
      <Footer />
    </div>
  );
};

export default ReportPostPreview;
