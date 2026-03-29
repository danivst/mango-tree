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

const Followers = () => {
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

  useEffect(() => {
    if (currentUserId) {
      fetchFollowers();
      fetchCurrentUser();
    }
  }, [currentUserId]);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get<User>("/users/me");
      setCurrentUserFollowing(response.data.following || []);
    } catch (error: any) {
      console.error("Failed to fetch current user:", error);
    }
  };

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
        message: error.response?.data?.message || t("failedLoadUsers"),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

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
        message: error.response?.data?.message || t("actionFailed"),
        type: "error",
      });
    }
  };

  const handleRemoveFollowerClick = (user: User) => {
    setUserToRemove(user);
    setShowRemoveModal(true);
  };

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
        message: error.response?.data?.message || t("actionFailed"),
        type: "error",
      });
      setShowRemoveModal(false);
      setUserToRemove(null);
    }
  };

  const handleCancelRemoveFollower = () => {
    setShowRemoveModal(false);
    setUserToRemove(null);
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

  const isFollowing = (userId: string) => {
    return currentUserFollowing.includes(userId);
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
            <h1 className="admin-page-title" style={{ display: "inline-block", marginLeft: "16px" }}>{t("followers")}</h1>
          </div>
        </div>

        {followers.length === 0 ? (
          <div className="admin-loading">{t("noFollowersFound")}</div>
        ) : (
          <div className="admin-cards-grid">
            {followers.map((user) => (
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
                  className={`admin-button-secondary ${isFollowing(user._id) ? "unfollow" : ""}`}
                  onClick={() => handleToggleFollow(user._id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    minWidth: "auto",
                    flexShrink: 0,
                    borderColor: isFollowing(user._id) ? "#a50104" : undefined,
                    color: isFollowing(user._id) ? "#a50104" : undefined,
                    background: isFollowing(user._id) ? "rgba(165, 1, 4, 0.1)" : undefined,
                  }}
                >
                  <span className="material-icons" style={{ fontSize: "18px" }}>
                    {isFollowing(user._id) ? "person_remove" : "person_add"}
                  </span>
                  {isFollowing(user._id) ? t("unfollow") : t("follow")}
                </button>

                {/* Remove Follower Button */}
                <button
                  className="admin-button-danger"
                  onClick={() => handleRemoveFollowerClick(user)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    minWidth: "auto",
                    flexShrink: 0,
                  }}
                >
                  <span className="material-icons" style={{ fontSize: "18px" }}>
                    person_remove
                  </span>
                  {t("removeFollower")}
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
        <footer className="page-footer">
          <p>{t("copyright")}</p>
        </footer>
      </div>

      {/* Custom Remove Follower Confirmation Modal */}
      {showRemoveModal && userToRemove && (
        <div className="admin-modal-overlay" onClick={handleCancelRemoveFollower}>
          <div className="admin-modal admin-modal-danger" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-modal-title">{t("confirmRemoveFollower")}</h2>
            <p className="admin-modal-text">
              {t("confirmRemoveFollowerMessage").replace("{username}", `@${userToRemove.username}`)}
            </p>
            <div className="admin-modal-actions">
              <button className="admin-button-secondary" onClick={handleCancelRemoveFollower}>
                {t("cancel")}
              </button>
              <button className="admin-button-danger" onClick={handleConfirmRemoveFollower}>
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
