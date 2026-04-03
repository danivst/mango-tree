import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { getTranslation } from "../utils/translations";
import { Post, postsAPI } from "../services/api";
import "./PostCard.css";

/**
 * @interface PostCardProps
 * @description Props for the PostCard component.
 *
 * @property {Post} post - Complete Post object with all nested data including author, category, translations
 */

interface PostCardProps {
  post: Post;
}

/**
 * @file PostCard.tsx
 * @description Card component for displaying a post preview in feed/grid layouts.
 * Displays post image, title, content preview, tags, author info, category, date, and engagement stats.
 * Supports bilingual content with one-click translation between English and Bulgarian.
 * Handles posts pending approval with visual badge.
 *
 * Features:
 * - Click navigation to full post detail page
 * - Click on author name/avatar navigates to author profile
 * - Automatic language detection based on text content
 * - Translation toggle with caching and loading states
 * - Responsive image display
 * - Approval status badge for pending posts
 * - Engagement metrics (likes, comments)
 *
 * @component
 * @requires useState - React state for translation UI state
 * @requires useNavigate - React Router navigation handler
 * @requires useThemeLanguage - Context for current UI language
 * @requires postsAPI - API service for post operations
 */

/**
 * Detects the primary language of a text string using Cyrillic character detection.
 * Used to determine if translation is needed based on user's UI language.
 *
 * @param {string} text - Text to analyze for language detection
 * @returns {'en' | 'bg'} - Detected language code (English if no Cyrillic found)
 */
const detectLanguage = (text: string): 'en' | 'bg' => {
  if (!text) return 'en';
  if (/[а-яА-Я]/.test(text)) {
    return 'bg';
  }
  return 'en';
};

const PostCard = ({ post }: PostCardProps) => {
  const { language } = useThemeLanguage();
  const navigate = useNavigate();
  const t = (key: string) => getTranslation(language, key);

  /**
   * Formats a date string according to current UI language locale.
   * Uses 'bg-BG' for Bulgarian, 'en-US' for English.
   *
   * @param {string} dateString - ISO date string to format
   * @returns {string} - Formatted localized date string (e.g., "Mar 15, 2025")
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      language === "bg" ? "bg-BG" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  /**
   * Truncates content to specified maximum length with ellipsis.
   * Preserves words by trimming to last complete word before limit.
   *
   * @param {string} content - Full content text
   * @param {number} [maxLength=150] - Maximum length before truncation
   * @returns {string} - Truncated content with "..." if needed
   */
  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + "...";
  };

  /**
   * Navigates to the post detail page when card is clicked.
   * Uses post._id to construct route path.
   */
  const handlePostClick = () => {
    navigate(`/posts/${post._id}`);
  };

  /**
   * Handles click on author section (avatar or username).
   * Stops event propagation to prevent card click navigation.
   * Navigates to author's profile page.
   *
   * @param {React.MouseEvent} e - Click event
   */
  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/users/${post.authorId._id}`);
  };

  // Translation states
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationCache, setTranslationCache] = useState<{ title: string; content: string; tags?: string[] } | null>(null);
  const [translating, setTranslating] = useState(false);

  /**
   * Detects language of post title to determine if translation button should show.
   * Translation button appears when post language differs from UI language.
   */
  const postLanguage = detectLanguage(post.title);
  const shouldShowTranslateButton = postLanguage !== language;

  /**
   * Handles translation toggle and fetch logic.
   *
   * Behavior:
   * - If showing translation -> hide it (toggle off)
   * - If cached translation exists -> show it
   * - If backend has pre-stored translation -> use it
   * - Otherwise -> fetch translation from backend API
   *
   * Sets appropriate loading states and error handling.
   */
  const handleTranslate = async () => {
    if (showTranslation) {
      setShowTranslation(false);
      return;
    }

    if (translationCache) {
      setShowTranslation(true);
      return;
    }

    // If stored translation exists for UI language (including tags), use it directly
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
      console.error("Translation failed:", error);
    } finally {
      setTranslating(false);
    }
  };

  /**
   * Derived display values that switch between original and translated content.
   * Uses cascade: translationCache (fetched) -> post.translations (stored) -> original
   */
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
    <div className="post-card card" onClick={handlePostClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handlePostClick(); }}>
      {/* Post Image */}
      {post.image && post.image.length > 0 && (
        <div className="post-card-image-container">
          <img
            src={post.image[0]}
            alt={displayTitle}
            className="post-card-image"
          />
        </div>
      )}

      {/* Title */}
      <h3 className="post-card-title">
        {displayTitle}
      </h3>

      {/* Content Preview */}
      <p className="post-card-content">
        {truncateContent(displayContent)}
      </p>

      {/* Tags */}
      {displayTags && displayTags.length > 0 && (
        <div className="post-card-tags">
          {displayTags.slice(0, 5).map((tag: string, idx: number) => (
            <span
              key={idx}
              className="post-card-tag"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Approval Status Badge */}
      {post.isApproved === false && (
        <div className="post-card-approval-badge">
          {t("waitingForApproval")}
        </div>
      )}

      {/* Action Buttons Row */}
      {shouldShowTranslateButton && (
        <div className="post-card-actions">
          {/* Translate Button */}
          {shouldShowTranslateButton && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTranslate();
              }}
              disabled={translating}
              className="post-card-translate-button"
            >
              {translating ? (
                <span className="material-icons spin">refresh</span>
              ) : (
                <span className="material-icons">
                  {showTranslation ? "translate" : "language"}
                </span>
              )}
              <span>{showTranslation ? t("viewOriginal") : t("translate")}</span>
            </button>
          )}
        </div>
      )}

      {/* Author & Category & Date Row */}
      <div className="post-card-meta">
        {/* Author Avatar */}
        <div className="post-card-author" onClick={handleAuthorClick}>
          {post.authorId.profileImage ? (
            <img
              src={post.authorId.profileImage}
              alt={post.authorId.username}
              className="post-card-author-avatar"
            />
          ) : (
            <div className="post-card-author-fallback">
              {post.authorId.username.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="post-card-author-name">
            @{post.authorId.username}
          </span>
        </div>

        {/* Dot separator */}
        <span className="post-card-separator">•</span>

        {/* Category */}
        {post.category && (
          <span
            className="post-card-category"
            title={post.category.translations?.name?.[language] || post.category.name}
          >
            {post.category.translations?.name?.[language] || post.category.name}
          </span>
        )}

        {/* Dot separator */}
        <span className="post-card-separator">•</span>

        {/* Date */}
        <span className="post-card-date">
          {formatDate(post.createdAt)}
        </span>
      </div>

      {/* Stats: Likes and Comments */}
      <div className="post-card-stats">
        {/* Likes */}
        <div className="post-card-stat">
          <span className="material-icons">favorite</span>
          {post.likes?.length || 0}
        </div>

        {/* Comments */}
        <div className="post-card-stat">
          <span className="material-icons">chat_bubble_outline</span>
          {post.commentCount || 0}
        </div>
      </div>
    </div>
  );
};

export default PostCard;
