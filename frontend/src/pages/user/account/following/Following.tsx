/**
 * @file Following.tsx
 * @description User account page showing the list of users the current user follows.
 * Displays followees in a grid with avatar, username, join date, and follow/unfollow buttons.
 * Provides real-time updates and management of the user's following list.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../services/api";
import { useThemeLanguage } from "../../../../context/ThemeLanguageContext";
import { getTranslation } from "../../../../utils/translations";
import UserSidebar from "../../../../components/user/sidebar/UserSidebar";
import Snackbar from "../../../../components/snackbar/Snackbar";
import GoBackButton from "../../../../components/buttons/back/GoBackButton";
import { getCurrentUserId } from "../../../../utils/auth";
import { useSnackbar } from "../../../../utils/snackbar";
import "../../../../styles/shared.css";
import "./Following.css";
import Footer from "../../../../components/global/Footer";
import UserCard from "../../../../components/user/card/UserCard";

// MUI Icon Imports
import PersonOffIcon from '@mui/icons-material/PersonOff';

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
 * @component Following
 * @description User account page showing the list of users the current user follows.
 *
 * Features:
 * - View all followed users
 * - Toggle follow/unfollow status directly from the list
 * - Refetching logic to maintain data integrity
 * - Grid-based layout for user cards
 *
 * Route: /account/following
 * @requires useSnackbar - Custom hook for managing standardized notifications
 * @requires useThemeLanguage - Context for handling UI language and theme variants
 * @returns {JSX.Element} The rendered Following page
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
   */
  const fetchFollowing = async () => {
    try {
      setLoading(true);
      const response = await api.get<User[]>(
        `/users/${currentUserId}/following`,
      );
      const sorted = response.data.sort((a, b) =>
        a.username.localeCompare(b.username),
      );
      setFollowing(sorted);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Failed to fetch following:", error);
      }
      showError(t("failedLoadUsers"));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles follow/unfollow toggle on a user.
   * Optimistically updates UI by refetching list.
   * @param {string} targetId - User ID to follow/unfollow
   */
  const handleToggleFollow = async (targetId: string) => {
    try {
      const targetUser = following.find((u) => u._id === targetId);
      const wasFollowing = targetUser?.followers.includes(currentUserId!);
      await api.post("/users/follow", { targetId });
      // Refresh the list to reflect changes
      await fetchFollowing();
      showSuccess(wasFollowing ? t("unfollowed") : t("followed"));
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Failed to toggle follow:", error);
      }
      showError(t("actionFailed"));
    }
  };

  /**
   * Navigates to user's profile page when username or avatar is clicked.
   * @param {string} userId - ID of user to view
   */
  const handleUserClick = (userId: string) => {
    navigate(`/users/${userId}`);
  };

  /**
   * Checks if current user is following the given user.
   * @param {User} user - User to check follow status against
   * @returns {boolean} - True if current user follows this user
   */
  const isFollowing = (user: User) => {
    return currentUserId && user.followers.includes(currentUserId);
  };

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
          <h1 className="page-title" style={{ margin: 0 }}>
            {t("following")}
          </h1>
        </div>

        {following.length === 0 ? (
          <div className="empty-state">
            <PersonOffIcon sx={{ fontSize: 40, opacity: 0.5 }} />
            <p className="empty-state-message">{t("noFollowingFound")}</p>
          </div>
        ) : (
          <div className="cards-grid">
            {following.map((user) => (
              <UserCard
                key={user._id}
                userId={user._id}
                username={user.username}
                profileImage={user.profileImage}
                createdAt={user.createdAt}
                isFollowing={!!isFollowing(user)}
                onToggleFollow={handleToggleFollow}
                onUserClick={handleUserClick}
                size="md"
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
    </div>
  );
};

export default Following;