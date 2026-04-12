/**
 * @file ReportUserProfileView.tsx
 * @description Specialized view for previewing a reported user's profile and post history.
 */

import React from "react";
import ArticleIcon from '@mui/icons-material/Article';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PastUsernames from "../../../components/user/PastUsernames";
import { UserProfile, Post as PostType } from "../../../services/api";
import { Category } from "../../../services/admin-api";
import { Language } from "../../../utils/translations";

interface ReportUserProfileViewProps {
  user: UserProfile;
  userPosts: PostType[];
  filteredPosts: PostType[];
  specialCategories: Category[];
  selectedUserCategoryId: string | null;
  language: Language;
  onSelectCategory: (id: string | null) => void;
  getCategoryDisplayName: (name: string) => string;
  t: (key: string) => string;
}

const ReportUserProfileView: React.FC<ReportUserProfileViewProps> = ({
  user,
  userPosts,
  filteredPosts,
  specialCategories,
  selectedUserCategoryId,
  language,
  onSelectCategory,
  getCategoryDisplayName,
  t,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === "bg" ? "bg-BG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="report-user-view">
      <div className="preview-header">
        <div className="preview-avatar">
          {user.profileImage ? (
            <img src={user.profileImage} alt={user.username} />
          ) : (
            <div className="preview-avatar-placeholder">{user.username.charAt(0).toUpperCase()}</div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="preview-username">@{user.username}</h1>
          <p className="preview-member-since">
            {t("memberSince")}: {formatDate(user.createdAt)}
          </p>
          <div className="preview-stats">
            <div className="preview-stat-item">
              <div className="preview-stat-value">{userPosts.length}</div>
              <div className="preview-stat-label">{t("posts")}</div>
            </div>
            <div className="preview-stat-item">
              <div className="preview-stat-value">{user.followers?.length || 0}</div>
              <div className="preview-stat-label">{t("followers")}</div>
            </div>
            <div className="preview-stat-item">
              <div className="preview-stat-value">{user.following?.length || 0}</div>
              <div className="preview-stat-label">{t("following")}</div>
            </div>
          </div>
        </div>
      </div>

      {user.bio && (
        <div className="mb-24">
          <h3 className="preview-bio-title">{t("bio")}</h3>
          <p className="preview-bio-content">{user.bio}</p>
        </div>
      )}

      {user.pastUsernames && user.pastUsernames.length > 0 && (
        <PastUsernames pastUsernames={user.pastUsernames} className="mb-24" />
      )}

      <hr className="preview-divider" />

      {specialCategories.length > 0 && (
        <div className="preview-category-tabs">
          <button
            onClick={() => onSelectCategory(null)}
            className={`preview-category-tab ${selectedUserCategoryId === null ? "active" : ""}`}
          >
            {t("all")}
          </button>
          {specialCategories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => onSelectCategory(cat._id)}
              className={`preview-category-tab ${selectedUserCategoryId === cat._id ? "active" : ""}`}
            >
              {getCategoryDisplayName(cat.name)}
            </button>
          ))}
        </div>
      )}

      {filteredPosts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <ArticleIcon />
          </div>
          <h3 className="empty-state-title">{t("noPostsFound")}</h3>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredPosts.map((post) => (
            <div key={post._id} className="card preview-post-card">
              {post.image && post.image.length > 0 && (
                <div className="preview-post-image-container">
                  <img src={post.image[0]} alt={post.title} />
                </div>
              )}
              <h3 className="preview-post-card-title">{post.title}</h3>
              <div className="preview-post-meta">
                <span>{post.category ? getCategoryDisplayName(post.category.name) : "—"}</span>
                <span>{formatDate(post.createdAt)}</span>
              </div>
              <div className="preview-post-likes">
                <FavoriteIcon className="icon-md" />
                {post.likes?.length || 0}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportUserProfileView;