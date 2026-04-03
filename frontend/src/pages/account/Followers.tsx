import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation } from "../../utils/translations";
import UserSidebar from "../../components/UserSidebar";
import Snackbar from "../../components/Snackbar";
import GoBackButton from "../../components/GoBackButton";
import { getToken } from "../../utils/auth";
import "../../styles/shared.css";
import "./Followers.css";

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
 * @file Followers.tsx
 * @description User account page showing the list of users who follow the current user.
 * Displays followers in a grid with avatar, username, join date, and action buttons.
 * Allows unfollowing and removing followers directly from this page.
 *
 * Features:
 * - View all followers
 * - Unfollow followers (if currently following them back)
 * - Remove followers (forcefully delete follower relationship)
 * - Modal confirmation for remove action
 * - Real-time UI updates with refetch after actions
 *
 * Route: /account/followers
 * Access: Authenticated users only
 * Components: UserSidebar, GoBackButton, Snackbar
 *
 * @page
 * @requires useState, useEffect - React hooks for state and lifecycle
 * @requires useNavigate - Navigation to user profiles
 * @requires useThemeLanguage - Translation and language detection
 * @requires api - User API calls for followers, follow/unfollow, remove
 */

const Followers = () => {
  const navigate = useNavigate();
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);

  /**
   * Extracts current user's ID from JWT token.
   * Uses lazy initialization to parse token only once on mount.
   * Returns null if no token or parsing fails.
   */
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

  const [followers, setFollowers] = useState<User[]>([]);
  const [currentUserFollowing, setCurrentUserFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: "success" | "error";
  }>({ open: false, message: "", type: "success" });
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [userToRemove, setUserToRemove] = useState<User | null>(null);

  /**
   * Effect: Fetch initial data on mount if user is authenticated.
   * Fetches:
   * - Current user's following list (for follow button states)
   * - Current user's followers list (main data)
   */
  useEffect(() => {
    if (currentUserId) {
      fetchFollowers();
      fetchCurrentUser();
    }
  }, [currentUserId]);

  /**
   * Fetches the current user's profile to get following list.
   * Used to determine follow button states on follower cards.
   * Does not affect loading state for main followers list.
   */
  const fetchCurrentUser = async () => {
    try {
      const response = await api.get<User>("/users/me");
      setCurrentUserFollowing(response.data.following || []);
    } catch (error: any) {
      console.error("Failed to fetch current user:", error);
    }
  };

  /**
   * Fetches the list of users who follow the current user.
   * Sorts alphabetically by username for consistent display.
   * Sets loading state and handles errors with snackbar.
   */
  const fetchFollowers = async () => {
    try {
      setLoading(true);
      const response = await api.get<User[]>(`/users/${currentUserId}/followers`);
      const sorted = response.data.sort((a, b) =>
        a.username.localeCompare(b.username)
      );
      setFollowers(sorted);
    } catch (error: any) {
      console.error("Failed to fetch followers:", error);
      setSnackbar({
        open: true,
        message: t("failedLoadUsers"),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles follow/unfollow toggle on a follower.
   * Updates local following state optimistically and shows snackbar.
   * Note: This changes whether current user follows the follower,
   * but does NOT remove them from followers list (that's a separate action).
   *
   * @param {string} targetId - User ID to follow/unfollow
   */
  const handleToggleFollow = async (targetId: string) => {
    try {
      const wasFollowing = currentUserFollowing.includes(targetId);
      await api.post("/users/follow", { targetId });
      // Update local state
      if (wasFollowing) {
        setCurrentUserFollowing(prev => prev.filter(id => id !== targetId));
      } else {
        setCurrentUserFollowing(prev => [...prev, targetId]);
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

  /**
   * Opens confirmation modal for removing a follower.
   * Sets the user to be removed in component state.
   *
   * @param {User} user - Follower user object to remove
   */
  const handleRemoveFollowerClick = (user: User) => {
    setUserToRemove(user);
    setShowRemoveModal(true);
  };

  /**
   * Confirms and executes follower removal.
   * Calls DELETE /users/followers/:id to remove follower relationship.
   * Updates local state by filtering out removed user.
   * Closes modal and shows success/error snackbar.
   */
  const handleConfirmRemoveFollower = async () => {
    if (!userToRemove) return;

    try {
      await api.delete(`/users/followers/${userToRemove._id}`);
      setFollowers((prev) => prev.filter((f) => f._id !== userToRemove._id));
      setSnackbar({
        open: true,
        message: t("followerRemoved"),
        type: "success",
      });
      setShowRemoveModal(false);
      setUserToRemove(null);
    } catch (error: any) {
      console.error("Failed to remove follower:", error);
      setSnackbar({
        open: true,
        message: t("actionFailed"),
        type: "error",
      });
      setShowRemoveModal(false);
      setUserToRemove(null);
    }
  };

  /**
   * Cancels follower removal and closes modal.
   * Clears userToRemove state.
   */
  const handleCancelRemoveFollower = () => {
    setShowRemoveModal(false);
    setUserToRemove(null);
  };

  /**
   * Navigates to a user's profile page.
   *
   * @param {string} userId - ID of user to navigate to
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
   * Checks if current user is following the given user ID.
   * Used to determine follow button state.
   *
   * @param {string} userId - User ID to check
   * @returns {boolean} - True if current user follows this user
   */
  const isFollowing = (userId: string) => {
    return currentUserFollowing.includes(userId);
  };

  // Loading state: show spinner/message
  if (loading) {
    return (
      <div className="followers-container">
        <UserSidebar />
        <div className="page-container">
          <div className="loading">{t("loading")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="followers-container">
      <UserSidebar />
      <div className="page-container">
        <div className="d-flex align-items-center gap-3 mb-6">
          <GoBackButton />
          <h1 className="page-title" style={{ margin: 0 }}>{t("followers")}</h1>
        </div>

        {/* Empty state: no followers */}
        {followers.length === 0 ? (
          <div className="loading">{t("noFollowersFound")}</div>
        ) : (
          // Grid of follower cards
          <div className="cards-grid">
            {followers.map((user) => (
              <div key={user._id} className="card follower-card">
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
                <div className="user-info">
                  <h3
                    onClick={() => handleUserClick(user._id)}
                  >
                    @{user.username}
                  </h3>
                  <p>
                    {t("memberSince")}: {formatDate(user.createdAt)}
                  </p>
                </div>

                {/* Follow/Unfollow Button */}
                <button
                  className={`btn-secondary btn-sm icon-btn ${isFollowing(user._id) ? "btn-following" : "btn-follow"}`}
                  onClick={() => handleToggleFollow(user._id)}
                >
                  <span className="material-icons text-lg">
                    {isFollowing(user._id) ? "person_remove" : "person_add"}
                  </span>
                </button>

                {/* Remove Follower Button - Only visible on followers page */}
                <button
                  className="btn-danger btn-sm icon-btn"
                  onClick={() => handleRemoveFollowerClick(user)}
                >
                  <span className="material-icons text-lg">
                    person_remove
                  </span>
                  {t("removeFollower")}
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
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
        <footer className="page-footer">
          <p>{t("copyright")}</p>
        </footer>
      </div>

      {/* Custom Remove Follower Confirmation Modal */}
      {showRemoveModal && userToRemove && (
        <div className="modal-overlay" onClick={handleCancelRemoveFollower}>
          <div className="modal modal-danger" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{t("confirmRemoveFollower")}</h2>
            <p className="modal-text">
              {t("confirmRemoveFollowerMessage").replace("{username}", `@${userToRemove.username}`)}
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={handleCancelRemoveFollower}>
                {t("cancel")}
              </button>
              <button className="btn-danger" onClick={handleConfirmRemoveFollower}>
                {t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Followers;
