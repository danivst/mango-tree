import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { getTranslation } from "../utils/translations";
import "../styles/shared.css";
import "./Search.css";
import Snackbar from "../components/Snackbar";
import UserSidebar from "../components/UserSidebar";
import { getCurrentUserId } from "../utils/auth";
import { useSnackbar } from "../utils/snackbar";
import Footer from "../components/Footer";

/**
 * @interface User
 * @description User data structure for search results display.
 * Subset of full User model with relationship fields.
 *
 * @property {string} _id - User's unique identifier
 * @property {string} username - Display username (unique)
 * @property {string} email - Email address
 * @property {string} role - User role (user, admin)
 * @property {string} createdAt - Account creation timestamp
 * @property {string} [profileImage] - Optional profile picture URL
 * @property {string} [bio] - Optional user biography
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
 * @file Search.tsx
 * @description User search page - search for users by username and follow/unfollow.
 * Supports real-time search with URL query parameter synchronization.
 *
 * Features:
 * - Search input with debounced API calls
 * - User results displayed in cards with avatar, username, join date
 * - Follow/unfollow toggle with instant feedback
 * - Click to navigate to user profile
 * - URL query param updates (？q=search)
 * - No results empty state
 *
 * Route: /search?q=...
 * Access: Authenticated users only
 * Components: UserSidebar, Snackbar, User cards
 *
 * @page
 * @requires useSearchParams - Sync search query with URL
 * @requires useNavigate - Navigation to user profiles
 * @requires useThemeLanguage - Translations and date formatting
 * @requires api - User search endpoint
 */

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [loading, setLoading] = useState(true);
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);

  const currentUserId = getCurrentUserId();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get<User[]>("/users/regular");
      setUsers(response.data);
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      showError(t("failedLoadUsers"));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim() === "") {
      setSearchParams({});
    } else {
      setSearchParams({ q: query });
    }
  };

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
        })
      );
      const targetUser = users.find(u => u._id === userId);
      const isCurrentlyFollowing = targetUser?.followers.includes(currentUserId);
      showSuccess(isCurrentlyFollowing ? t("successfullyUnfollowedUser") : t("successfullyFollowedUser"));
    } catch (error: any) {
      showError(t("actionFailed"));
    }
  };

  const handleUsernameClick = (userId: string) => {
    navigate(`/users/${userId}`);
  };

  // Filter users: search by username; if no query show followed users or all users; during search show followed first, then rest
  const filteredUsers = useMemo(() => {
    let result: User[] = [];

    if (searchQuery.trim() === "") {
      // No search: show followed users if any; otherwise show all
      const followed = users.filter((user) =>
        user.followers.includes(currentUserId!)
      );
      result = followed.length > 0 ? followed : users;
    } else {
      const query = searchQuery.toLowerCase();
      // Filter all users by search
      const matching = users.filter(
        (user: User) => user.username.toLowerCase().includes(query)
      );

      // Split into followed and non-followed
      const followed = matching.filter(user =>
        user.followers.includes(currentUserId!)
      );
      const notFollowed = matching.filter(user =>
        !user.followers.includes(currentUserId!)
      );

      // Sort each group alphabetically
      followed.sort((a, b) => a.username.localeCompare(b.username));
      notFollowed.sort((a, b) => a.username.localeCompare(b.username));

      // Combine: followed first, then non-followed
      result = [...followed, ...notFollowed];
    }

    return result;
  }, [searchQuery, users, currentUserId]);

  const isFollowing = (user: User) => {
    return currentUserId && user.followers.includes(currentUserId);
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

  if (loading) {
    return (
      <div className="search-container">
        <UserSidebar />
        <div className="page-container">
          <div className="loading">{t("loading")}</div>
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
            <span className="material-icons">person_off</span>
            <p className="empty-state-message">
              {searchQuery.trim() !== "" ? t("noSearchResults") : t("noUsersFound")}
            </p>
          </div>
        ) : (
          <div className="cards-grid">
            {filteredUsers.map((user) => (
              <div key={user._id} className="card user-card">
                {/* Profile Image Circle */}
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.username}
                    className="avatar avatar-lg"
                    onClick={() => handleUsernameClick(user._id)}
                  />
                ) : (
                  <div
                    className="avatar-fallback avatar-fallback-lg"
                    onClick={() => handleUsernameClick(user._id)}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* User Info */}
                <div className="user-card-info">
                  <h3
                    className="user-card-username"
                    onClick={() => handleUsernameClick(user._id)}
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
                  onClick={() => toggleFollow(user._id)}
                  title={isFollowing(user) ? t("unfollow") : t("follow")}
                >
                  <span className="material-icons">
                    {isFollowing(user) ? "person_remove" : "person_add"}
                  </span>
                </button>
              </div>
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
