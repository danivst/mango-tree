import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { usersAPI, UserProfile, Post } from "../services/api";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { getTranslation } from "../utils/translations";
import UserSidebar from "../components/UserSidebar";
import Snackbar from "../components/Snackbar";
import { getCurrentUserId } from "../utils/auth";
import { useSnackbar } from "../utils/snackbar";
import PostCard from "../components/PostCard";
import ShareButton from "../components/ShareButton";
import PastUsernames from "../components/PastUsernames";
import "../styles/shared.css";
import "./Account.css";
import Footer from "../components/Footer";

/**
 * @file Account.tsx
 * @description User profile management page for viewing and editing personal account information.
 * Displays user profile details, posts, and provides bio editing functionality.
 *
 * Features:
 * - View current user profile information (username, email, role)
 * - View and manage user's posts with category filtering
 * - Edit bio with modal editor
 * - Search posts by title/content
 * - Navigate to user's followers/following lists
 * - Responsive profile image display (with fallback to initials)
 *
 * Data Sources:
 * - User profile: GET /users/me (on mount)
 * - User posts: GET /posts/author/:userId
 * - Categories: from posts response (for filtering)
 *
 * State Management:
 * - User profile data (name, email, bio, etc.)
 * - Posts array with optional category filter
 * - Profile image upload/preview (stored but not yet implemented upload)
 * - Bio editing modal state
 * - Loading and error states with snackbar feedback
 *
 * @page
 * @requires useState - Form state, posts state, UI state
 * @requires useEffect - Fetch user info and posts on mount
 * @requires useNavigate - Programmatic navigation (to followers, following, etc.)
 * @requires useThemeLanguage - Current UI language for translations
 * @requires useSearchParams - Not currently used but available for URL-based filtering
 * @requires api - General API service for fetching data
 * @requires Snackbar - Feedback notifications
 * @requires UserSidebar - Navigation sidebar
 */

/**
 * @interface Category
 * @description Category type for post categorization.
 * Includes optional translations for bilingual category names.
 *
 * @property {string} _id - Unique category identifier (MongoDB ObjectId)
 * @property {string} name - Category name (English key for translation)
 * @property {{ bg: string; en: string }} [translations.name] - Optional pre-translated names in both languages
 */

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
  const currentUserId = getCurrentUserId();

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
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();
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
      showError(t("failedLoadUsers"));
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
      showError(t("onlyJPGE"));
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
      await api.put<UserProfile>(`/users/me`, { profileImage: profileImagePreview });
      setUser((prev: UserProfile | null) => (prev ? { ...prev, profileImage: profileImagePreview } : prev));
      setProfileImageFile(null);
      setProfileImagePreview("");
      showSuccess(t("profilePictureUpdated"));
    } catch (error: any) {
      console.error("Failed to update profile picture:", error);
      showError(t("failedToUpdateProfilePicture"));
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
      showSuccess(t("bioUpdated"));
      handleCloseBioModal();
    } catch (error: any) {
      showError(t("failedToUpdateBio"));
    } finally {
      setBioSubmitting(false);
    }
  };

  // Derive the three special categories from the fetched categories in specific order: recipe, question, flex
  const specialCategories = (() => {
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
  })();

  // Filter posts by selected category
  const filteredPosts = (() => {
    if (!selectedCategoryId) return posts;
    return posts.filter((post) => post.category._id === selectedCategoryId);
  })();

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
      <div className="account-container">
        <UserSidebar />
        <div className="page-container">
          <div className="loading">{t("loading")}</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="account-container">
        <UserSidebar />
        <div className="page-container">
          <div className="loading">{t("noUsersFound")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="account-container">
      <UserSidebar />
      <div className="page-container">
        {/* Profile Section */}
          <div className="profile-header">
            {/* Profile Picture */}
            <div className="profile-pic-container" onClick={handleProfileImageClick}>
              <input
                type="file"
                id="profile-image-input"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                className="hidden"
              />
              {(profileImagePreview || user.profileImage) ? (
                <img
                  src={profileImagePreview || user.profileImage}
                  alt={user.username}
                  className="profile-pic-image"
                />
              ) : (
                <div className="profile-pic-placeholder">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
              {profileImageFile && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveProfileImage();
                  }}
                  disabled={saving}
                  className="btn-primary btn-sm w-full mt-2"
                >
                  {saving ? t("loading") : t("saveChanges")}
                </button>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="d-flex justify-between items-center gap-3">
                <h1 className="profile-username mb-0">@{user.username}</h1>
                <ShareButton
                  url={`${window.location.origin}/account`}
                  title={`@${user.username} - My MangoTree Profile`}
                  description={user.bio || ""}
                />
              </div>
              <p className="profile-meta">
                {t("memberSince")}: {formatDate(user.createdAt)}
              </p>

              {/* Stats */}
              <div className="d-flex gap-12 profile-stats">
                <div className="text-center">
                  <div className="text-2xl font-medium">{posts.length}</div>
                  <div className="stat-label">{t("posts")}</div>
                </div>
                <div
                  className="text-center cursor-pointer"
                  onClick={() => navigate("/account/followers")}
                >
                  <div className="text-2xl font-medium">{user.followers.length}</div>
                  <div className="stat-label">{t("followers")}</div>
                </div>
                <div
                  className="text-center cursor-pointer"
                  onClick={() => navigate("/account/following")}
                >
                  <div className="text-2xl font-medium">{user.following.length}</div>
                  <div className="stat-label">{t("following")}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="mb-6">
            <div className="d-flex justify-between items-center gap-3 mb-3">
              <h3 className="text-lg font-bold">{t("bio")}</h3>

              <div className="d-flex gap-3">
                {/* Translate Button - show only if bio is in different language than app */}
                {user?.bio && user.translations?.bio?.[language] && user.translations.bio[language] !== user.bio && (
                  <button
                    onClick={() => setShowBioTranslation(!showBioTranslation)}
                    className="translate-btn"
                    title={showBioTranslation ? t("viewOriginal") : t("translate")}
                  >
                    <span className="material-icons">{showBioTranslation ? "translate" : "language"}</span>
                    {showBioTranslation ? t("viewOriginal") : t("translate")}
                  </button>
                )}
                <button
                  onClick={handleOpenBioModal}
                  disabled={saving}
                  className="edit-bio-btn"
                >
                  <span className="material-icons text-sm">edit</span>
                  {t("editBio")}
                </button>
              </div>
            </div>
            <div className="bio-content">
              {user?.bio ? (
                showBioTranslation && user.translations?.bio?.[language]
                  ? user.translations.bio[language]
                  : user.bio
              ) : (
                <span className="bio-empty">{t("noBio")}</span>
              )}
            </div>
          </div>

          {/* Previous Usernames */}
          {user?.pastUsernames && user.pastUsernames.length > 0 && (
            <PastUsernames pastUsernames={user.pastUsernames} className="mb-6" />
          )}

          {/* Divider */}
          <hr className="page-divider" />

          {/* Category Tabs (3 columns) */}
          <div className="category-tabs">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`category-tab ${selectedCategoryId === null ? 'active' : ''}`}
            >
              {t("all")}
            </button>
            {specialCategories.map((category) => (
              <button
                key={category._id}
                onClick={() => setSelectedCategoryId(category._id)}
                className={`category-tab ${selectedCategoryId === category._id ? 'active' : ''}`}
              >
                {getCategoryDisplayName(category)}
              </button>
            ))}
          </div>

          {/* Posts Grid */}
          {filteredPosts.length === 0 ? (
            <div className="empty-state">
              <span className="material-icons">article</span>
              <h3 className="empty-state-title">{selectedCategoryId ? t("noPostsFound") : t("noPostsAvailable")}</h3>
            </div>
          ) : (
            <div className="cards-grid posts-grid">
              {filteredPosts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}

        {/* Edit Bio Modal */}
        {showBioModal && (
          <div className="modal-overlay" onClick={handleCloseBioModal}>
            <div className="edit-bio-modal" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">{t("editBio")}</h2>
              <textarea
                value={bioEditText}
                onChange={(e) => setBioEditText(e.target.value)}
                rows={5}
                placeholder={t("noBio")}
                className="bio-textarea"
                autoFocus
              />
              <div className="modal-actions">
                <button
                  onClick={handleCloseBioModal}
                  disabled={bioSubmitting}
                  className="btn-secondary"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleSaveBio}
                  disabled={bioSubmitting}
                  className="btn-primary"
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
          onClose={closeSnackbar}
        />
        <Footer />
      </div>
    </div>
  );
};

export default Account;
