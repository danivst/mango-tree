/**
 * @file Followers.tsx
 * @description User account page showing the list of users who follow the current user.
 * Displays followers in a grid with avatar, username, join date, and action buttons.
 * Provides management tools to unfollow followers or forcefully remove them.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../services/api";
import { useThemeLanguage } from "../../../../context/ThemeLanguageContext";
import { getTranslation } from "../../../../utils/translations";
import UserSidebar from "../../../../components/user/sidebar/UserSidebar";
import Snackbar from "../../../../components/snackbar/Snackbar";
import GoBackButton from "../../../../components/buttons/back/GoBackButton";
import { useAuth } from "../../../../utils/useAuth";
import { useSnackbar } from "../../../../utils/snackbar";
import "../../../../styles/shared.css";
import "./Followers.css";
import Footer from "../../../../components/global/Footer";
import UserCard from "../../../../components/user/card/UserCard";

// MUI Icon Imports
import PersonOffIcon from "@mui/icons-material/PersonOff";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";

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
 * @component Followers
 * @description User account page showing the list of users who follow the current user.
 *
 * Features:
 * - View all followers
 * - Unfollow followers (if currently following them back)
 * - Remove followers (forcefully delete follower relationship)
 * - Modal confirmation for remove action
 * - Real-time UI updates with refetch after actions
 *
 * Route: /account/followers
 * @requires useSnackbar - Custom hook for standardized notifications
 * @requires useThemeLanguage - Context for UI language and theme variants
 */
const Followers = () => {
  const navigate = useNavigate();
  const { language } = useThemeLanguage();
  const { user } = useAuth();
  const t = (key: string) => getTranslation(language, key);
  const currentUserId = user?._id;
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const [followers, setFollowers] = useState<User[]>([]);
  const [currentUserFollowing, setCurrentUserFollowing] = useState<string[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [userToRemove, setUserToRemove] = useState<User | null>(null);

  /**
   * Effect: Fetch initial data on mount if user is authenticated.
   */
  useEffect(() => {
    if (currentUserId) {
      fetchFollowers();
      fetchCurrentUser();
    }
  }, [currentUserId]);

  /**
   * Fetches the current user's profile to get following list.
   */
  const fetchCurrentUser = async () => {
    try {
      const response = await api.get<User>("/users/me");
      setCurrentUserFollowing(response.data.following || []);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Failed to fetch current user:", error);
      }
      showError(t("failedLoadUsers"));
    }
  };

  /**
   * Fetches the list of users who follow the current user.
   */
  const fetchFollowers = async () => {
    try {
      setLoading(true);
      const response = await api.get<User[]>(
        `/users/${currentUserId}/followers`,
      );
      const sorted = response.data.sort((a, b) =>
        a.username.localeCompare(b.username),
      );
      setFollowers(sorted);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Failed to fetch followers:", error);
      }
      showError(t("failedLoadUsers"));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles follow/unfollow toggle on a follower.
   * @param {string} targetId - User ID to follow/unfollow
   */
  const handleToggleFollow = async (targetId: string) => {
    try {
      const wasFollowing = currentUserFollowing.includes(targetId);
      await api.post("/users/follow", { targetId });
      // Update local state
      if (wasFollowing) {
        setCurrentUserFollowing((prev) => prev.filter((id) => id !== targetId));
      } else {
        setCurrentUserFollowing((prev) => [...prev, targetId]);
      }
      showSuccess(wasFollowing ? t("unfollowed") : t("followed"));
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Failed to toggle follow:", error);
      }
      showError(t("actionFailed"));
    }
  };

  /**
   * Opens confirmation modal for removing a follower.
   * @param {User} user - Follower user object to remove
   */
  const handleRemoveFollowerClick = (user: User) => {
    setUserToRemove(user);
    setShowRemoveModal(true);
  };

  /**
   * Confirms and executes follower removal.
   */
  const handleConfirmRemoveFollower = async () => {
    if (!userToRemove) return;

    try {
      await api.delete(`/users/followers/${userToRemove._id}`);
      setFollowers((prev) => prev.filter((f) => f._id !== userToRemove._id));
      showSuccess(t("followerRemoved"));
      setShowRemoveModal(false);
      setUserToRemove(null);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Failed to remove follower:", error);
      }
      showError(t("actionFailed"));
      setShowRemoveModal(false);
      setUserToRemove(null);
    }
  };

  /**
   * Cancels follower removal and closes modal.
   */
  const handleCancelRemoveFollower = () => {
    setShowRemoveModal(false);
    setUserToRemove(null);
  };

  /**
   * Navigates to a user's profile page.
   */
  const handleUserClick = (userId: string) => {
    navigate(`/users/${userId}`);
  };

  /**
   * Checks if current user is following the given user ID.
   */
  const isFollowing = (userId: string) => {
    return currentUserFollowing.includes(userId);
  };

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
          <h1 className="page-title" style={{ margin: 0 }}>
            {t("followers")}
          </h1>
        </div>

        {followers.length === 0 ? (
          <div className="empty-state">
            <PersonOffIcon sx={{ fontSize: 40, opacity: 0.5 }} />
            <p className="empty-state-message">{t("noFollowersFound")}</p>
          </div>
        ) : (
          <div className="cards-grid">
            {followers.map((user) => (
              <UserCard
                key={user._id}
                userId={user._id}
                username={user.username}
                profileImage={user.profileImage}
                createdAt={user.createdAt}
                isFollowing={isFollowing(user._id)}
                onToggleFollow={handleToggleFollow}
                onUserClick={handleUserClick}
                size="md"
                showActions={false}
                additionalActions={
                  <button
                    className="btn-danger btn-sm icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFollowerClick(user);
                    }}
                    title={t("removeFollower")}
                  >
                    <PersonRemoveIcon sx={{ fontSize: 20 }} />
                  </button>
                }
              />
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

      {showRemoveModal && userToRemove && (
        <div className="modal-overlay" onClick={handleCancelRemoveFollower}>
          <div
            className="modal modal-danger"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title">{t("confirmRemoveFollower")}</h2>
            <p className="modal-text">
              {t("confirmRemoveFollowerMessage").replace(
                "{username}",
                `@${userToRemove.username}`,
              )}
            </p>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={handleCancelRemoveFollower}
              >
                {t("cancel")}
              </button>
              <button
                className="btn-danger"
                onClick={handleConfirmRemoveFollower}
              >
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
