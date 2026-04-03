import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import UserSidebar from "../components/UserSidebar";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { getTranslation } from "../utils/translations";
import api, { UserProfile as IUserProfile, Post, reportsAPI } from "../services/api";
import "../styles/shared.css";
import "./UserProfile.css";
import Snackbar from "../components/Snackbar";
import GoBackButton from "../components/GoBackButton";
import { getToken } from "../utils/auth";

/**
 * @file UserProfile.tsx
 * @description Public user profile page showing another user's profile and posts.
 * Displays user info (username, bio, join date, stats) and their published posts.
 * Authenticated users can follow/unfollow, report posts, and navigate to user's full post list.
 *
 * Features:
 * - View any user's public profile (by user ID in URL)
 * - Follow/unfollow toggle (if authenticated and not self)
 * - Report post button with modal
 * - View user's posts (filterable by category)
 * - Stats display: posts count, followers, following
 * - Post approval status badge (if pending)
 * - Translation support for bio (if stored)
 *
 * Access:
 * - Public: Anyone can view user profiles (even without login)
 * - Authenticated required for follow/report actions
 *
 * State:
 * - Profile data fetched via GET /users/:id
 * - Posts fetched via GET /posts/author/:userId
 * - Follow state managed locally (optimistic UI, synced via context on change)
 * - Report modal state with reason selection
 *
 * @page
 * @requires useState - Profile data, posts, follow state, report modal, loading, snackbar
 * @requires useEffect - Fetch profile and posts on mount (when userId param changes)
 * @requires useParams - Get user ID from route /users/:id
 * @requires useNavigate - Navigate to full post list, author profile, etc.
 * @requires useThemeLanguage - Current language for translations
 * @requires useNotifications - For refreshing unread count after some actions (not currently used)
 * @requires usersAPI - Fetch user profile data (follow/unfollow, get current user for self check)
 * @requires postsAPI - Fetch user's posts
 * @requires reportsAPI - Submit post reports
 * @requires Snackbar - Feedback (follow, report, error)
 * @requires GoBackButton - Navigate back to previous page
 * @requires UserSidebar - Navigation sidebar (only shown if authenticated)
 */

// Using IUserProfile directly - it already has followers and following as string[]

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);
  const currentUserId = (() => {
    const token = getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || null;
    } catch {
      return null;
    }
  })();

  const [user, setUser] = useState<IUserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<{ _id: string; name: string; translations?: { name: { bg: string; en: string; } } }[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [currentUserFollowing, setCurrentUserFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: "success" | "error";
  }>({ open: false, message: "", type: "success" });
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [showBioTranslation, setShowBioTranslation] = useState(false);

  useEffect(() => {
    if (id) {
      fetchUserProfile();
      fetchCategories();
      fetchPosts();
      fetchCurrentUser();
    }
  }, [id]);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get<IUserProfile>("/users/me");
      setCurrentUserFollowing(response.data.following || []);
    } catch (error: any) {
      console.error("Failed to fetch current user:", error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await api.get<IUserProfile>(`/users/${id}`);
      setUser(response.data);
    } catch (error: any) {
      console.error("Failed to fetch user profile:", error);
      setSnackbar({
        open: true,
        message: t("userNotFound"),
        type: "error",
      });
      setTimeout(() => navigate("/search"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await api.get<Post[]>(`/posts/author/${id}`);
      // If viewing another user's profile, hide unapproved posts
      const filtered = currentUserId === id
        ? response.data
        : response.data.filter(post => post.isApproved !== false);
      setPosts(filtered);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get<{ _id: string; name: string; translations?: { name: { bg: string; en: string; } } }[]>("/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleToggleFollow = async () => {
    if (!id || !currentUserId) return;
    try {
      const wasFollowing = currentUserFollowing.includes(id);
      await api.post("/users/follow", { targetId: id });
      if (wasFollowing) {
        setCurrentUserFollowing(prev => prev.filter(userId => userId !== id));
      } else {
        setCurrentUserFollowing(prev => [...prev, id]);
      }
      setSnackbar({
        open: true,
        message: wasFollowing ? t("unfollowed") : t("followed"),
        type: "success",
      });
    } catch (error: any) {
      console.error("Failed to toggle follow:", error);
      setSnackbar({
        open: true,
        message: t("actionFailed"),
        type: "error",
      });
    }
  };

  const isFollowing = (userId: string) => {
    return currentUserFollowing.includes(userId);
  };

  const getCategoryDisplayName = (category: { name?: string; translations?: { name?: { bg?: string; en?: string } } }) => {
    const categoryName = category?.name || '—';
    const translated = t(categoryName.toLowerCase());
    if (translated && translated !== categoryName.toLowerCase()) {
      return translated;
    }
    return categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
  };

  const handleReportUser = async () => {
    if (!user) return;

    setReportSubmitting(true);
    try {
      // Send a generic report reason
      const defaultReason = t("reportUser");
      await reportsAPI.createReport('user', user._id, defaultReason);
      setSnackbar({
        open: true,
        message: t("reportSubmitted"),
        type: "success",
      });
      setShowReportModal(false);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t("somethingWentWrong"),
        type: "error",
      });
    } finally {
      setReportSubmitting(false);
    }
  };


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

  // Derive the three special categories in specific order: recipe, question, flex
  const specialCategories = useMemo(() => {
    const lowerNames = ["recipe", "flex", "question"];
    const filtered = categories.filter((cat) => lowerNames.includes(cat.name.toLowerCase()));
    // Sort according to desired order: recipe -> question -> flex
    const order = ["recipe", "question", "flex"];
    return filtered.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      return order.indexOf(aName) - order.indexOf(bName);
    });
  }, [categories]);

  // No default category selection - "All" (null) shows all posts

  // Filter posts by selected category
  const filteredPosts = useMemo(() => {
    if (!selectedCategoryId) return posts; // Show all posts when no category selected (All button)
    return posts.filter((post) => post.category && post.category._id === selectedCategoryId);
  }, [posts, selectedCategoryId]);

  if (loading) {
    return (
      <div className="user-profile-container">
        <UserSidebar />
        <div className="page-container">
          <div className="loading">{t("loading")}</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-profile-container">
        <UserSidebar />
        <div className="page-container">
          <div className="loading">{t("userNotFound")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      <UserSidebar />
      <div className="page-container">
        <div className="profile-content">
          <div className="mb-6">
            <GoBackButton />
          </div>
          {/* Profile Section */}
          <div className="profile-header">
            {/* Profile Picture */}
            <div className="relative">
              <div className="profile-pic-container">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.username}
                    className="profile-pic-image"
                  />
                ) : (
                  <div className="profile-pic-placeholder">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="profile-info">
              <div className="profile-actions">
                <h1 className="username-heading">
                  @{user.username}
                </h1>
                {/* Follow/Unfollow Button (only if not viewing own profile) */}
                {currentUserId !== user._id && (
                  <button
                    onClick={handleToggleFollow}
                    className={`btn-secondary post-action-btn ${isFollowing(user._id) ? 'btn-following' : ''}`}
                    title={isFollowing(user._id) ? t("unfollow") : t("follow")}
                  >
                    <span className="material-icons icon-sm">
                      {isFollowing(user._id) ? "person_remove" : "person_add"}
                    </span>
                    <span>{isFollowing(user._id) ? t("unfollow") : t("follow")}</span>
                  </button>
                )}
                {/* Report User Button (only if not viewing own profile) */}
                {currentUserId !== user._id && (
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="btn-secondary post-action-btn btn-report"
                    title={t("reportUsername")}
                  >
                    <span className="material-icons icon-sm">warning</span>
                    <span>{t("reportUser")}</span>
                  </button>
                )}
              </div>
              <p className="member-since">
                {t("memberSince")}: {formatDate(user.createdAt)}
              </p>

              {/* Stats */}
              <div className="profile-stats">
                <div className="stat-item">
                  <div className="stat-value">
                    {posts.filter(p => p.isApproved !== false).length}
                  </div>
                  <div className="stat-label">
                    {t("posts")}
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">
                    {user.followers?.length || 0}
                  </div>
                  <div className="stat-label">
                    {t("followers")}
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">
                    {user.following?.length || 0}
                  </div>
                  <div className="stat-label">
                    {t("following")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="mb-6">
              <div className="bio-section-header">
                <h3 className="bio-section-title">
                  {t("bio")}
                </h3>
                {/* Translate Button - show only if bio is in different language than app */}
                {user?.bio && user.translations?.bio?.[language] && user.translations.bio[language] !== user.bio && (
                  <button
                    onClick={() => setShowBioTranslation(!showBioTranslation)}
                    className="btn-translate"
                    title={showBioTranslation ? t("viewOriginal") : t("translate")}
                  >
                    <span className="material-icons icon-sm">
                      {showBioTranslation ? "translate" : "language"}
                    </span>
                    {showBioTranslation ? t("viewOriginal") : t("translate")}
                  </button>
                )}
              </div>
              <p className="bio-content">
                {showBioTranslation && user.translations?.bio?.[language]
                  ? user.translations.bio[language]
                  : user.bio}
              </p>
            </div>
          )}

          {/* Divider */}
          <hr className="page-divider" />

          {/* Category Tabs */}
          {specialCategories.length > 0 && (
            <div className="category-tabs">
              <button
                onClick={() => setSelectedCategoryId(null)}
                className={`category-tab ${selectedCategoryId === null ? 'active' : ''}`}
              >
                {t("all")}
              </button>
              {specialCategories
                .filter((category) => category._id) // Ensure category has an ID
                .map((category) => (
                <button
                  key={category._id}
                  onClick={() => setSelectedCategoryId(category._id)}
                  className={`category-tab ${selectedCategoryId === category._id ? 'active' : ''}`}
                >
                  {getCategoryDisplayName(category)}
                </button>
              ))}
            </div>
          )}

          {/* Posts Grid */}
          {filteredPosts.length === 0 ? (
            <div className="loading loading-centered">
              {selectedCategoryId
                ? t("noPostsFound")
                : t("selectCategory")}
            </div>
          ) : (
            <div className="cards-grid posts-grid">
              {filteredPosts.map((post) => (
                <div key={post._id} className="card post-card">
                  {/* Post Image if exists */}
                  {post.image && post.image.length > 0 && (
                    <div className="post-card-image-container">
                      <img
                        src={post.image[0]}
                        alt={post.title}
                        className="post-card-image"
                      />
                    </div>
                  )}
                  {/* Post Title */}
                  <h3 className="post-card-title" onClick={() => navigate(`/posts/${post._id}`)}>
                    {post.title}
                  </h3>
                  {/* Category & Date */}
                  <div className="post-card-meta">
                    <span>{post.category ? getCategoryDisplayName(post.category) : '—'}</span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                  {/* Likes count */}
                  <div className="post-likes">
                    <span className="material-icons icon-md">favorite</span>
                    {post.likes.length}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Report User Confirmation Modal */}
        {showReportModal && (
          <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
            <div className="modal modal-warning" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">
                {t("reportUsername")}
              </h2>
              <p className="modal-text">
                {t("confirmReportUser").replace("{username}", `@${user?.username || ''}`)}
              </p>
              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setShowReportModal(false)}
                  disabled={reportSubmitting}
                >
                  {t("no")}
                </button>
                <button
                  className="btn-primary"
                  onClick={handleReportUser}
                  disabled={reportSubmitting}
                >
                  {reportSubmitting ? t("loading") : t("yes")}
                </button>
              </div>
            </div>
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
      </div>
    </div>
  );
};

export default UserProfile;
