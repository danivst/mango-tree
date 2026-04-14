/**
 * @file PostCard.tsx
 * @description Card component for displaying a post preview in feed/grid layouts.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation } from "../../utils/translations";
import { Post, postsAPI } from "../../services/api";
import "./PostCard.css";
import { getCategoryDisplayName } from "../../utils/display";

import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import TranslateIcon from '@mui/icons-material/Translate';
import LanguageIcon from '@mui/icons-material/Language';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * @interface PostCardProps
 * @property {Post} post - Complete Post object with nested author, category, and tags.
 */
interface PostCardProps {
  post: Post;
}

/**
 * Detects the primary language of a text string.
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

  // Translation states
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationCache, setTranslationCache] = useState<{ title: string; content: string; tags?: string[] } | null>(null);
  const [translating, setTranslating] = useState(false);

  /**
   * Formats a date string according to current UI language locale.
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

  const isEdited = () => {
    if (!post.updatedAt || !post.createdAt) return false;
    
    // Convert to numbers (milliseconds)
    const createdTime = new Date(post.createdAt).getTime();
    const updatedTime = new Date(post.updatedAt).getTime();
    
    // Only show "Edited" if the difference is more than 60 seconds
    // This ignores minor differences caused by database initialization
    return (updatedTime - createdTime) > 60000; 
  };

  /**
   * Truncates content to specified maximum length.
   */
  const truncateContent = (content: string, maxLength: number = 150) => {
    if (!content) return "";
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + "...";
  };

  /**
   * Handles translation toggle and fetch logic.
   * Aligned with backend translatePost controller.
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

    // Check if translations already exist in the post object
    if (
      post.translations?.title?.[language] &&
      post.translations?.content?.[language]
    ) {
      setTranslationCache({
        title: post.translations.title[language],
        content: post.translations.content[language],
        // Map populated tags to their translated names if available
        tags: post.tags?.map((tag: any) => 
          tag.translations?.[language] || tag.name
        ),
      });
      setShowTranslation(true);
      return;
    }

    setTranslating(true);
    try {
      // API call to post-interaction-controller.ts -> translatePost
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

  // Derived display values
  const displayTitle = showTranslation
    ? (translationCache?.title || post.translations?.title?.[language] || post.title)
    : post.title;

  const displayContent = showTranslation
    ? (translationCache?.content || post.translations?.content?.[language] || post.content)
    : post.content;

  // Handle Tag objects: show translated string array if translating, 
  // otherwise map through populated Tag objects to get names.
  const displayTags = showTranslation && translationCache?.tags
    ? translationCache.tags
    : post.tags?.map((tag: any) => (typeof tag === 'object' ? tag.name : tag));

  const postLanguage = detectLanguage(post.title);
  const shouldShowTranslateButton = postLanguage !== language;

  return (
    <div 
      className="post-card card" 
      onClick={() => navigate(`/posts/${post._id}`)} 
      role="button" 
      tabIndex={0} 
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/posts/${post._id}`); }}
    >
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

      {/* Tags - Populated from Tag model */}
      {displayTags && displayTags.length > 0 && (
        <div className="post-card-tags">
          {displayTags.slice(0, 5).map((tag: string, idx: number) => (
            <span key={idx} className="post-card-tag">
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
      <div className="post-card-actions">
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
              <RefreshIcon sx={{ fontSize: 18 }} className="spin" />
            ) : (
              showTranslation ? <TranslateIcon sx={{ fontSize: 18 }} /> : <LanguageIcon sx={{ fontSize: 18 }} />
            )}
            <span>{showTranslation ? t("viewOriginal") : t("translate")}</span>
          </button>
        )}
      </div>

      {/* Author & Meta Data */}
      <div className="post-card-meta">
        <div 
          className="post-card-author" 
          onClick={(e) => { e.stopPropagation(); navigate(`/users/${post.authorId._id}`); }}
        >
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

        <span className="post-card-separator">•</span>

        {post.category && (
          <span className="post-card-category">
            {getCategoryDisplayName(post.category?.name || "", t)}
          </span>
        )}

        <span className="post-card-separator">•</span>

        <span className="post-card-date">
          {formatDate(post.createdAt)} 
          {isEdited()
            ? ` • ${t("editedOn")} ${formatDate(post.updatedAt)}` 
            : ""}
        </span>
      </div>

      {/* Engagement Stats */}
      <div className="post-card-stats">
        <div className="post-card-stat">
          <FavoriteIcon sx={{ fontSize: 18, mr: 0.5 }} />
          {post.likes?.length || 0}
        </div>

        <div className="post-card-stat">
          <ChatBubbleOutlineIcon sx={{ fontSize: 18, mr: 0.5 }} />
          {post.commentCount || 0}
        </div>
      </div>
    </div>
  );
};

export default PostCard;