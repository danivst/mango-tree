import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api, { usersAPI, UserProfile, Post } from "../services/api";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { getTranslation } from "../utils/translations";
import UserSidebar from "../components/UserSidebar";
import Snackbar from "../components/Snackbar";
import { getToken } from "../utils/auth";
import PostCard from "../components/PostCard";
import "./admin/AdminPages.css";

interface Category {
  _id: string;
  name: string;
  translations?: {
    name: {
      bg: string;
      en: string;
    };
  };
}

const Account = () => {
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

  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);
  const [bioEditText, setBioEditText] = useState("");
  const [bioSubmitting, setBioSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: "success" | "error";
  }>({ open: false, message: "", type: "success" });
  const [showBioTranslation, setShowBioTranslation] = useState(false);

  useEffect(() => {
    if (currentUserId) {
      fetchUserData();
      fetchCategories();
    }
  }, [currentUserId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [userRes, postsRes] = await Promise.all([
        api.get<UserProfile>("/users/me"),
        api.get<Post[]>(`/posts/author/${currentUserId}`),
      ]);
      setUser(userRes.data);
      setPosts(postsRes.data);
    } catch (error: any) {
      console.error("Failed to fetch user data:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || t("failedLoadUsers"),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get<Category[]>("/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleProfileImageClick = () => {
    const input = document.getElementById("profile-image-input") as HTMLInputElement;
    if (input) input.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const supportedFormats = ["image/jpeg", "image/png", "image/webp"];
    if (!supportedFormats.includes(file.type)) {
      setSnackbar({
        open: true,
        message: t("onlyJPGE"),
        type: "error",
      });
      return;
    }

    setProfileImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfileImage = async () => {
    if (!profileImagePreview) return;
    try {
      setSaving(true);
      await api.put<UserProfile>(`/users/${currentUserId}`, { profileImage: profileImagePreview });
      setUser((prev) => (prev ? { ...prev, profileImage: profileImagePreview } : prev));
      setProfileImageFile(null);
      setProfileImagePreview("");
      setSnackbar({
        open: true,
        message: t("profilePictureUpdated") || "Profile picture updated successfully!",
        type: "success",
      });
    } catch (error: any) {
      console.error("Failed to update profile picture:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to update profile picture",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const getCategoryDisplayName = (category: Category) => {
    const translated = t(category.name.toLowerCase());
    if (translated && translated !== category.name.toLowerCase()) {
      return translated;
    }
    return category.name.charAt(0).toUpperCase() + category.name.slice(1);
  };

  const handleOpenBioModal = () => {
    setBioEditText(user?.bio || "");
    setShowBioModal(true);
  };

  const handleCloseBioModal = () => {
    setShowBioModal(false);
    setBioEditText("");
  };

  const handleSaveBio = async () => {
    if (!currentUserId) return;

    setBioSubmitting(true);
    try {
      const updatedUser = await usersAPI.updateProfile({ bio: bioEditText });
      setUser(updatedUser);
      setSnackbar({
        open: true,
        message: t("bioUpdated") || "Bio updated successfully!",
        type: "success",
      });
      handleCloseBioModal();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to update bio",
        type: "error",
      });
    } finally {
      setBioSubmitting(false);
    }
  };

  // Derive the three special categories from the fetched categories in specific order: recipe, question, flex
  const specialCategories = useMemo(() => {
    const lowerNames = ["recipe", "flex", "question"];
    const filtered = categories.filter((cat) =>
      lowerNames.includes(cat.name.toLowerCase())
    );
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
    return posts.filter((post) => post.category._id === selectedCategoryId);
  }, [posts, selectedCategoryId]);

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

  if (!user) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <UserSidebar />
        <div className="admin-page" style={{ flex: 1 }}>
          <div className="admin-loading">{t("noUsersFound")}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <UserSidebar />
      <div className="admin-page" style={{ flex: 1 }}>
        {/* CSS for profile image hover */}
        <style>{`
          .profile-pic-container:hover .profile-image-overlay { opacity: 1; }
          .profile-pic-container:hover .profile-image-img { filter: brightness(0.5); }
          .profile-image-overlay { opacity: 0; transition: opacity 0.2s; }
          .profile-image-img { transition: filter 0.2s; }
        `}</style>

        <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
          {/* Profile Section */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "24px" }}>
            {/* Profile Picture */}
            <div className="profile-pic-container" style={{ position: "relative", cursor: "pointer" }} onClick={handleProfileImageClick}>
              <input
                type="file"
                id="profile-image-input"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  position: "relative",
                  border: "4px solid var(--theme-accent)",
                  background: "#ccc",
                }}
              >
                {(profileImagePreview || user.profileImage) ? (
                  <img
                    src={profileImagePreview || user.profileImage}
                    alt={user.username}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    className="profile-image-img"
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
                    }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Hover overlay with pencil icon */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  className="profile-image-overlay"
                >
                  <span className="material-icons" style={{ fontSize: "32px", color: "white" }}>
                    edit
                  </span>
                </div>
              </div>
              {profileImageFile && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveProfileImage();
                  }}
                  disabled={saving}
                  style={{
                    marginTop: "8px",
                    width: "100%",
                    padding: "8px",
                    border: "2px solid var(--theme-text)",
                    background: "var(--theme-accent)",
                    color: "var(--theme-text)",
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? t("loading") : t("saveChanges")}
                </button>
              )}
            </div>

            {/* User Info */}
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: "28px", fontWeight: 700, margin: "0 0 8px 0", color: "var(--theme-text)" }}>
                @{user.username}
              </h1>
              <p style={{ fontSize: "14px", opacity: 0.7, margin: "0 0 16px 0", color: "var(--theme-text)" }}>
                {t("memberSince")}: {formatDate(user.createdAt)}
              </p>

              {/* Stats */}
              <div style={{ display: "flex", gap: "32px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--theme-text)" }}>
                    {posts.length}
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--theme-text)", opacity: 0.8 }}>
                    {t("posts")}
                  </div>
                </div>
                <div
                  style={{ textAlign: "center", cursor: "pointer" }}
                  onClick={() => navigate("/account/followers")}
                >
                  <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--theme-text)" }}>
                    {user.followers.length}
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--theme-text)", opacity: 0.8 }}>
                    {t("followers")}
                  </div>
                </div>
                <div
                  style={{ textAlign: "center", cursor: "pointer" }}
                  onClick={() => navigate("/account/following")}
                >
                  <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--theme-text)" }}>
                    {user.following.length}
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--theme-text)", opacity: 0.8 }}>
                    {t("following")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "var(--theme-text)" }}>
                {t("bio")}
              </h3>
              <div style={{ display: "flex", gap: "8px" }}>
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
                <button
                  onClick={handleOpenBioModal}
                  disabled={saving}
                  style={{
                    padding: "6px 12px",
                    border: "1px solid var(--theme-text)",
                    background: "transparent",
                    color: "var(--theme-text)",
                    borderRadius: "6px",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontSize: "12px",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span className="material-icons" style={{ fontSize: "14px" }}>edit</span>
                  {t("editBio")}
                </button>
              </div>
            </div>
            <div
              style={{
                background: "var(--theme-bg)",
                padding: "16px",
                borderRadius: "8px",
                lineHeight: 1.7,
                color: "var(--theme-text)",
                minHeight: "40px",
              }}
            >
              {user?.bio ? (
                showBioTranslation && user.translations?.bio?.[language]
                  ? user.translations.bio[language]
                  : user.bio
              ) : (
                <span style={{ opacity: 0.5 }}>{t("noBio")}</span>
              )}
            </div>
          </div>

          {/* Divider */}
          <hr style={{ border: 0, borderTop: "1px solid var(--theme-text)", opacity: 0.2, margin: "32px 0" }} />

          {/* Category Tabs (3 columns) */}
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
            {specialCategories.map((category) => (
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
                  opacity: selectedCategoryId === category._id ? 1 : 0.6,
                }}
              >
                {getCategoryDisplayName(category)}
              </button>
            ))}
          </div>

          {/* Posts Grid */}
          {filteredPosts.length === 0 ? (
            <div className="admin-loading" style={{ textAlign: "center", padding: "40px" }}>
              {selectedCategoryId
                ? t("noPostsFound") || "No posts found in this category."
                : t("selectCategory") || "Select a category to view posts."}
            </div>
          ) : (
            <div className="admin-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {filteredPosts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}
        </div>

        {/* Edit Bio Modal */}
        {showBioModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={handleCloseBioModal}
          >
            <div
              style={{
                background: "var(--theme-bg)",
                padding: "24px",
                borderRadius: "12px",
                maxWidth: "500px",
                width: "90%",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ margin: "0 0 16px 0", color: "var(--theme-text)" }}>
                {t("editBio")}
              </h2>
              <textarea
                value={bioEditText}
                onChange={(e) => setBioEditText(e.target.value)}
                rows={5}
                placeholder={t("noBio")}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid var(--theme-text)",
                  borderRadius: "8px",
                  background: "var(--theme-bg)",
                  color: "var(--theme-text)",
                  fontSize: "14px",
                  resize: "vertical",
                  marginBottom: "16px",
                  boxSizing: "border-box",
                }}
                autoFocus
              />
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  onClick={handleCloseBioModal}
                  disabled={bioSubmitting}
                  style={{
                    padding: "8px 16px",
                    border: "2px solid var(--theme-text)",
                    background: "transparent",
                    color: "var(--theme-text)",
                    borderRadius: "8px",
                    cursor: bioSubmitting ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleSaveBio}
                  disabled={bioSubmitting}
                  style={{
                    padding: "8px 16px",
                    border: "none",
                    background: bioSubmitting ? "#ccc" : "var(--theme-accent)",
                    color: "var(--theme-text)",
                    borderRadius: "8px",
                    cursor: bioSubmitting ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  {bioSubmitting ? t("loading") : t("saveBio")}
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
      </div>
    </div>
  );
};

export default Account;
