import { useState, useEffect, useMemo, useRef } from "react";
import { adminAPI } from "../../services/adminAPI";
import Snackbar from "../../components/Snackbar";
import api from "../../services/api";
import { usersAPI, UserProfile, Post as PostType } from "../../services/api";
import {
  sortData,
  paginateData,
  getTotalPages,
  SortState,
} from "../../utils/tableUtils";
import "./AdminPages.css";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation, Language } from "../../utils/translations";
import { useAdminData } from "../../context/AdminDataContext";
import { Category } from "../../services/adminAPI";

type DeleteStep = "warning" | "reason" | "confirm" | null;
type BanUnbanStep = "warning" | "reason" | "confirm" | "unban_confirm" | null;

const Users = () => {
  const { users, usersState, fetchUsers } = useAdminData();
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
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: "success" | "error";
  }>({ open: false, message: "", type: "success" });

  // User Profile Preview states
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [userPosts, setUserPosts] = useState<PostType[]>([]);
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [selectedUserCategoryId, setSelectedUserCategoryId] = useState<string | null>(null);

  // Compute special categories (recipe, question, flex) in specific order
  const specialCategories = useMemo(() => {
    if (!userCategories.length) return [];
    const lowerNames = ["recipe", "flex", "question"];
    const filtered = userCategories.filter((cat) => lowerNames.includes(cat.name.toLowerCase()));
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
  const categoryDisplayLanguage: Language = selectedUser?.language === "bg" ? "bg" : language;

  const getCategoryDisplayName = (categoryName: string, lang: Language = categoryDisplayLanguage) => {
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
    if ((e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).tagName === 'BUTTON' ||
        (e.target as HTMLElement).tagName === 'A' ||
        (e.target as HTMLElement).closest('button') ||
        (e.target as HTMLElement).closest('a')) {
      return;
    }

    e.preventDefault();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    scrollStartLeft.current = container.scrollLeft;

    document.body.style.userSelect = 'none';
    if (container) container.style.cursor = 'grabbing';
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
        document.body.style.userSelect = '';
        const container = tableContainerRef.current;
        if (container) container.style.cursor = 'grab';
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
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
          style={{ opacity: 0.3 }}
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
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to load users",
        type: "error",
      });
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
      setSnackbar({
        open: true,
        message: t("accountDeletedSuccessfully"),
        type: "success",
      });
      setDeleteStep(null);
      setDeleteUserId(null);
      setDeleteReason("");
      await fetchUsers();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to delete user",
        type: "error",
      });
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
      setSnackbar({
        open: true,
        message: `User ${userToBan?.username} banned successfully.`,
        type: "success",
      });
      setBanUnbanStep(null);
      setBanUserId(null);
      setBanReason("");
      await fetchUsers(); // Refresh the user list
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to ban user",
        type: "error",
      });
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
      setSnackbar({
        open: true,
        message: `User ${userToUnban?.username} unbanned successfully.`,
        type: "success",
      });
      setBanUnbanStep(null);
      setBanUserId(null);
      await fetchUsers(); // Refresh the user list
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to unban user",
        type: "error",
      });
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminEmail || !adminEmail.includes("@")) {
      setSnackbar({
        open: true,
        message: t("emailMustContainAt"),
        type: "error",
      });
      return;
    }

    try {
      await adminAPI.createAdmin(adminEmail);
      setSnackbar({
        open: true,
        message: t("adminAccountCreatedSuccess"),
        type: "success",
      });
      setShowAddAdmin(false);
      setAdminEmail("");
      await fetchUsers();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || t("failedToCreateAdmin"),
        type: "error",
      });
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
      const postsResponse = await api.get<PostType[]>(`/posts/author/${userId}`);
      setUserPosts(postsResponse.data);

      // Fetch categories for post category names (and tabs if needed)
      const categoriesResponse = await api.get<Category[]>("/categories");
      setUserCategories(categoriesResponse.data);

      setSelectedUser(userData);
      setPreviewLoading(false);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to load user profile",
        type: "error",
      });
      setPreviewLoading(false);
    }
  };

  const userToBan = banUserId ? users.find((u) => u._id === banUserId) : null;
  const userToUnban = banUserId ? users.find((u) => u._id === banUserId) : null;
  const userToDelete = deleteUserId ? users.find((u) => u._id === deleteUserId) : null;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">{t("users")}</h1>
        <div className="admin-page-actions">
          <button
            className="admin-button-secondary"
            onClick={handleRefresh}
            disabled={loading}
            style={{ marginRight: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span className="material-icons" style={{ fontSize: '16px' }}>refresh</span>
            {t('refresh') || 'Refresh'}
          </button>
          <input
            type="text"
            className="admin-search-input"
            placeholder={t("search") + "..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className="admin-add-button"
            onClick={() => setShowAddAdmin(true)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t("addAdmin")}
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-error" style={{ color: '#d32f2f', marginBottom: '16px', padding: '12px', background: '#ffebee', borderRadius: '8px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="admin-loading">Loading...</div>
      ) : !hasFetched ? (
        <div className="admin-loading" style={{ textAlign: "center", padding: "40px" }}>
          No data loaded. Click Refresh to load data.
        </div>
      ) : (
        <div
          className="admin-table-container"
          ref={tableContainerRef}
          onMouseDown={handleMouseDown}
          style={{ cursor: 'grab' }}
        >
          {/* Main table with bottom scrollbar */}
          <table className="admin-table">
            <thead>
              <tr>
                <th
                  className="sortable-header"
                  onClick={() => handleSort("username")}
                  style={{ minWidth: "150px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                    }}
                  >
                    {t("username")}
                    {getSortIcon("username")}
                  </div>
                </th>
                <th
                  className="sortable-header"
                  onClick={() => handleSort("email")}
                  style={{ minWidth: "200px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                    }}
                  >
                    {t("email")}
                    {getSortIcon("email")}
                  </div>
                </th>
                <th
                  className="sortable-header"
                  onClick={() => handleSort("created")}
                  style={{ minWidth: "150px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                    }}
                  >
                    {t("created")}
                    {getSortIcon("created")}
                  </div>
                </th>
                <th style={{ minWidth: "120px" }}>{t("viewProfile")}</th>
                <th style={{ minWidth: "180px" }}>{t("actions")}</th>
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
                        className="admin-link"
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          textDecoration: "underline",
                          color: "var(--theme-text)",
                          fontSize: "14px",
                          fontWeight: 500,
                          padding: 0,
                        }}
                        onClick={() => handleViewProfile(user._id)}
                      >
                        {t("viewProfile")}
                      </button>
                    )}
                  </td>
                  <td>
                    {user.role !== "admin" && (
                      <>
                        <button
                          className="admin-delete-button"
                          onClick={() => handleDeleteClick(user._id)}
                        >
                          {t("delete")}
                        </button>
                        {user.isBanned ? (
                          <button
                            className="admin-button-ban"
                            style={{ marginLeft: "8px" }}
                            onClick={() => handleUnbanClick(user._id)}
                          >
                            {t("unban")}
                          </button>
                        ) : (
                          <button
                            className="admin-button-ban"
                            style={{ marginLeft: "8px" }}
                            onClick={() => handleBanClick(user._id)}
                          >
                            {t("ban")}
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="admin-pagination">
              <button
                className="admin-pagination-button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                {t("previous")}
              </button>
              <span className="admin-pagination-info">
                {t("page")} {currentPage} {t("of")} {totalPages} (
                {sortedData.length} {t("total")})
              </span>
              <button
                className="admin-pagination-button"
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
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-danger">
            {deleteStep === "warning" && (
              <>
                <h2 className="admin-modal-title">{t("deleteAccount")}</h2>
                <p className="admin-modal-text">{t("adminDeleteAccountWarning")}</p>
                <div className="admin-modal-actions">
                  <button
                    className="admin-button-secondary"
                    onClick={() => {
                      setDeleteStep(null);
                      setDeleteUserId(null);
                    }}
                  >
                    {t("close")}
                  </button>
                  <button
                    className="admin-button-primary"
                    onClick={handleDeleteContinue}
                  >
                    {t("continue")}
                  </button>
                </div>
              </>
            )}

            {deleteStep === "reason" && (
              <>
                <h2 className="admin-modal-title">{t("adminReasonForDeletion")}</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleDeleteTerminate();
                  }}
                >
                  <div className="admin-form-group">
                    <label className="admin-form-label">
                      {t("adminReasonForDeletion")}
                    </label>
                    <textarea
                      className="admin-form-textarea"
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      required
                      rows={4}
                      placeholder={t("adminReasonForDeletionPlaceholder")}
                    />
                  </div>
                  <div className="admin-modal-actions">
                    <button
                      type="button"
                      className="admin-button-secondary"
                      onClick={handleDeleteBack}
                    >
                      {t("goBack")}
                    </button>
                    <button type="submit" className="admin-button-primary">
                      {t("terminateAccount")}
                    </button>
                  </div>
                </form>
              </>
            )}

            {deleteStep === "confirm" && (
              <>
                <h2 className="admin-modal-title">{t("adminConfirmDeletion")}</h2>
                <p className="admin-modal-text">
                  {t("adminConfirmDeletionText").replace(
                    "{username}",
                    userToDelete.username,
                  )}
                </p>
                <div className="admin-modal-actions">
                  <button
                    className="admin-button-secondary"
                    onClick={() => {
                      setDeleteStep("reason");
                    }}
                  >
                    {t("no")}
                  </button>
                  <button
                    className="admin-button-danger"
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
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-danger">
            {banUnbanStep === "warning" && (
              <>
                <h2 className="admin-modal-title">{t("banUser")}</h2>
                <p className="admin-modal-text">
                  {t("banUserWarning").replace(
                    "{username}",
                    userToBan.username,
                  )}
                </p>
                <div className="admin-modal-actions">
                  <button
                    className="admin-button-secondary"
                    onClick={() => {
                      setBanUnbanStep(null);
                      setBanUserId(null);
                    }}
                  >
                    {t("close")}
                  </button>
                  <button
                    className="admin-button-primary"
                    onClick={handleBanContinue}
                  >
                    {t("continue")}
                  </button>
                </div>
              </>
            )}

            {banUnbanStep === "reason" && (
              <>
                <h2 className="admin-modal-title">{t("reasonForBan")}</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleBanTerminate();
                  }}
                >
                  <div className="admin-form-group">
                    <label className="admin-form-label">
                      {t("reasonForBan")}
                    </label>
                    <textarea
                      className="admin-form-textarea"
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      required
                      rows={4}
                      placeholder={t("reasonForBanPlaceholder")}
                    />
                  </div>
                  <div className="admin-modal-actions">
                    <button
                      type="button"
                      className="admin-button-secondary"
                      onClick={handleBanBack}
                    >
                      {t("goBack")}
                    </button>
                    <button type="submit" className="admin-button-danger">
                      {t("banUser")}
                    </button>
                  </div>
                </form>
              </>
            )}

            {banUnbanStep === "confirm" && (
              <>
                <h2 className="admin-modal-title">{t("confirmBan")}</h2>
                <p className="admin-modal-text">
                  {t("confirmBanText").replace(
                    "{username}",
                    userToBan.username,
                  )}
                </p>
                <div className="admin-modal-actions">
                  <button
                    className="admin-button-secondary"
                    onClick={() => {
                      setBanUnbanStep("reason");
                    }}
                  >
                    {t("goBack")}
                  </button>
                  <button
                    className="admin-button-danger"
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
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-danger">
            <h2 className="admin-modal-title">{t("unbanUser")}</h2>
            <p className="admin-modal-text">
              {t("unbanUserConfirm").replace(
                "{username}",
                userToUnban.username,
              )}
            </p>
            <div className="admin-modal-actions">
              <button
                className="admin-button-secondary"
                onClick={() => {
                  setBanUnbanStep(null);
                  setBanUserId(null);
                }}
              >
                {t("cancel")}
              </button>
              <button
                className="admin-button-primary"
                onClick={handleUnbanConfirm}
              >
                {t("unban")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddAdmin && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-add">
            <h2 className="admin-modal-title">{t("addAdmin")}</h2>
            <form onSubmit={handleAddAdmin}>
              <div className="admin-form-group">
                <label className="admin-form-label">{t("email")}</label>
                <input
                  type="email"
                  className="admin-form-input"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                  placeholder={t("enterAdminEmail")}
                />
                <p
                  style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}
                >
                  {t("adminEmailInfo")}
                </p>
              </div>
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-button-secondary"
                  onClick={() => {
                    setShowAddAdmin(false);
                    setAdminEmail("");
                  }}
                >
                  {t("cancel")}
                </button>
                <button type="submit" className="admin-button-primary">
                  {t("createAdmin")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Profile Preview Modal */}
      {selectedUser && (
        <div className="admin-modal-overlay" style={{ zIndex: 2100 }}>
          <div className="admin-modal" style={{ maxWidth: "900px", maxHeight: "90vh", overflowY: "auto" }}>
            {previewLoading ? (
              <div className="admin-loading" style={{ padding: "40px" }}>{t("loading")}</div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                  <button
                    onClick={() => setSelectedUser(null)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "24px",
                      color: "var(--theme-text)",
                      padding: 0,
                      lineHeight: 1,
                    }}
                  >
                    &times;
                  </button>
                </div>

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
                      {selectedUser.profileImage ? (
                        <img
                          src={selectedUser.profileImage}
                          alt={selectedUser.username}
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
                          }}
                        >
                          {selectedUser.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User Info */}
                  <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0, color: "var(--theme-text)" }}>
                      @{selectedUser.username}
                    </h1>
                    <p style={{ fontSize: "14px", opacity: 0.7, margin: "8px 0 16px 0", color: "var(--theme-text)" }}>
                      {t("memberSince")}: {new Date(selectedUser.createdAt).toLocaleDateString(
                        language === "bg" ? "bg-BG" : "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </p>

                    {/* Stats */}
                    <div style={{ display: "flex", gap: "32px" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--theme-text)" }}>
                          {userPosts.length}
                        </div>
                        <div style={{ fontSize: "14px", color: "var(--theme-text)", opacity: 0.8 }}>
                          {t("posts")}
                        </div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--theme-text)" }}>
                          {selectedUser.followers?.length || 0}
                        </div>
                        <div style={{ fontSize: "14px", color: "var(--theme-text)", opacity: 0.8 }}>
                          {t("followers")}
                        </div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--theme-text)" }}>
                          {selectedUser.following?.length || 0}
                        </div>
                        <div style={{ fontSize: "14px", color: "var(--theme-text)", opacity: 0.8 }}>
                          {t("following")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {selectedUser.bio && (
                  <div style={{ marginBottom: "24px" }}>
                    <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", color: "var(--theme-text)" }}>
                      {t("bio")}
                    </h3>
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
                      {selectedUser.bio}
                    </p>
                  </div>
                )}

                {/* Divider */}
                <hr style={{ border: 0, borderTop: "1px solid var(--theme-text)", opacity: 0.2, margin: "32px 0" }} />

                {/* Category Tabs */}
                {userCategories.length > 0 && (
                  <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
                    {/* All Button */}
                    <button
                      onClick={() => setSelectedUserCategoryId(null)}
                      style={{
                        flex: 1,
                        padding: "12px 16px",
                        border: selectedUserCategoryId === null ? "2px solid var(--theme-text)" : "none",
                        borderRadius: "8px",
                        background: "transparent",
                        color: "var(--theme-text)",
                        fontSize: "16px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        opacity: selectedUserCategoryId === null ? 1 : 0.6,
                      }}
                    >
                      {t("all") || "All"}
                    </button>
                    {specialCategories
                      .filter((category) => category._id)
                      .map((category) => (
                        <button
                          key={category._id}
                          onClick={() => setSelectedUserCategoryId(category._id)}
                          style={{
                            flex: 1,
                            padding: "12px 16px",
                            border: selectedUserCategoryId === category._id ? "2px solid var(--theme-text)" : "none",
                            borderRadius: "8px",
                            background: "transparent",
                            color: "var(--theme-text)",
                            fontSize: "16px",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            opacity: selectedUserCategoryId === category._id ? 1 : 0.6,
                          }}
                        >
                          {getCategoryDisplayName(category.name)}
                        </button>
                      ))}
                  </div>
                )}

                {/* Posts Grid */}
                {userPosts.length === 0 ? (
                  <div className="admin-loading" style={{ textAlign: "center", padding: "40px" }}>
                    {selectedUserCategoryId ? t("noPostsFound") : t("selectCategory")}
                  </div>
                ) : (
                  <div className="admin-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                    {userPosts
                      .filter((post) => !selectedUserCategoryId || (post.category && post.category._id === selectedUserCategoryId))
                      .map((post) => (
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
                          <h3 style={{ fontSize: "18px", fontWeight: 600, margin: 0, color: "var(--theme-text)" }}>
                            {post.title}
                          </h3>
                          {/* Category & Date */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "var(--theme-text)", opacity: 0.8 }}>
                            <span>{post.category ? getCategoryDisplayName(post.category.name) : '—'}</span>
                            <span>{new Date(post.createdAt).toLocaleDateString(
                              language === "bg" ? "bg-BG" : "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}</span>
                          </div>
                          {/* Likes count */}
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "14px", color: "var(--theme-text)", opacity: 0.8 }}>
                            <span className="material-icons" style={{ fontSize: "18px" }}>favorite</span>
                            {post.likes?.length || 0}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </>
            )}
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
  );
};

export default Users;
