/**
 * @file PostAuthorActions.tsx
 * @description Component that renders author metadata and post interaction controls.
 */

import React from "react";
import { getCategoryDisplayName, getCategoryStyle } from "../../utils/display";

/**
 * @component
 * @description Renders author metadata plus follow, like, report, edit, and delete actions.
 * @requires getCategoryDisplayName - Formats category names for display.
 * @requires getCategoryStyle - Returns category-specific styling.
 * @param {PostAuthorActionsProps} props - Component props.
 */
interface PostAuthorActionsProps {
  post: any;
  currentUserId: string | null;
  isFollowing: boolean;
  isLiked: boolean;
  likesCount: number;
  actionLoading: { like: boolean; follow: boolean; report: boolean; delete: boolean };
  handleFollow: () => void;
  handleLike: () => void;
  handleDeletePostClick: () => void;
  onEdit: () => void;
  setReportModalOpen: (open: boolean) => void;
  navigate: (path: string) => void;
  t: (key: string) => string;
}

const PostAuthorActions: React.FC<PostAuthorActionsProps> = ({
  post,
  currentUserId,
  isFollowing,
  isLiked,
  likesCount,
  actionLoading,
  handleFollow,
  handleLike,
  handleDeletePostClick,
  onEdit,
  setReportModalOpen,
  navigate,
  t,
}) => {
  return (
    <div className="mb-6">
      <div className="author-container">
        <div className="author-link" onClick={() => navigate(`/users/${post.authorId._id}`)}>
          {post.authorId.profileImage ? (
            <img src={post.authorId.profileImage} alt={post.authorId.username} className="author-avatar" />
          ) : (
            <div className="author-avatar-placeholder">
              {post.authorId.username.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="author-username">@{post.authorId.username}</span>
        </div>
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
          >
            {actionLoading.follow ? (
              <span className="material-icons spin text-base">refresh</span>
            ) : (
              <>
                <span className="material-icons text-lg">{isFollowing ? "person_remove" : "person_add"}</span>
                {isFollowing ? t("unfollow") : t("follow")}
              </>
            )}
          </button>
        )}
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
        >
          {actionLoading.like ? (
            <span className="material-icons spin text-base">refresh</span>
          ) : (
            <span className="material-icons text-lg">{isLiked ? "favorite" : "favorite_border"}</span>
          )}
          <span>{likesCount} {likesCount === 1 ? t("likeCount") : t("likes")}</span>
        </button>
        {currentUserId && currentUserId === post.authorId._id && (
        <button 
            onClick={onEdit} 
            className="btn-secondary post-action-btn btn-edit"
        >
            <span className="material-icons text-base">edit</span>
            <span>{t("edit")}</span>
        </button>
        )}
        {currentUserId && currentUserId === post.authorId._id && (
          <button onClick={handleDeletePostClick} disabled={actionLoading.delete} className="btn-secondary post-action-btn btn-delete">
            {actionLoading.delete ? <span className="material-icons spin text-base">refresh</span> : <span className="material-icons text-base">delete</span>}
            <span>{t("deletePost")}</span>
          </button>
        )}
        {currentUserId && currentUserId !== post.authorId._id && (
          <button onClick={() => setReportModalOpen(true)} disabled={actionLoading.report} className="btn-secondary post-action-btn btn-report">
            {actionLoading.report ? <span className="material-icons spin text-base">refresh</span> : <span className="material-icons text-lg">warning</span>}
            <span>{t("report")}</span>
          </button>
        )}
      </div>
      <span
        className="category-badge"
        style={{
          borderColor: getCategoryStyle(post.category?.name)?.borderColor || "var(--theme-text)",
          backgroundColor: getCategoryStyle(post.category?.name)?.backgroundColor || "transparent",
          color: getCategoryStyle(post.category?.name)?.color || "var(--theme-text)",
        }}
      >
        {getCategoryDisplayName(post.category?.name || "", t)}
      </span>
    </div>
  );
};

export default PostAuthorActions;
