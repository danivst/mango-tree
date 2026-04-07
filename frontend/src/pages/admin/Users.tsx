import { useState, useEffect, useMemo, useRef } from "react";
import { adminAPI } from "../../services/admin-api";
import Snackbar from "../../components/Snackbar";
import api from "../../services/api";
import { usersAPI, UserProfile, Post as PostType } from "../../services/api";
import {
  sortData,
  paginateData,
  getTotalPages,
  SortState,
} from "../../utils/table-utils";
import "../../styles/shared.css";
import "./Users.css";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation, Language } from "../../utils/translations";
import { useAdminData } from "../../context/AdminDataContext";
import { Category } from "../../services/admin-api";
import Footer from "../../components/Footer";
import PastUsernames from "../../components/PastUsernames";
import { useSnackbar } from "../../utils/snackbar";

/**
 * @type DeleteStep
 * @description State machine for admin user deletion flow.
 * Controls which step of the multi-modal deletion process is active.
 *
 * @property {"warning"} warning - Initial warning screen (user acknowledgment)
 * @property {"reason"} reason - Admin must enter deletion reason (required)
 * @property {"confirm"} confirm - Final confirmation before irreversible deletion
 * @property {null} null - No deletion modal visible
 */

type DeleteStep = "warning" | "reason" | "confirm" | null;

/**
 * @type BanUnbanStep
 * @description State machine for admin ban/unban flow.
 * Manages the multi-step ban/unban process with reason requirement.
 *
 * @property {"warning"} warning - Ban warning screen with reason input
 * @property {"reason"} reason - Enter ban reason (shown after warning for ban)
 * @property {"confirm"} confirm - Final ban/unban confirmation
 * @property {"unban_confirm"} unban_confirm - Unban confirmation (simple)
 * @property {null} null - No ban/unban modal visible
 */

type BanUnbanStep = "warning" | "reason" | "confirm" | "unban_confirm" | null;

/**
 * @file Users.tsx
 * @description Admin user management page - view all users, ban/unban, delete accounts.
 * Provides comprehensive user administration with filtering, sorting, and bulk actions.
 *
 * Features:
 * - List all users with username, email, role, status, join date
 * - Sortable columns: username, email, role, isBanned, createdAt
 * - Search by username/email
 * - Pagination (20 per page)
 * - User profile preview modal (click on user)
 * - Ban user with mandatory reason (modal flow)
 * - Unban user (instant, no reason required)
 * - Delete user with multi-step confirmation (admin deletion requires reason)
 * - View user's posts (navigates to respective page)
 *
 * Data Source:
 * - Uses AdminDataContext.users (merged with ban status) from fetchUsers()
 *
 * Access Control:
 * - Route protected by AdminRoute (admin only)
 *
 * State Machines:
 * - DeleteStep: warning → reason (admin) / confirm → execute
 * - BanUnbanStep: warning → reason (ban) → confirm / unban_confirm → execute
 *
 * @page
 * @requires useState - Users list, search, sort, modals, loading, selected user preview
 * @requires useMemo - Filtered/sorted/paginated computed list
 * @requires useEffect - No direct mount effect; data from AdminDataContext
 * @requires useThemeLanguage - Translations
 * @requires useAdminData - Access to users array and usersState
 * @requires useNavigate - Navigate to user's posts page, profile preview
 * @requires adminAPI - Get banned users, ban/unban, delete user
 * @requires api - For GET /users/:id (profile preview) maybe
 * @requires Snackbar - Success/error feedback
 * @requires Footer - Footer component
 * @requires sortData, paginateData, getTotalPages - Table utilities
 */

const Users = () => {
  const { users, usersState, fetchUsers, fetchReports, fetchFlaggedContent } = useAdminData();
  const { loading, error, hasFetched } = usersState;

  const [searchQuery, setSearchQuery] = useState("");
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);

  const [deleteStep, setDeleteStep] = useState<DeleteStep>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [banUnbanStep, setBanUnbanStep] = useState<BanUnbanStep>(null); // New state for ban modal
  const [banUserId, setBanUserId] = useState<string | null>(null); // New state for ban user ID
  const [banReason, setBanReason] = useState(""); // New state for ban reason
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  // User Profile Preview states
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [userPosts, setUserPosts] = useState<PostType[]>([]);
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [selectedUserCategoryId, setSelectedUserCategoryId] = useState<
    string | null
  >(null);

  // Compute special categories (recipe, question, flex) in specific order
  const specialCategories = useMemo(() => {
    if (!userCategories.length) return [];
    const lowerNames = ["recipe", "flex", "question"];
    const filtered = userCategories.filter((cat) =>
      lowerNames.includes(cat.name.toLowerCase()),
    );
    // Sort according to desired order: recipe -> question -> flex
    const order = ["recipe", "question", "flex"];
    return filtered.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      return order.indexOf(aName) - order.indexOf(bName);
    });
  }, [userCategories]);

  // Reset category selection when viewing a different user
  useEffect(() => {
    if (selectedUser) {
      setSelectedUserCategoryId(null);
    }
  }, [selectedUser]);

  // Determine which language to use for category names (use user's language if bg, otherwise admin's UI language)
  const categoryDisplayLanguage: Language =
    selectedUser?.language === "bg" ? "bg" : language;

  const getCategoryDisplayName = (
    categoryName: string,
    lang: Language = categoryDisplayLanguage,
  ) => {
    const translated = getTranslation(lang, categoryName.toLowerCase());
    if (translated && translated !== categoryName.toLowerCase()) {
      return translated;
    }
    return categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
  };

  // Refs for table container
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Click-and-drag scrolling state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const scrollStartLeft = useRef(0);

  // Click-and-drag scrolling handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const container = tableContainerRef.current;
    if (!container) return;

    // Only start drag if clicking on the container (not on interactive elements like buttons/links)
    if (
      (e.target as HTMLElement).tagName === "INPUT" ||
      (e.target as HTMLElement).tagName === "BUTTON" ||
      (e.target as HTMLElement).tagName === "A" ||
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest("a")
    ) {
      return;
    }

    e.preventDefault();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    scrollStartLeft.current = container.scrollLeft;

    document.body.style.userSelect = "none";
    if (container) container.style.cursor = "grabbing";
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const container = tableContainerRef.current;
      if (!container) return;

      const deltaX = e.clientX - dragStartX.current;
      container.scrollLeft = scrollStartLeft.current - deltaX;
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        document.body.style.userSelect = "";
        const container = tableContainerRef.current;
        if (container) container.style.cursor = "grab";
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // Filter users based on search
  const filteredData = useMemo(() => {
    let filtered = users;

    // Search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.username.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [searchQuery, users]);

  // Sort filtered data
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
          case "role":
            return user.role;
          case "created":
            return user.createdAt;
          default:
            return null;
        }
      },
    );
  }, [filteredData, sortState]);

  // Paginate sorted data
  const paginatedData = useMemo(() => {
    return paginateData(sortedData, currentPage, itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return getTotalPages(sortedData.length, itemsPerPage);
  }, [sortedData.length, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery]);

  const handleSort = (column: string) => {
    setSortState((prev) => {
      if (prev.column === column) {
        // Cycle through: asc -> desc -> null
        if (prev.direction === "asc") {
          return { column, direction: "desc" };
        } else if (prev.direction === "desc") {
          return { column: null, direction: null };
        }
      }
      return { column, direction: "asc" };
    });
    setCurrentPage(1);
  };

  const getSortIcon = (column: string) => {
    if (sortState.column !== column) {
      return (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="sort-icon-inactive"
        >
          <path d="M8 9l4-4 4 4M8 15l4 4 4-4" />
        </svg>
      );
    }
    if (sortState.direction === "asc") {
      return (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 9l4-4 4 4" />
        </svg>
      );
    }
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 15l4 4 4-4" />
      </svg>
    );
  };

  const handleRefresh = async () => {
    try {
      await fetchUsers();
    } catch (err: any) {
      showError(err.response?.data?.message || "Failed to load users");
    }
  };

  const handleDeleteClick = (userId: string) => {
    setDeleteUserId(userId);
    setDeleteStep("warning");
  };

  const handleBanClick = (userId: string) => {
    setBanUserId(userId);
    setBanUnbanStep("warning"); // Start with warning
  };

  const handleDeleteContinue = () => {
    setDeleteStep("reason");
  };

  const handleDeleteBack = () => {
    setDeleteStep("warning");
    setDeleteReason("");
  };

  const handleDeleteTerminate = () => {
    setDeleteStep("confirm");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteUserId) return;

    try {
      await adminAPI.deleteUser(deleteUserId, deleteReason);
      showSuccess(t("accountDeletedSuccessfully"));
      setDeleteStep(null);
      setDeleteUserId(null);
      setDeleteReason("");
      await fetchUsers();
      // Also refresh reports and flagged content to remove any related items (best effort)
      try {
        await fetchReports();
        await fetchFlaggedContent();
      } catch (err) {
        console.error("Failed to fetch data after user deletion:", err);
      }
    } catch (error: any) {
      showError(t("failedToDeleteUser"));
    }
  };

  const handleBanContinue = () => {
    setBanUnbanStep("reason");
  };

  const handleBanBack = () => {
    setBanUnbanStep("warning");
    setBanReason("");
  };

  const handleBanTerminate = () => {
    setBanUnbanStep("confirm");
  };

  const handleBanConfirm = async () => {
    if (!banUserId || !banReason) return;
    try {
      await adminAPI.banUser(banUserId, banReason);
      showSuccess(`User ${userToBan?.username} banned successfully.`);
      setBanUnbanStep(null);
      setBanUserId(null);
      setBanReason("");
      await fetchUsers(); // Refresh the user list
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      let displayMessage = backendMessage || "Failed to ban user";
      if (backendMessage === "user is already banned.") {
        displayMessage = t("userAlreadyBanned");
      }
      showError(displayMessage);
    }
  };

  const handleUnbanClick = (userId: string) => {
    setBanUserId(userId); // Use banUserId to store the user's ID
    setBanUnbanStep("unban_confirm");
  };

  const handleUnbanConfirm = async () => {
    if (!userToUnban?.banned_user_id) return; // Ensure we have the banned_user_id

    try {
      await adminAPI.unbanUser(userToUnban.banned_user_id);
      showSuccess(`User ${userToUnban?.username} unbanned successfully.`);
      setBanUnbanStep(null);
      setBanUserId(null);
      await fetchUsers(); // Refresh the user list
    } catch (error: any) {
      showError(t("failedToUnbanUser"));
    }
  };

  const handleViewProfile = async (userId: string) => {
    setSelectedUser(null);
    setUserPosts([]);
    setUserCategories([]);
    setSelectedUserCategoryId(null);
    setPreviewLoading(true);
    try {
      const userData = await usersAPI.getUser(userId);

      // Fetch user's posts (include all for admin moderation)
      const postsResponse = await api.get<PostType[]>(
        `/posts/author/${userId}`,
      );
      setUserPosts(postsResponse.data);

      // Fetch categories for post category names (and tabs if needed)
      const categoriesResponse = await api.get<Category[]>("/categories");
      setUserCategories(categoriesResponse.data);

      setSelectedUser(userData);
      setPreviewLoading(false);
    } catch (error: any) {
      showError(t("failedToLoadUserProfile"));
      setPreviewLoading(false);
    }
  };

  const userToBan = banUserId ? users.find((u) => u._id === banUserId) : null;
  const userToUnban = banUserId ? users.find((u) => u._id === banUserId) : null;
  const userToDelete = deleteUserId
    ? users.find((u) => u._id === deleteUserId)
    : null;

  // Local EmptyState component for no data
  const EmptyState = ({
    icon,
    title,
    message
  }: {
    icon: React.ReactNode;
    title: string;
    message?: string;
  }) => (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      {message && <p className="empty-state-message">{message}</p>}
    </div>
  );

  return (
    <div>
      <div className="page-container-header">
        <h1 className="page-container-title">{t("users")}</h1>
        <div className="page-container-actions">
          <button
            className="btn-secondary icon-btn mr-2"
            onClick={handleRefresh}
            disabled={loading}
          >
            <span className="material-icons text-base">
              refresh
            </span>
            {t("refresh")}
          </button>
          <input
            type="text"
            className="search-input"
            placeholder={t("search") + "..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="error-box-colored">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : !hasFetched ? (
        <div className="loading">
          No data loaded. Click Refresh to load data.
        </div>
      ) : filteredData.length === 0 ? (
        <EmptyState
          icon={<span className="material-icons">person_off</span>}
          title={t("noUsersFound")}
        />
      ) : (
        <div
          className="table-container table-grab"
          ref={tableContainerRef}
          onMouseDown={handleMouseDown}
        >
          {/* Main table with bottom scrollbar */}
          <table className="table">
            <thead>
              <tr>
                <th
                  className="sortable-header min-w-150"
                  onClick={() => handleSort("username")}
                >
                  <div className="header-content">
                    {t("username")}
                    {getSortIcon("username")}
                  </div>
                </th>
                <th
                  className="sortable-header min-w-200"
                  onClick={() => handleSort("email")}
                >
                  <div className="header-content">
                    {t("email")}
                    {getSortIcon("email")}
                  </div>
                </th>
                <th
                  className="sortable-header min-w-150"
                  onClick={() => handleSort("created")}
                >
                  <div className="header-content">
                    {t("created")}
                    {getSortIcon("created")}
                  </div>
                </th>
                <th className="min-w-120">{t("viewProfile")}</th>
                <th className="min-w-180">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((user) => (
                <tr key={user._id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    {new Date(user.createdAt).toLocaleDateString(
                      language === "bg" ? "bg-BG" : "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )}
                  </td>
                  <td>
                    {user.role !== "admin" && (
                      <button
                        className="user-profile-link"
                        onClick={() => handleViewProfile(user._id)}
                      >
                        {t("viewProfile")}
                      </button>
                    )}
                  </td>
                  <td>
                    {user.role !== "admin" && (
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                {t("previous")}
              </button>
              <span className="pagination-info">
                {t("page")} {currentPage} {t("of")} {totalPages} (
                {sortedData.length} {t("total")})
              </span>
              <button
                className="pagination-button"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                {t("next")}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Modal */}
      {deleteStep && userToDelete && (
        <div className="modal-overlay">
          <div className="modal modal-danger">
            {deleteStep === "warning" && (
              <>
                <h2 className="modal-title">{t("deleteAccount")}</h2>
                <p className="modal-text">
                  {t("adminDeleteAccountWarning")}
                </p>
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
                <h2 className="modal-title">
                  {t("adminReasonForDeletion")}
                </h2>
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
                <h2 className="modal-title">
                  {t("adminConfirmDeletion")}
                </h2>
                <p className="modal-text">
                  {t("adminConfirmDeletionText").replace(
                    "{username}",
                    userToDelete.username,
                  )}
                </p>
                <div className="modal-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setDeleteStep("reason");
                    }}
                  >
                    {t("no")}
                  </button>
                  <button
                    className="btn-danger"
                    onClick={handleDeleteConfirm}
                  >
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
                  <button
                    className="btn-primary"
                    onClick={handleBanContinue}
                  >
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
                    <label className="form-label">
                      {t("reasonForBan")}
                    </label>
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
                    onClick={() => {
                      setBanUnbanStep("reason");
                    }}
                  >
                    {t("goBack")}
                  </button>
                  <button
                    className="btn-danger"
                    onClick={handleBanConfirm}
                  >
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
              <button
                className="btn-primary"
                onClick={handleUnbanConfirm}
              >
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
              <div className="loading loading-centered">
                {t("loading")}
              </div>
            ) : (
              <>
                <div className="modal-close-container">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="btn-close"
                  >
                    &times;
                  </button>
                </div>

                <div className="preview-header">
                  {/* Profile Picture */}
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

                  {/* User Info */}
                  <div className="preview-info">
                    <h1 className="preview-username">
                      @{selectedUser.username}
                    </h1>
                    <p className="preview-member-since">
                      {t("memberSince")}:{" "}
                      {new Date(selectedUser.createdAt).toLocaleDateString(
                        language === "bg" ? "bg-BG" : "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </p>

                    {/* Stats */}
                    <div className="preview-stats">
                      <div className="preview-stat-item">
                        <div className="preview-stat-value">
                          {userPosts.length}
                        </div>
                        <div className="preview-stat-label">
                          {t("posts")}
                        </div>
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

                {/* Bio */}
                {selectedUser.bio && (
                  <div className="preview-bio-section">
                    <h3 className="preview-bio-title">
                      {t("bio")}
                    </h3>
                    <p className="preview-bio-content">
                      {selectedUser.bio}
                    </p>
                  </div>
                )}

                {/* Past Usernames */}
                {selectedUser?.pastUsernames && selectedUser.pastUsernames.length > 0 && (
                  <PastUsernames pastUsernames={selectedUser.pastUsernames} className="preview-section mb-24" />
                )}

                {/* Divider */}
                <hr className="preview-divider" />

                {/* Category Tabs */}
                {userCategories.length > 0 && (
                  <div className="preview-category-tabs">
                    {/* All Button */}
                    <button
                      onClick={() => setSelectedUserCategoryId(null)}
                      className={`preview-category-tab ${selectedUserCategoryId === null ? 'active' : ''}`}
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
                          className={`preview-category-tab ${selectedUserCategoryId === category._id ? 'active' : ''}`}
                        >
                          {getCategoryDisplayName(category.name)}
                        </button>
                      ))}
                  </div>
                )}

                {/* Posts Grid */}
                {(() => {
                  const filteredPosts = userPosts.filter(
                    (post) =>
                      !selectedUserCategoryId ||
                      (post.category &&
                        post.category._id === selectedUserCategoryId),
                  );

                  if (filteredPosts.length === 0) {
                    return (
                      <EmptyState
                        icon={<span className="material-icons">article</span>}
                        title={
                          selectedUserCategoryId
                            ? t("noPostsFound")
                            : t("noPostsAvailable")
                        }
                      />
                    );
                  }

                  return (
                    <div className="cards-grid posts-grid">
                      {filteredPosts.map((post) => (
                        <div
                          key={post._id}
                          className="card preview-post-card"
                        >
                          {/* Post Image if exists */}
                          {post.image && post.image.length > 0 && (
                            <div className="preview-post-image-container">
                              <img
                                src={post.image[0]}
                                alt={post.title}
                                className="preview-post-card-image"
                              />
                            </div>
                          )}
                          {/* Post Title */}
                          <h3 className="preview-post-card-title">
                            {post.title}
                          </h3>
                          {/* Category & Date */}
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
                          {/* Likes count */}
                          <div className="preview-post-likes">
                            <span className="material-icons">
                              favorite
                            </span>
                            {post.likes?.length || 0}
                          </div>
                        </div>
                      ))}
                  </div>
                )})()}
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
