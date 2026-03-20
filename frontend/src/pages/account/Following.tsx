import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation } from "../../utils/translations";
import UserSidebar from "../../components/UserSidebar";
import Snackbar from "../../components/Snackbar";
import GoBackButton from "../../components/GoBackButton";
import { getToken } from "../../utils/auth";
import "./../admin/AdminPages.css";

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

const Following = () => {
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

  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: "success" | "error";
  }>({ open: false, message: "", type: "success" });

  useEffect(() => {
    if (currentUserId) {
      fetchFollowing();
    }
  }, [currentUserId]);

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
      setSnackbar({
        open: true,
        message: error.response?.data?.message || t("failedLoadUsers"),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async (targetId: string) => {
    try {
      const targetUser = following.find(u => u._id === targetId);
      const wasFollowing = targetUser?.followers.includes(currentUserId!);
      await api.post("/users/follow", { targetId });
      // Refresh the list to reflect changes
      await fetchFollowing();
      setSnackbar({
        open: true,
        message: wasFollowing ? t("unfollowed") : t("followed"),
        type: "success",
      });
    } catch (error: any) {
      console.error("Failed to toggle follow:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || t("actionFailed"),
        type: "error",
      });
    }
  };

  const handleUserClick = (userId: string) => {
    navigate(`/users/${userId}`);
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

  const isFollowing = (user: User) => {
    return currentUserId && user.followers.includes(currentUserId);
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
          <div style={{ display: "flex", alignItems: "center" }}>
            <GoBackButton />
            <h1 className="admin-page-title" style={{ display: "inline-block", marginLeft: "16px" }}>{t("following")}</h1>
          </div>
        </div>

        {following.length === 0 ? (
          <div className="admin-loading">{t("noFollowingFound")}</div>
        ) : (
          <div className="admin-cards-grid">
            {following.map((user) => (
              <div key={user._id} className="admin-card" style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                {/* Profile Image */}
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
                    onClick={() => handleUserClick(user._id)}
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
                    onClick={() => handleUserClick(user._id)}
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
                    onClick={() => handleUserClick(user._id)}
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
                  onClick={() => handleToggleFollow(user._id)}
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

export default Following;
