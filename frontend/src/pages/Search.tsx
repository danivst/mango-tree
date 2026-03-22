import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { getTranslation } from "../utils/translations";
import "./admin/AdminPages.css";
import Snackbar from "../components/Snackbar";
import UserSidebar from "../components/UserSidebar";
import { getToken } from "../utils/auth";

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

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: "success" | "error";
  }>({ open: false, message: "", type: "success" });
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
      setSnackbar({
        open: true,
        message: error.response?.data?.message || t("failedLoadUsers"),
        type: "error",
      });
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
      setSnackbar({
        open: true,
        message: t("mustBeLoggedIn") || "You must be logged in to follow users",
        type: "error",
      });
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
      setSnackbar({
        open: true,
        message: isCurrentlyFollowing ? t("successfullyUnfollowedUser") : t("successfullyFollowedUser"),
        type: "success",
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || t("actionFailed"),
        type: "error",
      });
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
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <UserSidebar />
        <div className="admin-page" style={{ flex: 1 }}>
          <div className="admin-loading">{t("loading")}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <UserSidebar />
      <div className="admin-page" style={{ flex: 1 }}>
        <div className="admin-page-header">
          <h1 className="admin-page-title">{t("users")}</h1>
          <div className="admin-page-actions">
            <input
              type="text"
              className="admin-search-input"
              placeholder={t("search") + "..."}
              value={searchQuery}
              onChange={handleSearchChange}
              autoFocus
            />
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="admin-loading">
            {searchQuery.trim() !== "" ? t("noSearchResults") : t("noUsersFound")}
          </div>
        ) : (
          <div className="admin-cards-grid">
            {filteredUsers.map((user) => (
              <div key={user._id} className="admin-card" style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                {/* Profile Image Circle */}
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.username}
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid var(--theme-accent)",
                      flexShrink: 0,
                      cursor: "pointer",
                    }}
                    onClick={() => handleUsernameClick(user._id)}
                  />
                ) : (
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      background: "var(--theme-accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      fontWeight: 600,
                      color: "var(--theme-text)",
                      border: "2px solid var(--theme-accent)",
                      flexShrink: 0,
                      cursor: "pointer",
                    }}
                    onClick={() => handleUsernameClick(user._id)}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* User Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "var(--theme-text)",
                      cursor: "pointer",
                    }}
                    onClick={() => handleUsernameClick(user._id)}
                  >
                    @{user.username}
                  </h3>

                  <p
                    style={{
                      fontSize: "14px",
                      opacity: 0.7,
                      marginBottom: "8px",
                      color: "var(--theme-text)",
                    }}
                  >
                    {t("memberSince")}: {formatDate(user.createdAt)}
                  </p>
                </div>

                {/* Follow/Unfollow Button */}
                <button
                  className={`admin-button-secondary ${isFollowing(user) ? "unfollow" : ""}`}
                  onClick={() => toggleFollow(user._id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    minWidth: "auto",
                    flexShrink: 0,
                    borderColor: isFollowing(user) ? "#a50104" : undefined,
                    color: isFollowing(user) ? "#a50104" : undefined,
                    background: isFollowing(user) ? "rgba(165, 1, 4, 0.1)" : undefined,
                  }}
                  title={isFollowing(user) ? t("unfollow") : t("follow")}
                >
                  <span className="material-icons" style={{ fontSize: "18px" }}>
                    {isFollowing(user) ? "person_remove" : "person_add"}
                  </span>
                  {isFollowing(user) ? t("unfollow") : t("follow")}
                </button>
              </div>
            ))}
          </div>
        )}

        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          open={snackbar.open}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      </div>
    </div>
  );
};

export default Search;
