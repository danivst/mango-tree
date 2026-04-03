import { useState, useEffect, useMemo, useRef } from "react";
import { adminAPI } from "../../services/admin-api";
import Snackbar from "../../components/Snackbar";
import {
  sortData,
  paginateData,
  getTotalPages,
  SortState,
} from "../../utils/table-utils";
import "../../styles/shared.css";
import "./BannedUsers.css";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation } from "../../utils/translations";
import { useAdminData } from "../../context/AdminDataContext";
import Footer from "../../components/Footer";

/**
 * @file BannedUsers.tsx
 * @description Admin page for viewing and managing banned users.
 * Displays users who have been banned, with ban reason and ban date.
 *
 * Features:
 * - List all banned users (from AdminDataContext)
 * - Sortable columns: username, email, ban reason, ban date
 * - Search filter by username/email
 * - Date range filter (ban date from/to) - UI present but filter not implemented
 * - Pagination (20 per page)
 * - Unban action with confirmation modal (immediate, no reason required)
 *
 * Data Source:
 * - Uses AdminDataContext.bannedUsers (fetched by initialize() or fetchBannedUsers())
 *
 * Access Control:
 * - Route protected by AdminRoute (admin only)
 *
 * @page
 * @requires useState - Banned users list, search, sort, pagination, modal state
 * @requires useEffect - No direct effect; data from AdminDataContext
 * @requires useMemo - Filtered/sorted/paginated computed list
 * @requires useThemeLanguage - Translations
 * @requires useAdminData - Access to bannedUsers array and bannedUsersState
 * @requires Snackbar - Feedback on unban success/error
 * @requires Footer - Footer component
 * @requires sortData, paginateData, getTotalPages - Table utilities
 */

const BannedUsers = () => {
  const { bannedUsers, bannedUsersState, fetchBannedUsers } = useAdminData();
  const { loading, error, hasFetched } = bannedUsersState;
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, _setDateFrom] = useState("");
  const [dateTo, _setDateTo] = useState("");
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);
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
  const [unbanUserId, setUnbanUserId] = useState<string | null>(null); // New state for user to unban
  const [showUnbanConfirm, setShowUnbanConfirm] = useState(false); // New state for unban modal visibility
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null); // New state for user to delete
  const [deleteStep, setDeleteStep] = useState<"warning" | "reason" | "confirm" | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

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

  const filteredData = useMemo(() => {
    let filtered = bannedUsers;

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.username.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.ban_reason.toLowerCase().includes(query),
      );
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter((user) => {
        const userDate = new Date(user.banned_at);
        return userDate >= fromDate;
      });
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((user) => {
        const userDate = new Date(user.banned_at);
        return userDate <= toDate;
      });
    }

    return filtered;
  }, [searchQuery, dateFrom, dateTo, bannedUsers]);

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
          case "ban_reason":
            return user.ban_reason;
          case "banned_at":
            return user.banned_at;
          default:
            return null;
        }
      },
    );
  }, [filteredData, sortState]);

  const paginatedData = useMemo(() => {
    return paginateData(sortedData, currentPage, itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return getTotalPages(sortedData.length, itemsPerPage);
  }, [sortedData.length, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFrom, dateTo]);

  const handleSort = (column: string) => {
    setSortState((prev) => {
      if (prev.column === column) {
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

  const handleUnbanClick = (bannedUserId: string) => {
    setUnbanUserId(bannedUserId);
    setShowUnbanConfirm(true);
  };

  const handleRefresh = async () => {
    try {
      await fetchBannedUsers();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: t("failedToLoadBannedUsers"),
        type: "error",
      });
    }
  };

  const handleUnbanConfirm = async () => {
    if (!unbanUserId) return;
    try {
      await adminAPI.unbanUser(unbanUserId);
      setSnackbar({
        open: true,
        message: `User ${userToUnban?.username} unbanned successfully.`,
        type: "success",
      });
      setShowUnbanConfirm(false);
      setUnbanUserId(null);
      await fetchBannedUsers(); // Refresh the list
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t("failedToUnbanUser"),
        type: "error",
      });
    }
  };

  const handleDeleteClick = (userId: string) => {
    setDeleteUserId(userId);
    setDeleteStep("warning");
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
        message: `User ${userToDelete?.username} deleted successfully.`,
        type: "success",
      });
      setDeleteStep(null);
      setDeleteUserId(null);
      setDeleteReason("");
      await fetchBannedUsers(); // Refresh the list
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t("failedToDeleteUser"),
        type: "error",
      });
    }
  };

  const userToUnban = useMemo(() => {
    return bannedUsers.find((user) => user._id === unbanUserId);
  }, [unbanUserId, bannedUsers]);

  const userToDelete = useMemo(() => {
    return bannedUsers.find((user) => user._id === deleteUserId);
  }, [deleteUserId, bannedUsers]);

  return (
    <div>
      <div className="page-container-header">
        <h1 className="page-container-title">{t("bannedUsers")}</h1>
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
          {/* Date range filters can be added here if needed */}
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
      ) : paginatedData.length === 0 ? (
        <div className="no-results">{t("noBannedUsersFound")}</div>
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
                  <div className="sort-header-content">
                    {t("username")}
                    {getSortIcon("username")}
                  </div>
                </th>
                <th
                  className="sortable-header min-w-200"
                  onClick={() => handleSort("email")}
                >
                  <div className="sort-header-content">
                    {t("email")}
                    {getSortIcon("email")}
                  </div>
                </th>
                <th
                  className="sortable-header min-w-200"
                  onClick={() => handleSort("ban_reason")}
                >
                  <div className="sort-header-content">
                    {t("reasonForBan")}
                    {getSortIcon("ban_reason")}
                  </div>
                </th>
                <th
                  className="sortable-header min-w-150"
                  onClick={() => handleSort("banned_at")}
                >
                  <div className="sort-header-content">
                    {t("bannedAt")}
                    {getSortIcon("banned_at")}
                  </div>
                </th>
                <th className="min-w-100">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((bannedUser) => (
                <tr key={bannedUser._id}>
                  <td>{bannedUser.username}</td>
                  <td>{bannedUser.email}</td>
                  <td>{bannedUser.ban_reason}</td>
                  <td>
                    {new Date(bannedUser.banned_at).toLocaleDateString(
                      language === "bg" ? "bg-BG" : "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn-danger"
                        onClick={() => handleDeleteClick(bannedUser._id)}
                      >
                        {t("delete")}
                      </button>
                      <button
                        className="btn-admin-action"
                        onClick={() => handleUnbanClick(bannedUser._id)}
                      >
                        {t("unban")}
                      </button>
                    </div>
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

      {/* Unban Confirmation Modal */}
      {showUnbanConfirm && userToUnban && (
        <div className="modal-overlay">
          <div className="modal modal-danger">
            <h2 className="modal-title">{t("confirmUnban")}</h2>
            <p className="modal-text">
              {t("unbanWarning").replace("{username}", userToUnban.username)}
            </p>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowUnbanConfirm(false);
                  setUnbanUserId(null);
                }}
              >
                {t("cancel")}
              </button>
              <button
                className="btn-admin-action"
                onClick={handleUnbanConfirm}
              >
                {t("unban")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal - Multi-step */}
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

      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
      <Footer />
    </div>
  );
};

export default BannedUsers;
