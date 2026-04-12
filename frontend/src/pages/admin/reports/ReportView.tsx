/**
 * @file ReportPostView.tsx
 * @description Specialized view for previewing a reported post.
 * Features: Image carousel, translation toggles, and metadata display.
 */

import React from "react";
import RefreshIcon from '@mui/icons-material/Refresh';
import TranslateIcon from '@mui/icons-material/Translate';
import LanguageIcon from '@mui/icons-material/Language';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Post as PostType } from "../../../services/api";
import { Language } from "../../../utils/translations";

interface ReportPostViewProps {
  post: PostType;
  language: Language;
  t: (key: string) => string;
  showTranslation: boolean;
  translating: boolean;
  translationCache: any;
  currentImageIndex: number;
  onTranslate: () => void;
  onNextImage: () => void;
  onPrevImage: () => void;
  onSetImageIndex: (index: number) => void;
  getCategoryDisplayName: (name: string) => string;
  detectLanguage: (text: string) => "en" | "bg";
}

const ReportPostView: React.FC<ReportPostViewProps> = ({
  post, language, t, showTranslation, translating, translationCache,
  currentImageIndex, onTranslate, onNextImage, onPrevImage, onSetImageIndex,
  getCategoryDisplayName, detectLanguage
}) => {
  const postLanguage = detectLanguage(post.title);
  const isPostInUserLanguage = postLanguage === language;
  
  const displayTitle = showTranslation
    ? translationCache?.title || (post.translations?.title as Record<string, string>)?.[language] || post.title
    : post.title;

  const displayContent = showTranslation
    ? translationCache?.content || (post.translations?.content as Record<string, string>)?.[language] || post.content
    : post.content;

  const displayTags = showTranslation
    ? translationCache?.tags || (post.translations?.tags as Record<string, string[]>)?.[language] || post.tags
    : post.tags;

  return (
    <div className="report-post-view">
      <div className="post-preview-header">
        <h1 className="page-container-title">{displayTitle}</h1>
        {!isPostInUserLanguage && (
          <button onClick={onTranslate} disabled={translating} className="btn-translate">
            {translating ? <RefreshIcon className="spin icon-sm" /> : 
             showTranslation ? <TranslateIcon className="icon-sm" /> : <LanguageIcon className="icon-sm" />}
            <span>{showTranslation ? t("viewOriginal") : t("translate")}</span>
          </button>
        )}
        {!post.isApproved && <div className="approval-badge">{t("waitingForApproval")}</div>}
      </div>

      <div className="author-info mb-24">
        {post.authorId?.profileImage ? (
          <img src={post.authorId.profileImage} alt={post.authorId.username || "author"} className="author-avatar" />
        ) : (
          <div className="author-avatar-fallback">
            {post.authorId?.username?.charAt(0).toUpperCase() || "?"}
          </div>
        )}
        <span className="author-username">@{post.authorId?.username || t("anonymous")}</span>
      </div>

      {post.category && (
        <span className={`category-badge ${["flex", "recipe", "question"].includes(post.category.name.toLowerCase()) ? post.category.name.toLowerCase() : "default"}`}>
          {getCategoryDisplayName(post.category.name)}
        </span>
      )}

      {post.image && post.image.length > 0 && (
        <div className="image-carousel mb-24">
          <img src={post.image[currentImageIndex]} alt="Post content" />
          {post.image.length > 1 && (
            <>
              <button onClick={onPrevImage} className="carousel-nav-btn prev"><ChevronLeftIcon /></button>
              <button onClick={onNextImage} className="carousel-nav-btn next"><ChevronRightIcon /></button>
              <div className="carousel-indicators">
                {post.image.map((_, i) => (
                  <button key={i} onClick={() => onSetImageIndex(i)} className={`carousel-indicator ${i === currentImageIndex ? "active" : ""}`} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {displayTags && displayTags.length > 0 && (
        <div className="tags-container">
          {displayTags.map((tag: string, i: number) => <span key={i} className="tag-pill">#{tag}</span>)}
        </div>
      )}

      <div className="mb-32">
        <p className="description-text">{displayContent}</p>
      </div>
    </div>
  );
};

export default ReportPostView;