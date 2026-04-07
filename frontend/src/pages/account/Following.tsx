import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation } from "../../utils/translations";
import UserSidebar from "../../components/UserSidebar";
import Snackbar from "../../components/Snackbar";
import GoBackButton from "../../components/GoBackButton";
import { getCurrentUserId } from "../../utils/auth";
import { useSnackbar } from "../../utils/snackbar";
import "../../styles/shared.css";
import "./Following.css";
import Footer from "../../components/Footer";

/**
 * @interface User
 * @description User data structure for account pages.
 * Minimal subset of User model needed for following/followers display.
 *
 * @property {string} _id - User's unique identifier
 * @property {string} username - Display username
 * @property {string} email - Email address (not displayed)
 * @property {string} role - User's role
 * @property {string} createdAt - Account creation timestamp
 * @property {string} [profileImage] - Optional profile picture URL
 * @property {string} [bio] - Optional user bio
 * @property {string[]} followers - Array of user IDs who follow this user
 * @property {string[]} following - Array of user IDs this user follows
 */

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  profileImage?: string;
  bio?: string;
  followers: string[];
  following: string[];
}

/**
 * @file Following.tsx
 * @description User account page showing the list of users the current user follows.
 * Displays followees in a grid with avatar, username, join date, and follow/unfollow button.
 * Allows unfollowing directly from this page.
 *
 * Route: /account/following
 * Access: Authenticated users only
 * Components: UserSidebar, GoBackButton, Snackbar
 *
 * @page
 * @requires useNavigate - Navigation to user profiles
 * @requires useThemeLanguage - Translation and language detection
 * @requires api - User API calls
 */

const Following = () => {
  const navigate = useNavigate();
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);
  const currentUserId = getCurrentUserId();
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Effect: fetch following list when currentUserId becomes available.
   * Runs once on mount if user is authenticated.
   */
  useEffect(() => {
    if (currentUserId) {
      fetchFollowing();
    }
  }, [currentUserId]);

  /**
   * Fetches the list of users that the current user follows.
   * Sorts alphabetically by username for consistent display.
   * Sets loading state and handles errors with snackbar.
   */
  const fetchFollowing = async () => {
    try {
      setLoading(true);
      const response = await api.get<User[]>(`/users/${currentUserId}/following`);
      const sorted = response.data.sort((a, b) =>
        a.username.localeCompare(b.username)
      );
      setFollowing(sorted);
    } catch (error: any) {
      console.error("Failed to fetch following:", error);
      showError(t("failedLoadUsers"));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles follow/unfollow toggle on a user.
   * Optimistically updates UI by refetching list.
   * Shows appropriate success message.
   *
   * @param {string} targetId - User ID to follow/unfollow
   */
  const handleToggleFollow = async (targetId: string) => {
    try {
      const targetUser = following.find(u => u._id === targetId);
      const wasFollowing = targetUser?.followers.includes(currentUserId!);
      await api.post("/users/follow", { targetId });
      // Refresh the list to reflect changes
      await fetchFollowing();
      showSuccess(wasFollowing ? t("unfollowed") : t("followed"));
    } catch (error: any) {
      console.error("Failed to toggle follow:", error);
      showError(t("actionFailed"));
    }
  };

  /**
   * Navigates to user's profile page when username or avatar is clicked.
   * Stops propagation to avoid triggering parent click handlers if any.
   *
   * @param {string} userId - ID of user to view
   */
  const handleUserClick = (userId: string) => {
    navigate(`/users/${userId}`);
  };

  /**
   * Formats date string according to current language locale.
   * Used for "member since" date display.
   *
   * @param {string} dateString - ISO date string
   * @returns {string} - Localized formatted date
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
   * Checks if current user is following the given user.
   * Used to determine follow button state (follow vs unfollow).
   *
   * @param {User} user - User to check follow status against
   * @returns {boolean} - True if current user follows this user
   */
  const isFollowing = (user: User) => {
    return currentUserId && user.followers.includes(currentUserId);
  };

  // Loading state: show spinner/message
  if (loading) {
    return (
      <div className="following-container">
        <UserSidebar />
        <div className="page-container">
          <div className="loading">{t("loading")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="following-container">
      <UserSidebar />
      <div className="page-container">
        <div className="d-flex align-items-center gap-3 mb-6">
          <GoBackButton />
          <h1 className="page-title" style={{ margin: 0 }}>{t("following")}</h1>
        </div>

        {/* Empty state: no users followed */}
        {following.length === 0 ? (
          <div className="empty-state">
            <span className="material-icons">person_off</span>
            <p className="empty-state-message">{t("noFollowingFound")}</p>
          </div>
        ) : (
          // Grid of followed users
          <div className="cards-grid">
            {following.map((user) => (
              <div key={user._id} className="card user-card">
                {/* Profile Image */}
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.username}
                    className="avatar avatar-lg"
                    onClick={() => handleUserClick(user._id)}
                  />
                ) : (
                  <div
                    className="avatar-fallback avatar-fallback-lg"
                    onClick={() => handleUserClick(user._id)}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* User Info */}
                <div className="user-card-info">
                  <h3
                    className="user-card-username"
                    onClick={() => handleUserClick(user._id)}
                  >
                    @{user.username}
                  </h3>
                  <p className="user-card-meta">
                    {t("memberSince")}: {formatDate(user.createdAt)}
                  </p>
                </div>

                {/* Follow/Unfollow Button */}
                <button
                  className={`btn-secondary btn-sm icon-btn ${isFollowing(user) ? "btn-following" : "btn-follow"}`}
                  onClick={() => handleToggleFollow(user._id)}
                >
                  <span className="material-icons text-lg">
                    {isFollowing(user) ? "person_remove" : "person_add"}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Notification snackbar */}
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

export default Following;
