/**
 * @file Search.tsx
 * @description User search page allowing authenticated users to find others by username.
 * Features a real-time, debounced search that synchronizes with URL query parameters.
 * Supports social interactions including following and unfollowing directly from search results.
 */

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import { useThemeLanguage } from "../../../context/ThemeLanguageContext";
import { getTranslation } from "../../../utils/translations";
import "../../../styles/shared.css";
import "./Search.css";
import Snackbar from "../../../components/snackbar/Snackbar";
import UserSidebar from "../../../components/user/sidebar/UserSidebar";
import { useAuth } from "../../../utils/useAuth";
import { useSnackbar } from "../../../utils/snackbar";
import Footer from "../../../components/global/Footer";
import UserCard from "../../../components/user/card/UserCard";

// MUI Icon Imports
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonOffIcon from '@mui/icons-material/PersonOff';

/**
 * @interface User
 * @description User data structure for search results display.
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
 * @component Search
 * @description Renders the user search interface. 
 * Manages complex filtering logic that prioritizes followed users in search results 
 * and provides immediate UI feedback for social actions.
 * * Features:
 * - Debounced search input
 * - URL persistence via query parameters
 * - Automatic categorization of "Followed" vs "Suggested" matches
 * - Local state management for relationship updates
 * * @page
 * @requires useSearchParams - For syncing search state with browser history
 * @requires useSnackbar - Standardized toast notifications
 * @requires useThemeLanguage - Current UI language for translations
 * @returns {JSX.Element} The rendered Search page
 */
const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [loading, setLoading] = useState(true);
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();
  const { language } = useThemeLanguage();
  const { user } = useAuth();
  const t = (key: string) => getTranslation(language, key);

  const currentUserId = user?._id;

  useEffect(() => {
    fetchUsers();
  }, []);

  /**
   * Fetches the global list of regular users for the search pool.
   */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get<User[]>("/users/regular");
      setUsers(response.data);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Failed to fetch users:", error);
      }
      showError(t("failedLoadUsers"));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Updates the search query state and URL parameters.
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim() === "") {
      setSearchParams({});
    } else {
      setSearchParams({ q: query });
    }
  };

  /**
   * Toggles the follow status for a specific user ID.
   * Updates the local 'users' state to provide instant UI feedback.
   */
  const toggleFollow = async (userId: string) => {
    if (!currentUserId) {
      showError(t("mustBeLoggedIn"));
      return;
    }
    try {
      await api.post("/users/follow", { targetId: userId });
      setUsers((prev) =>
        prev.map((user) => {
          if (user._id === userId) {
            const isFollowing = user.followers.includes(currentUserId);
            return {
              ...user,
              followers: isFollowing
                ? user.followers.filter((id) => id !== currentUserId)
                : [...user.followers, currentUserId],
            };
          }
          if (user._id === currentUserId) {
            const isFollowing = user.following.includes(userId);
            return {
              ...user,
              following: isFollowing
                ? user.following.filter((id) => id !== userId)
                : [...user.following, userId],
            };
          }
          return user;
        }),
      );
      
      const targetUser = users.find((u) => u._id === userId);
      const isCurrentlyFollowing = targetUser?.followers.includes(currentUserId);
      showSuccess(
        isCurrentlyFollowing
          ? t("successfullyUnfollowedUser")
          : t("successfullyFollowedUser"),
      );
    } catch (error: any) {
      showError(t("actionFailed"));
    }
  };

  /**
   * Navigates to a user's detailed public profile.
   */
  const handleUsernameClick = (userId: string) => {
    navigate(`/users/${userId}`);
  };

  /**
   * Logic: Filter and sort the user list based on search query.
   * Prioritizes followed users at the top and sorts subgroups alphabetically.
   */
  const filteredUsers = useMemo(() => {
    let result: User[] = [];

    if (searchQuery.trim() === "") {
      const followed = users.filter((user) =>
        user.followers.includes(currentUserId!),
      );
      result = followed.length > 0 ? followed : users;
    } else {
      const query = searchQuery.toLowerCase();
      const matching = users.filter((user: User) =>
        user.username.toLowerCase().includes(query),
      );

      const followed = matching.filter((user) =>
        user.followers.includes(currentUserId!),
      );
      const notFollowed = matching.filter(
        (user) => !user.followers.includes(currentUserId!),
      );

      followed.sort((a, b) => a.username.localeCompare(b.username));
      notFollowed.sort((a, b) => a.username.localeCompare(b.username));

      result = [...followed, ...notFollowed];
    }

    return result;
  }, [searchQuery, users, currentUserId]);

  const isFollowing = (user: User) => {
    return currentUserId && user.followers.includes(currentUserId);
  };

  if (loading) {
    return (
      <div className="search-container">
        <UserSidebar />
        <div className="page-container">
          <div className="loading">
            <RefreshIcon className="spin" sx={{ mr: 1 }} />
            {t("loading")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="search-container">
      <UserSidebar />
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">{t("users")}</h1>
          <div className="page-actions">
            <input
              type="text"
              className="search-input"
              placeholder={t("search") + "..."}
              value={searchQuery}
              onChange={handleSearchChange}
              autoFocus
            />
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <PersonOffIcon sx={{ fontSize: 40, opacity: 0.5 }} />
            <p className="empty-state-message">
              {searchQuery.trim() !== ""
                ? t("noSearchResults")
                : t("noUsersFound")}
            </p>
          </div>
        ) : (
          <div className="cards-grid">
            {filteredUsers.map((user) => (
    <UserCard
      key={user._id}
      userId={user._id}
      username={user.username}
      profileImage={user.profileImage}
      createdAt={user.createdAt}
      isFollowing={!!isFollowing(user)}
      onToggleFollow={toggleFollow}
      onUserClick={handleUsernameClick}
      size="md" // or 'lg' if you prefer the larger look from your current Search page
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

export default Search;