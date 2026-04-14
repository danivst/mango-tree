/**
 * @file Users.tsx
 * @description Administrative user management dashboard. 
 * Provides a comprehensive interface for administrators to search, filter, and manage user accounts.
 * Includes functionality for banning/unbanning users, permanent account deletion, and 
 * a detailed profile preview modal showing user statistics, past usernames, and published posts.
 */

import { useState, useEffect, useMemo } from "react";
import { useThemeLanguage } from "../../../context/ThemeLanguageContext";
import { getTranslation } from "../../../utils/translations";
import { useAdminData } from "../../../context/AdminDataContext";
import { adminAPI } from "../../../services/admin-api";
import {
  sortData,
  paginateData,
  getTotalPages,
  SortState,
} from "../../../utils/table-utils";
import api, { Post as PostType } from "../../../services/api";
import { Category } from "../../../services/admin-api";
import { usersAPI, UserProfile } from "../../../services/api";
import "../../../styles/shared.css";
import "./Users.css";
import Footer from "../../../components/global/Footer";
import PastUsernames from "../../../components/user/PastUsernames";
import Snackbar from "../../../components/snackbar/Snackbar";
import { useSnackbar } from "../../../utils/snackbar";
import {
  AdminTable,
  ColumnDef,
} from "../../../components/admin/table";

// MUI Icon Imports
import PersonOffIcon from "@mui/icons-material/PersonOff";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ArticleIcon from "@mui/icons-material/Article";
import CloseIcon from "@mui/icons-material/Close";

/**
 * Step identifiers for the multi-step account deletion process.
 */
type DeleteStep = "warning" | "reason" | "confirm" | null;

/**
 * Step identifiers for the multi-step user banning and unbanning process.
 */
type BanUnbanStep = "warning" | "reason" | "confirm" | "unban_confirm" | null;

const Users = () => {
  const { users, usersState, fetchUsers, fetchReports, fetchFlaggedContent } =
    useAdminData();
  const { loading, error, hasFetched } = usersState;
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  // Local UI states
  const [searchQuery, setSearchQuery] = useState("");
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Modals state
  const [deleteStep, setDeleteStep] = useState<DeleteStep>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  const [banUnbanStep, setBanUnbanStep] = useState<BanUnbanStep>(null);
  const [banUserId, setBanUserId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("");
  const [unbanTarget, setUnbanTarget] = useState<any | null>(null);

  // User Profile Preview states
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [userPosts, setUserPosts] = useState<PostType[]>([]);
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [selectedUserCategoryId, setSelectedUserCategoryId] = useState<
    string | null
  >(null);

  /**
   * Effect: Reset to page 1 whenever search query changes.
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  /**
   * Filters available categories to show only specific types in the preview modal.
   */
  const specialCategories = useMemo(() => {
    if (!userCategories.length) return [];
    const lowerNames = ["recipe", "flex", "question"];
    const filtered = userCategories.filter((cat) =>
      lowerNames.includes(cat.name.toLowerCase()),
    );
    const order = ["recipe", "question", "flex"];
    return filtered.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      return order.indexOf(aName) - order.indexOf(bName);
    });
  }, [userCategories]);

  /**
   * Effect: Reset category filtering when the selected user changes.
   */
  useEffect(() => {
    if (selectedUser) {
      setSelectedUserCategoryId(null);
    }
  }, [selectedUser]);

  const categoryDisplayLanguage =
    selectedUser?.language === "bg" ? "bg" : language;

  /**
   * Retrieves a localized display name for categories.
   * @param categoryName - Original name string.
   * @param lang - Target language.
   * @returns Translated or capitalized string.
   */
  const getCategoryDisplayName = (
    categoryName: string,
    lang: string = categoryDisplayLanguage,
  ) => {
    const translated = getTranslation(lang as any, categoryName.toLowerCase());
    if (translated && translated !== categoryName.toLowerCase())
      return translated;
    return categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
  };

  /**
   * Filters the user list based on search query (username or email).
   */
  const filteredData = useMemo(() => {
    if (!hasFetched) return [];
    if (searchQuery.trim() === "") return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query),
    );
  }, [users, searchQuery, hasFetched]);

  /**
   * Sorts the filtered user data based on the current sort state.
   */
  const sortedData = useMemo(() => {
    return sortData(
      filteredData,
      sortState.column,
      sortState.direction,
      (user, column) => {
        switch (column) {
          case "username":
            return user.username;
          case "email":
            return user.email;
          case "created":
            return user.createdAt;
          default:
            return "";
        }
      },
    );
  }, [filteredData, sortState]);

  /**
   * Slices data for pagination.
   */
  const paginatedData = useMemo(() => {
    return paginateData(sortedData, currentPage, itemsPerPage);
  }, [sortedData, currentPage]);

  const totalPages = useMemo(() => {
    return getTotalPages(sortedData.length, itemsPerPage);
  }, [sortedData.length]);

  /**
   * Cycles through sort directions for the table.
   * @param column - Column key to sort.
   */
  const handleSort = (column: string) => {
    setSortState((prev) => {
      if (prev.column === column) {
        if (prev.direction === "asc") return { column, direction: "desc" };
        if (prev.direction === "desc") return { column: null, direction: null };
      }
      return { column, direction: "asc" };
    });
    setCurrentPage(1);
  };

  /**
   * Manual refresh handler for user data.
   */
  const handleRefresh = async () => {
    try {
      await fetchUsers();
    } catch (err: any) {
      showError(err.response?.data?.message || "Failed to load users");
    }
  };

  // --- Modal Handlers ---

  const handleDeleteClick = (userId: string) => {
    setDeleteUserId(userId);
    setDeleteStep("warning");
  };

  const handleDeleteContinue = () => setDeleteStep("reason");
  const handleDeleteBack = () => {
    setDeleteStep("warning");
    setDeleteReason("");
  };
  const handleDeleteTerminate = () => setDeleteStep("confirm");

  /**
   * Finalizes user deletion via the Admin API.
   */
  const handleDeleteConfirm = async () => {
    if (!deleteUserId) return;
    try {
      await adminAPI.deleteUser(deleteUserId, deleteReason);
      showSuccess(t("accountDeletedSuccessfully"));
      setDeleteStep(null);
      setDeleteUserId(null);
      setDeleteReason("");
      await fetchUsers();
      try {
        await fetchReports();
        await fetchFlaggedContent();
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error(err);
        }
      }
    } catch (error: any) {
      showError(t("failedToDeleteUser"));
    }
  };

  const handleBanClick = (userId: string) => {
    setBanUserId(userId);
    setBanUnbanStep("warning");
  };

  const handleBanContinue = () => setBanUnbanStep("reason");
  const handleBanBack = () => {
    setBanUnbanStep("warning");
    setBanReason("");
  };
  const handleBanTerminate = () => setBanUnbanStep("confirm");

  /**
   * Finalizes user banning via the Admin API.
   */
  const handleBanConfirm = async () => {
    if (!banUserId || !banReason) return;
    try {
      await adminAPI.banUser(banUserId, banReason);
      showSuccess(`User ${userToBan?.username} banned successfully.`);
      setBanUnbanStep(null);
      setBanUserId(null);
      setBanReason("");
      await fetchUsers();
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let displayMessage = backendMessage || "Failed to ban user";
      if (backendMessage === "user is already banned.") {
        displayMessage = t("userAlreadyBanned");
      }
      showError(displayMessage);
    }
  };

  const handleUnbanClick = (user: any) => {
    setUnbanTarget(user);
    setBanUnbanStep("unban_confirm");
  };

  /**
   * Finalizes user unbanning via the Admin API.
   */
  const handleUnbanConfirm = async () => {
    const recordId = unbanTarget?.banned_user_id || unbanTarget?._id;
    if (!recordId) return;
    try {
      await adminAPI.unbanUser(recordId);
      showSuccess(`User ${userToUnban?.username} unbanned successfully.`);
      setBanUnbanStep(null);
      setBanUserId(null);
      await fetchUsers();
    } catch (error: any) {
      showError(t("failedToUnbanUser"));
    }
  };

  /**
   * Fetches full profile details and posts for the preview modal.
   * @param userId - ID of the user to preview.
   */
  const handleViewProfile = async (userId: string) => {
    setSelectedUser(null);
    setUserPosts([]);
    setUserCategories([]);
    setSelectedUserCategoryId(null);
    setPreviewLoading(true);
    try {
      const userData = await usersAPI.getUser(userId);
      const postsResponse = await api.get<PostType[]>(
        `/posts/author/${userId}`,
      );
      setUserPosts(postsResponse.data);
      const categoriesResponse = await api.get<Category[]>("/categories");
      setUserCategories(categoriesResponse.data);
      setSelectedUser(userData);
      setPreviewLoading(false);
    } catch (error: any) {
      showError(t("failedToLoadUserProfile"));
      setPreviewLoading(false);
    }
  };

  // Lookups for modal context
  const userToBan = banUserId ? users.find((u) => u._id === banUserId) : null;
  const userToUnban = banUserId ? users.find((u) => u._id === banUserId) : null;
  const userToDelete = deleteUserId
    ? users.find((u) => u._id === deleteUserId)
    : null;

  /**
   * Table column configurations.
   */
  const columns: ColumnDef<any>[] = [
    {
      key: "username",
      label: t("username"),
      sortable: true,
      minWidth: "150px",
      render: (user) => user.username,
    },
    {
      key: "email",
      label: t("email"),
      sortable: true,
      minWidth: "200px",
      render: (user) => user.email,
    },
    {
      key: "created",
      label: t("created"),
      sortable: true,
      minWidth: "150px",
      render: (user) =>
        new Date(user.createdAt).toLocaleDateString(
          language === "bg" ? "bg-BG" : "en-US",
          { year: "numeric", month: "short", day: "numeric" },
        ),
    },
  ];

  /**
   * Preview link column.
   */
  const viewProfileColumn: ColumnDef<any> = {
    key: "viewProfile",
    label: t("viewProfile"),
    sortable: false,
    minWidth: "120px",
    render: (user) =>
      user.role !== "admin" && (
        <button
          className="user-profile-link"
          onClick={() => handleViewProfile(user._id)}
        >
          {t("viewProfile")}
        </button>
      ),
  };

  const allColumns = [...columns, viewProfileColumn];

  const emptyState = {
    icon: <PersonOffIcon sx={{ fontSize: 40 }} />,
    title: t("noUsersFound"),
  };

  return (
    <div>
      <h1 className="page-container-title">{t("users")}</h1>

      <AdminTable<any>
        data={paginatedData}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        sortState={sortState}
        onSort={handleSort}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        columns={allColumns}
        loading={loading}
        error={error}
        hasFetched={hasFetched}
        onRefresh={handleRefresh}
        emptyState={emptyState}
        enableDragScroll={true}
        actionsRender={(user) => (
          <div className="table-actions">
            <button
              className="btn-danger"
              onClick={() => handleDeleteClick(user._id)}
            >
              {t("delete")}
            </button>
            {user.isBanned ? (
              <button
                className="btn-admin-action"
                onClick={() => handleUnbanClick(user._id)}
              >
                {t("unban")}
              </button>
            ) : (
              <button
                className="btn-admin-action"
                onClick={() => handleBanClick(user._id)}
              >
                {t("ban")}
              </button>
            )}
          </div>
        )}
      />

      {/* Delete Modal */}
      {deleteStep && userToDelete && (
        <div className="modal-overlay">
          <div className="modal modal-danger">
            {deleteStep === "warning" && (
              <>
                <h2 className="modal-title">{t("deleteAccount")}</h2>
                <p className="modal-text">{t("adminDeleteAccountWarning")}</p>
                <div className="modal-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setDeleteStep(null);
                      setDeleteUserId(null);
                    }}
                  >
                    {t("close")}
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleDeleteContinue}
                  >
                    {t("continue")}
                  </button>
                </div>
              </>
            )}
            {deleteStep === "reason" && (
              <>
                <h2 className="modal-title">{t("adminReasonForDeletion")}</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleDeleteTerminate();
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">
                      {t("adminReasonForDeletion")}
                    </label>
                    <textarea
                      className="form-textarea"
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      required
                      rows={4}
                      placeholder={t("adminReasonForDeletionPlaceholder")}
                    />
                  </div>
                  <div className="modal-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleDeleteBack}
                    >
                      {t("goBack")}
                    </button>
                    <button type="submit" className="btn-primary">
                      {t("terminateAccount")}
                    </button>
                  </div>
                </form>
              </>
            )}
            {deleteStep === "confirm" && (
              <>
                <h2 className="modal-title">{t("adminConfirmDeletion")}</h2>
                <p className="modal-text">
                  {t("adminConfirmDeletionText").replace(
                    "{username}",
                    userToDelete.username,
                  )}
                </p>
                <div className="modal-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => setDeleteStep("reason")}
                  >
                    {t("no")}
                  </button>
                  <button className="btn-danger" onClick={handleDeleteConfirm}>
                    {t("yes")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {banUnbanStep && banUserId && userToBan && (
        <div className="modal-overlay">
          <div className="modal modal-danger">
            {banUnbanStep === "warning" && (
              <>
                <h2 className="modal-title">{t("banUser")}</h2>
                <p className="modal-text">
                  {t("banUserWarning").replace(
                    "{username}",
                    userToBan.username,
                  )}
                </p>
                <div className="modal-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setBanUnbanStep(null);
                      setBanUserId(null);
                    }}
                  >
                    {t("close")}
                  </button>
                  <button className="btn-primary" onClick={handleBanContinue}>
                    {t("continue")}
                  </button>
                </div>
              </>
            )}
            {banUnbanStep === "reason" && (
              <>
                <h2 className="modal-title">{t("reasonForBan")}</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleBanTerminate();
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">{t("reasonForBan")}</label>
                    <textarea
                      className="form-textarea"
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      required
                      rows={4}
                      placeholder={t("reasonForBanPlaceholder")}
                    />
                  </div>
                  <div className="modal-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleBanBack}
                    >
                      {t("goBack")}
                    </button>
                    <button type="submit" className="btn-danger">
                      {t("banUser")}
                    </button>
                  </div>
                </form>
              </>
            )}
            {banUnbanStep === "confirm" && (
              <>
                <h2 className="modal-title">{t("confirmBan")}</h2>
                <p className="modal-text">
                  {t("confirmBanText").replace(
                    "{username}",
                    userToBan.username,
                  )}
                </p>
                <div className="modal-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => setBanUnbanStep("reason")}
                  >
                    {t("goBack")}
                  </button>
                  <button className="btn-danger" onClick={handleBanConfirm}>
                    {t("banUser")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Unban Modal */}
      {banUnbanStep === "unban_confirm" && banUserId && userToUnban && (
        <div className="modal-overlay">
          <div className="modal modal-danger">
            <h2 className="modal-title">{t("unbanUser")}</h2>
            <p className="modal-text">
              {t("unbanUserConfirm").replace(
                "{username}",
                userToUnban.username,
              )}
            </p>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setBanUnbanStep(null);
                  setBanUserId(null);
                }}
              >
                {t("cancel")}
              </button>
              <button className="btn-primary" onClick={handleUnbanConfirm}>
                {t("unban")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Preview Modal */}
      {selectedUser && (
        <div className="modal-overlay z-index-high">
          <div className="modal modal-preview">
            {previewLoading ? (
              <div className="loading loading-centered">{t("loading")}</div>
            ) : (
              <>
                <div className="modal-close-container">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="btn-close"
                  >
                    <CloseIcon />
                  </button>
                </div>
                <div className="preview-header">
                  <div className="preview-avatar-container">
                    <div className="preview-avatar">
                      {selectedUser.profileImage ? (
                        <img
                          src={selectedUser.profileImage}
                          alt={selectedUser.username}
                          className="preview-avatar-image"
                        />
                      ) : (
                        <div className="preview-avatar-placeholder">
                          {selectedUser.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="preview-info">
                    <h1 className="preview-username">
                      @{selectedUser.username}
                    </h1>
                    <p className="preview-member-since">
                      {t("memberSince")}:{" "}
                      {new Date(selectedUser.createdAt).toLocaleDateString(
                        language === "bg" ? "bg-BG" : "en-US",
                        { year: "numeric", month: "short", day: "numeric" },
                      )}
                    </p>
                    <div className="preview-stats">
                      <div className="preview-stat-item">
                        <div className="preview-stat-value">
                          {userPosts.length}
                        </div>
                        <div className="preview-stat-label">{t("posts")}</div>
                      </div>
                      <div className="preview-stat-item">
                        <div className="preview-stat-value">
                          {selectedUser.followers?.length || 0}
                        </div>
                        <div className="preview-stat-label">
                          {t("followers")}
                        </div>
                      </div>
                      <div className="preview-stat-item">
                        <div className="preview-stat-value">
                          {selectedUser.following?.length || 0}
                        </div>
                        <div className="preview-stat-label">
                          {t("following")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {selectedUser.bio && (
                  <div className="preview-bio-section">
                    <h3 className="preview-bio-title">{t("bio")}</h3>
                    <p className="preview-bio-content">{selectedUser.bio}</p>
                  </div>
                )}
                {selectedUser?.pastUsernames &&
                  selectedUser.pastUsernames.length > 0 && (
                    <PastUsernames
                      pastUsernames={selectedUser.pastUsernames}
                      className="preview-section mb-24"
                    />
                  )}
                <hr className="preview-divider" />
                {userCategories.length > 0 && (
                  <div className="preview-category-tabs">
                    <button
                      onClick={() => setSelectedUserCategoryId(null)}
                      className={`preview-category-tab ${selectedUserCategoryId === null ? "active" : ""}`}
                    >
                      {t("all")}
                    </button>
                    {specialCategories
                      .filter((category) => category._id)
                      .map((category) => (
                        <button
                          key={category._id}
                          onClick={() =>
                            setSelectedUserCategoryId(category._id)
                          }
                          className={`preview-category-tab ${selectedUserCategoryId === category._id ? "active" : ""}`}
                        >
                          {getCategoryDisplayName(category.name)}
                        </button>
                      ))}
                  </div>
                )}
                {(() => {
                  const filteredPosts = userPosts.filter(
                    (post) =>
                      !selectedUserCategoryId ||
                      (post.category &&
                        post.category._id === selectedUserCategoryId),
                  );
                  if (filteredPosts.length === 0) {
                    return (
                      <div className="empty-state">
                        <ArticleIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                        <h3>
                          {selectedUserCategoryId
                            ? t("noPostsFound")
                            : t("noPostsAvailable")}
                        </h3>
                      </div>
                    );
                  }
                  return (
                    <div className="cards-grid posts-grid">
                      {filteredPosts.map((post) => (
                        <div key={post._id} className="card preview-post-card">
                          {post.image && post.image.length > 0 && (
                            <div className="preview-post-image-container">
                              <img
                                src={post.image[0]}
                                alt={post.title}
                                className="preview-post-card-image"
                              />
                            </div>
                          )}
                          <h3 className="preview-post-card-title">
                            {post.title}
                          </h3>
                          <div className="preview-post-meta">
                            <span>
                              {post.category
                                ? getCategoryDisplayName(post.category.name)
                                : "—"}
                            </span>
                            <span>
                              {new Date(post.createdAt).toLocaleDateString(
                                language === "bg" ? "bg-BG" : "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </span>
                          </div>
                          <div className="preview-post-likes">
                            <FavoriteIcon sx={{ fontSize: 16, mr: 0.5, color: '#e77728' }} />
                            {post.likes?.length || 0}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </>
            )}
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
  );
};

export default Users;