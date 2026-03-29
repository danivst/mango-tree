import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import UserSidebar from "../components/UserSidebar";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { getTranslation } from "../utils/translations";
import api, { UserProfile as IUserProfile, Post, reportsAPI } from "../services/api";
import "./admin/AdminPages.css";
import Snackbar from "../components/Snackbar";
import GoBackButton from "../components/GoBackButton";
import { getToken } from "../utils/auth";

// Using IUserProfile directly - it already has followers and following as string[]

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
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

  const [user, setUser] = useState<IUserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<{ _id: string; name: string; translations?: { name: { bg: string; en: string; } } }[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [currentUserFollowing, setCurrentUserFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: "success" | "error";
  }>({ open: false, message: "", type: "success" });
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
      console.error("Failed to fetch current user:", error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await api.get<IUserProfile>(`/users/${id}`);
      setUser(response.data);
    } catch (error: any) {
      console.error("Failed to fetch user profile:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || t("userNotFound") || "User not found",
        type: "error",
      });
      setTimeout(() => navigate("/search"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await api.get<Post[]>(`/posts/author/${id}`);
      // If viewing another user's profile, hide unapproved posts
      const filtered = currentUserId === id
        ? response.data
        : response.data.filter(post => post.isApproved !== false);
      setPosts(filtered);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get<{ _id: string; name: string; translations?: { name: { bg: string; en: string; } } }[]>("/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleToggleFollow = async () => {
    if (!id || !currentUserId) return;
    try {
      const wasFollowing = currentUserFollowing.includes(id);
      await api.post("/users/follow", { targetId: id });
      if (wasFollowing) {
        setCurrentUserFollowing(prev => prev.filter(userId => userId !== id));
      } else {
        setCurrentUserFollowing(prev => [...prev, id]);
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

  const isFollowing = (userId: string) => {
    return currentUserFollowing.includes(userId);
  };

  const getCategoryDisplayName = (category: { name?: string; translations?: { name?: { bg?: string; en?: string } } }) => {
    const categoryName = category?.name || '—';
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
      // Send a generic report reason
      const defaultReason = t("reportUser") || "Reported user";
      await reportsAPI.createReport('user', user._id, defaultReason);
      setSnackbar({
        open: true,
        message: t("reportSubmitted") || "Report submitted successfully",
        type: "success",
      });
      setShowReportModal(false);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || t("somethingWentWrong"),
        type: "error",
      });
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
      }
    );
  };

  // Derive the three special categories in specific order: recipe, question, flex
  const specialCategories = useMemo(() => {
    const lowerNames = ["recipe", "flex", "question"];
    const filtered = categories.filter((cat) => lowerNames.includes(cat.name.toLowerCase()));
    // Sort according to desired order: recipe -> question -> flex
    const order = ["recipe", "question", "flex"];
    return filtered.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      return order.indexOf(aName) - order.indexOf(bName);
    });
  }, [categories]);

  // No default category selection - "All" (null) shows all posts

  // Filter posts by selected category
  const filteredPosts = useMemo(() => {
    if (!selectedCategoryId) return posts; // Show all posts when no category selected (All button)
    return posts.filter((post) => post.category && post.category._id === selectedCategoryId);
  }, [posts, selectedCategoryId]);

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

  if (!user) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <UserSidebar />
        <div className="admin-page" style={{ flex: 1 }}>
          <div className="admin-loading">{t("userNotFound")}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <UserSidebar />
      <div className="admin-page" style={{ flex: 1 }}>
        <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ marginBottom: "24px" }}>
            <GoBackButton />
          </div>
          {/* Profile Section */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "24px" }}>
            {/* Profile Picture */}
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "4px solid var(--theme-accent)",
                  background: "#ccc",
                }}
              >
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.username}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "48px",
                      fontWeight: 600,
                      color: "var(--theme-text)",
                      background: "var(--theme-accent)",
                      border: "2px solid var(--theme-text)",
                      boxSizing: "border-box",
                    }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* User Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
                <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0, color: "var(--theme-text)" }}>
                  @{user.username}
                </h1>
                {/* Follow/Unfollow Button (only if not viewing own profile) */}
                {currentUserId !== user._id && (
                  <button
                    onClick={handleToggleFollow}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "6px 12px",
                      border: isFollowing(user._id) ? "2px solid #a50104" : "2px solid var(--theme-text)",
                      background: isFollowing(user._id) ? "rgba(165, 1, 4, 0.1)" : undefined,
                      color: isFollowing(user._id) ? "#a50104" : undefined,
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      borderRadius: "6px",
                      transition: "all 0.2s",
                    }}
                    title={isFollowing(user._id) ? t("unfollow") : t("follow")}
                  >
                    <span className="material-icons" style={{ fontSize: "14px" }}>
                      {isFollowing(user._id) ? "person_remove" : "person_add"}
                    </span>
                    <span>{isFollowing(user._id) ? t("unfollow") : t("follow")}</span>
                  </button>
                )}
                {/* Report User Button (only if not viewing own profile) */}
                {currentUserId !== user._id && (
                  <button
                    onClick={() => setShowReportModal(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "6px 12px",
                      border: "2px solid #ff9800",
                      background: "rgba(255, 152, 0, 0.1)",
                      color: "#ff9800",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      borderRadius: "6px",
                      transition: "all 0.2s",
                    }}
                    title={t("reportUsername")}
                  >
                    <span className="material-icons" style={{ fontSize: "14px" }}>warning</span>
                    <span>{t("reportUser")}</span>
                  </button>
                )}
              </div>
              <p style={{ fontSize: "14px", opacity: 0.7, margin: "0 0 16px 0", color: "var(--theme-text)" }}>
                {t("memberSince")}: {formatDate(user.createdAt)}
              </p>

              {/* Stats */}
              <div style={{ display: "flex", gap: "32px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--theme-text)" }}>
                    {posts.filter(p => p.isApproved !== false).length}
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--theme-text)", opacity: 0.8 }}>
                    {t("posts")}
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--theme-text)" }}>
                    {user.followers?.length || 0}
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--theme-text)", opacity: 0.8 }}>
                    {t("followers")}
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--theme-text)" }}>
                    {user.following?.length || 0}
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--theme-text)", opacity: 0.8 }}>
                    {t("following")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ margin: 0, fontSize: "18px", color: "var(--theme-text)" }}>
                  {t("bio")}
                </h3>
                {/* Translate Button - show only if bio is in different language than app */}
                {user?.bio && user.translations?.bio?.[language] && user.translations.bio[language] !== user.bio && (
                  <button
                    onClick={() => setShowBioTranslation(!showBioTranslation)}
                    style={{
                      padding: "6px 16px",
                      border: "none",
                      background: "var(--theme-accent)",
                      color: "var(--theme-text)",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                    title={showBioTranslation ? t("viewOriginal") : t("translate")}
                  >
                    <span className="material-icons" style={{ fontSize: "14px" }}>
                      {showBioTranslation ? "translate" : "language"}
                    </span>
                    {showBioTranslation ? t("viewOriginal") : t("translate")}
                  </button>
                )}
              </div>
              <p
                style={{
                  background: "var(--theme-bg)",
                  padding: "20px",
                  borderRadius: "12px",
                  margin: 0,
                  lineHeight: 1.7,
                  color: "var(--theme-text)",
                }}
              >
                {showBioTranslation && user.translations?.bio?.[language]
                  ? user.translations.bio[language]
                  : user.bio}
              </p>
            </div>
          )}

          {/* Divider */}
          <hr style={{ border: 0, borderTop: "1px solid var(--theme-text)", opacity: 0.2, margin: "32px 0" }} />

          {/* Category Tabs */}
          {specialCategories.length > 0 && (
            <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
              <button
                onClick={() => setSelectedCategoryId(null)}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  border: selectedCategoryId === null ? "2px solid var(--theme-text)" : "none",
                  borderRadius: "8px",
                  background: selectedCategoryId === null ? "transparent" : "transparent",
                  color: "var(--theme-text)",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {t("all") || "All"}
              </button>
              {specialCategories
                .filter((category) => category._id) // Ensure category has an ID
                .map((category) => (
                <button
                  key={category._id}
                  onClick={() => setSelectedCategoryId(category._id)}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    border: selectedCategoryId === category._id ? "2px solid var(--theme-text)" : "none",
                    borderRadius: "8px",
                    background: selectedCategoryId === category._id ? "transparent" : "transparent",
                    color: "var(--theme-text)",
                    fontSize: "16px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    opacity: selectedCategoryId === category._id ? 1 : 0.6, // Dim button if category ID is missing
                  }}
                >
                  {getCategoryDisplayName(category)}
                </button>
              ))}
            </div>
          )}

          {/* Posts Grid */}
          {filteredPosts.length === 0 ? (
            <div className="admin-loading" style={{ textAlign: "center", padding: "40px" }}>
              {selectedCategoryId
                ? t("noPostsFound")
                : t("selectCategory")}
            </div>
          ) : (
            <div className="admin-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {filteredPosts.map((post) => (
                <div key={post._id} className="admin-card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Post Image if exists */}
                  {post.image && post.image.length > 0 && (
                    <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: "8px", overflow: "hidden", background: "#000" }}>
                      <img
                        src={post.image[0]}
                        alt={post.title}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  )}
                  {/* Post Title */}
                  <h3 style={{ fontSize: "18px", fontWeight: 600, margin: 0, color: "var(--theme-text)", cursor: "pointer" }} onClick={() => navigate(`/posts/${post._id}`)}>
                    {post.title}
                  </h3>
                  {/* Category & Date */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "var(--theme-text)", opacity: 0.8 }}>
                    <span>{post.category ? getCategoryDisplayName(post.category) : '—'}</span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                  {/* Likes count */}
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "14px", color: "var(--theme-text)", opacity: 0.8 }}>
                    <span className="material-icons" style={{ fontSize: "18px" }}>favorite</span>
                    {post.likes.length}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Report User Confirmation Modal */}
        {showReportModal && (
          <div className="admin-modal-overlay" onClick={() => setShowReportModal(false)}>
            <div className="admin-modal admin-modal-warning" onClick={(e) => e.stopPropagation()}>
              <h2 className="admin-modal-title">
                {t("reportUsername")}
              </h2>
              <p className="admin-modal-text">
                {t("confirmReportUser").replace("{username}", `@${user?.username || ''}`)}
              </p>
              <div className="admin-modal-actions">
                <button
                  className="admin-button-secondary"
                  onClick={() => setShowReportModal(false)}
                  disabled={reportSubmitting}
                >
                  {t("no")}
                </button>
                <button
                  className="admin-button-primary"
                  onClick={handleReportUser}
                  disabled={reportSubmitting}
                >
                  {reportSubmitting ? t("loading") : t("yes")}
                </button>
              </div>
            </div>
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
    </div>
  );
};

export default UserProfile;
