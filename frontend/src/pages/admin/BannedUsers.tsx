import { useState, useEffect, useMemo, useRef } from "react";
import { adminAPI } from "../../services/adminAPI";
import Snackbar from "../../components/Snackbar";
import {
  sortData,
  paginateData,
  getTotalPages,
  SortState,
} from "../../utils/tableUtils";
import "./AdminPages.css";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation } from "../../utils/translations";
import { useAdminData } from "../../context/AdminDataContext";
import Footer from "../../components/Footer";

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
        message: err.response?.data?.message || "Failed to load banned users",
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
        message: error.response?.data?.message || "Failed to unban user",
        type: "error",
      });
    }
  };

  const userToUnban = useMemo(() => {
    return bannedUsers.find((user) => user._id === unbanUserId);
  }, [unbanUserId, bannedUsers]);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">{t("bannedUsers")}</h1>
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
          {/* Date range filters can be added here if needed */}
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
      ) : paginatedData.length === 0 ? (
        <div className="admin-no-entries">{t("noBannedUsersFound")}</div>
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
                  onClick={() => handleSort("ban_reason")}
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
                    {t("reasonForBan")}
                    {getSortIcon("ban_reason")}
                  </div>
                </th>
                <th
                  className="sortable-header"
                  onClick={() => handleSort("banned_at")}
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
                    {t("bannedAt")}
                    {getSortIcon("banned_at")}
                  </div>
                </th>
                <th style={{ minWidth: "100px" }}>{t("actions")}</th>
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
                    <button
                      className="admin-button-danger" // Reusing danger style for Unban for consistency with prompt
                      onClick={() => handleUnbanClick(bannedUser._id)}
                    >
                      {t("unban")}
                    </button>
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

      {/* Unban Confirmation Modal */}
      {showUnbanConfirm && userToUnban && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-danger">
            <h2 className="admin-modal-title">{t("confirmUnban")}</h2>
            <p className="admin-modal-text">
              {t("unbanWarning").replace("{username}", userToUnban.username)}
            </p>
            <div className="admin-modal-actions">
              <button
                className="admin-button-secondary"
                onClick={() => {
                  setShowUnbanConfirm(false);
                  setUnbanUserId(null);
                }}
              >
                {t("cancel")}
              </button>
              <button
                className="admin-button-danger"
                onClick={handleUnbanConfirm}
              >
                {t("unban")}
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
      <Footer />
    </div>
  );
};

export default BannedUsers;