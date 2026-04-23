/**
 * @file UserProfile.tsx
 * @description Public user profile page showing another user's profile and posts.
 * Displays user info (username, bio, join date, stats) and their published posts.
 * Provides interactive features such as following/unfollowing, reporting users,
 * and category-based post filtering.
 */

import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import UserSidebar from "../../../components/user/sidebar/UserSidebar";
import { useThemeLanguage } from "../../../context/ThemeLanguageContext";
import { getTranslation } from "../../../utils/translations";
import { useAuth } from "../../../utils/useAuth";

import api, {
  UserProfile as IUserProfile,
  Post,
  reportsAPI,
} from "../../../services/api";
import "../../../styles/shared.css";
import "./UserProfile.css";
import Snackbar from "../../../components/snackbar/Snackbar";
import { useSnackbar } from "../../../utils/snackbar";
import GoBackButton from "../../../components/buttons/back/GoBackButton";

import PostCard from "../../../components/post/PostCard";
import ShareButton from "../../../components/buttons/share/ShareButton";
import PastUsernames from "../../../components/user/PastUsernames";
import Footer from "../../../components/global/Footer";

// MUI Icon Imports
import RefreshIcon from "@mui/icons-material/Refresh";
import ErrorIcon from "@mui/icons-material/Error";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import WarningIcon from "@mui/icons-material/Warning";
import TranslateIcon from "@mui/icons-material/Translate";
import LanguageIcon from "@mui/icons-material/Language";
import ArticleIcon from "@mui/icons-material/Article";

/**
 * @component UserProfile
 * @description Renders the profile view of a specific user based on the route parameter.
 * Handles data fetching for user metadata and authored posts, while managing
 * social interaction states like following and reporting.
 * * Features:
 * - Publicly accessible profile data
 * - Follow/Unfollow logic with optimistic UI updates
 * - Post visibility filtered by approval status (for external viewers)
 * - Category-specific post browsing
 * * @page
 * @requires useParams - Extracts the user ID from the URL
 * @requires useSnackbar - Standardized toast notifications
 * @requires useThemeLanguage - UI translation and theme context
 * @returns {JSX.Element} The rendered public user profile page
 */
const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useThemeLanguage();
  const { user: currentUser } = useAuth();
  const t = (key: string) => getTranslation(language, key);

  const currentUserId = currentUser?._id;

  /**
   * Sub-component: LoadingSpinner
   * Standardized spinner for data loading states.
   */
  const LoadingSpinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => (
    <div className={`loading-spinner loading-spinner-${size}`}>
      <RefreshIcon
        className="spin"
        sx={{ fontSize: size === "sm" ? 20 : size === "md" ? 32 : 48 }}
      />
    </div>
  );

  /**
   * Sub-component: EmptyState
   * Displayed when no data is available or the user is not found.
   */
  const EmptyState = ({
    icon,
    title,
    message,
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

  /**
   * Sub-component: ConfirmationModal
   * A generic dialog for confirming critical actions (e.g., reporting).
   */
  const ConfirmationModal = ({
    isOpen,
    type,
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    isLoading,
  }: {
    isOpen: boolean;
    type: "warning" | "danger";
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
  }) => {
    if (!isOpen) return null;

    return (
      <div className="modal-overlay" onClick={onCancel}>
        <div
          className={`modal modal-${type}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-close-container">
            <button className="btn-close" onClick={onCancel} aria-label="Close">
              &times;
            </button>
          </div>
          <h2 className="modal-title">{title}</h2>
          <p className="modal-text">{message}</p>
          <div className="modal-actions">
            <button
              className="btn-secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelText}
            </button>
            <button
              className={`btn-${type === "danger" ? "danger" : "primary"}`}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const [user, setUser] = useState<IUserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<
    {
      _id: string;
      name: string;
      translations?: { name: { bg: string; en: string } };
    }[]
  >([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [currentUserFollowing, setCurrentUserFollowing] = useState<string[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();
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
      if (import.meta.env.DEV) {
        console.error("Failed to fetch current user:", error);
      }
      showError(t("failedLoadCurrentUser"));
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await api.get<IUserProfile>(`/users/${id}`);
      setUser(response.data);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Failed to fetch user profile:", error);
      }
      showError(t("userNotFound"));
      setTimeout(() => navigate("/search"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await api.get<Post[]>(`/posts/author/${id}`);
      const filtered =
        currentUserId === id
          ? response.data
          : response.data.filter((post) => post.isApproved !== false);
      setPosts(filtered);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Failed to fetch posts:", error);
      }
      showError(t("failedLoadPosts"));
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get<
        {
          _id: string;
          name: string;
          translations?: { name: { bg: string; en: string } };
        }[]
      >("/categories");
      setCategories(response.data);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Failed to fetch categories:", error);
      }
      showError(t("failedLoadCategories"));
    }
  };

  const handleToggleFollow = async () => {
    if (!id || !currentUserId) return;
    try {
      const wasFollowing = currentUserFollowing.includes(id);
      await api.post("/users/follow", { targetId: id });
      if (wasFollowing) {
        setCurrentUserFollowing((prev) =>
          prev.filter((userId) => userId !== id),
        );
      } else {
        setCurrentUserFollowing((prev) => [...prev, id]);
      }
      showSuccess(wasFollowing ? t("unfollowed") : t("followed"));
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Failed to toggle follow:", error);
      }
      showError(t("actionFailed"));
    }
  };

  const isFollowing = (userId: string) => {
    return currentUserFollowing.includes(userId);
  };

  const getCategoryDisplayName = (category: {
    name?: string;
    translations?: { name?: { bg?: string; en?: string } };
  }) => {
    const categoryName = category?.name || "—";
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
      const defaultReason = t("reportUser");
      await reportsAPI.createReport("user", user._id, defaultReason);
      showSuccess(t("reportSubmitted"));
      setShowReportModal(false);
    } catch (error: any) {
      showError(t("somethingWentWrong"));
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
      },
    );
  };

  const specialCategories = useMemo(() => {
    const order = ["recipe", "question", "flex"];
    return categories
      .filter((cat) => order.includes(cat.name.toLowerCase()))
      .sort(
        (a, b) =>
          order.indexOf(a.name.toLowerCase()) -
          order.indexOf(b.name.toLowerCase()),
      );
  }, [categories]);

  const filteredPosts = useMemo(() => {
    if (!selectedCategoryId) return posts;
    return posts.filter(
      (post) => post.category && post.category._id === selectedCategoryId,
    );
  }, [posts, selectedCategoryId]);

  if (loading) {
    return (
      <div className="user-profile-container">
        <UserSidebar />
        <div className="page-container">
          <div className="loading-centered">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-profile-container">
        <UserSidebar />
        <div className="page-container">
          <EmptyState
            icon={<ErrorIcon sx={{ fontSize: 48 }} />}
            title={t("userNotFound")}
          />
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

          <div className="profile-header">
            <div className="profile-pic-container">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.username}
                  className="profile-pic-image"
                />
              ) : (
                <div className="profile-pic-placeholder">
                  {user.username.startsWith("@")
                    ? user.username[1].toUpperCase()
                    : user.username[0].toUpperCase()}
                </div>
              )}
            </div>

            <div className="profile-info">
              <div className="profile-actions">
                <h1 className="username-heading">@{user.username}</h1>
                <ShareButton
                  url={`${window.location.origin}/users/${user._id}`}
                  title={`@${user.username} - MangoTree Profile`}
                  description={user.bio || ""}
                />
                {currentUserId !== user._id && (
                  <>
                    <button
                      onClick={handleToggleFollow}
                      className={`btn-secondary post-action-btn ${isFollowing(user._id) ? "btn-following" : ""}`}
                      title={
                        isFollowing(user._id) ? t("unfollow") : t("follow")
                      }
                    >
                      {isFollowing(user._id) ? (
                        <PersonRemoveIcon sx={{ fontSize: 18 }} />
                      ) : (
                        <PersonAddIcon sx={{ fontSize: 18 }} />
                      )}
                      <span>
                        {isFollowing(user._id) ? t("unfollow") : t("follow")}
                      </span>
                    </button>
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="btn-secondary post-action-btn btn-report"
                      title={t("reportUsername")}
                    >
                      <WarningIcon sx={{ fontSize: 18 }} />
                      <span>{t("reportUser")}</span>
                    </button>
                  </>
                )}
              </div>
              <p className="member-since">
                {t("memberSince")}: {formatDate(user.createdAt)}
              </p>

              <div className="profile-stats">
                <div className="stat-item">
                  <div className="stat-value">
                    {posts.filter((p) => p.isApproved !== false).length}
                  </div>
                  <div className="stat-label">{t("posts")}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">
                    {user.followers?.length || 0}
                  </div>
                  <div className="stat-label">{t("followers")}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">
                    {user.following?.length || 0}
                  </div>
                  <div className="stat-label">{t("following")}</div>
                </div>
              </div>
            </div>
          </div>

          {user.bio && (
            <div className="mb-6">
              <div className="bio-section-header">
                <h3 className="bio-section-title">{t("bio")}</h3>
                {user.translations?.bio?.[language] &&
                  user.translations.bio[language] !== user.bio && (
                    <button
                      className="btn-translate btn-sm"
                      onClick={() => setShowBioTranslation(!showBioTranslation)}
                    >
                      {showBioTranslation ? (
                        <TranslateIcon sx={{ fontSize: 16 }} />
                      ) : (
                        <LanguageIcon sx={{ fontSize: 16 }} />
                      )}
                      <span>
                        {showBioTranslation
                          ? t("viewOriginal")
                          : t("translate")}
                      </span>
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

          {user.pastUsernames && user.pastUsernames.length > 0 && (
            <PastUsernames
              pastUsernames={user.pastUsernames}
              className="mb-6"
            />
          )}

          <hr className="page-divider" />

          {specialCategories.length > 0 && (
            <div className="category-tabs">
              <button
                onClick={() => setSelectedCategoryId(null)}
                className={`category-tab ${selectedCategoryId === null ? "active" : ""}`}
              >
                {t("all")}
              </button>
              {specialCategories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => setSelectedCategoryId(category._id)}
                  className={`category-tab ${selectedCategoryId === category._id ? "active" : ""}`}
                >
                  {getCategoryDisplayName(category)}
                </button>
              ))}
            </div>
          )}

          {filteredPosts.length === 0 ? (
            <EmptyState
              icon={<ArticleIcon sx={{ fontSize: 48, opacity: 0.5 }} />}
              title={
                selectedCategoryId ? t("noPostsFound") : t("noPostsAvailable")
              }
            />
          ) : (
            <div className="cards-grid posts-grid">
              {filteredPosts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}
        </div>

        <ConfirmationModal
          isOpen={showReportModal}
          type="warning"
          title={t("reportUsername")}
          message={t("confirmReportUser").replace(
            "{username}",
            `@${user?.username || ""}`,
          )}
          confirmText={reportSubmitting ? t("loading") : t("yes")}
          cancelText={t("no")}
          onConfirm={handleReportUser}
          onCancel={() => setShowReportModal(false)}
          isLoading={reportSubmitting}
        />

        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          open={snackbar.open}
          onClose={closeSnackbar}
        />
        <Footer />
      </div>
    </div>
  );
};

export default UserProfile;
