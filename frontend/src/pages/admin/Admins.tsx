import { useState, useEffect, useMemo, useRef } from "react";
import api from "../../services/api";
import { adminAPI } from "../../services/admin-api";
import "../../styles/shared.css";
import "./Admins.css";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation } from "../../utils/translations";
import Footer from "../../components/Footer";
import Snackbar from "../../components/Snackbar";
import { useSnackbar } from "../../utils/snackbar";

/**
 * @file Admins.tsx
 * @description Admin management page - list all admin users and create new admin accounts.
 * Admins can view the list of all admin users and create new admins by email invitation.
 *
 * Features:
 * - List all admin users with username, email, join date
 * - Sortable table columns (username, email, createdAt)
 * - Search filter by username/email
 * - Pagination (20 items per page)
 * - Add new admin modal: enter email → backend creates admin account with auto-generated password sent via email
 * - Responsive layout with AdminSidebar and Footer
 *
 * Access Control:
 * - Route protected by AdminRoute (only accessible to admin users)
 *
 * Business Logic:
 * - Create Admin: POST /api/admin/create-admin with email
 *   - Backend extracts username from email (before @)
 *   - Generates default password: username + "123!@#"
 *   - Sends credentials email to new admin
 *   - Returns created admin user (id, username, email, role)
 *
 * @page
 * @requires useState - Admins list, loading, error, search, sort, pagination, modal state
 * @requires useEffect - Fetch admins on mount
 * @requires useThemeLanguage - Translations
 * @requires useMemo - Computed filtered/sorted/paginated admins list
 * @requires useRef - Table container ref for scroll/size management (maybe future use)
 * @requires api - API instance for GET /users/admins
 * @requires adminAPI - POST /admin/create-admin
 * @requires Snackbar - Success/error feedback (create admin)
 * @requires AdminSidebar - Admin navigation
 * @requires Footer - Footer component
 */

type SortDirection = "asc" | "desc" | null;

const Admins = () => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const [sortState, setSortState] = useState<{
    column: string | null;
    direction: SortDirection;
  }>({ column: null, direction: null });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/users/admins");
      setAdmins(response.data);
    } catch (err: any) {
      console.error("Failed to fetch admins:", err);
      setError(t("failedToLoadAdmins"));
    } finally {
      setLoading(false);
    }
  };

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

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminEmail || !adminEmail.includes("@")) {
      showError(t("emailMustContainAt"));
      return;
    }

    try {
      await adminAPI.createAdmin(adminEmail);
      showSuccess(t("adminAccountCreatedSuccess"));
      setShowAddAdmin(false);
      setAdminEmail("");
      await fetchAdmins();
    } catch (error: any) {
      showError(t("failedToCreateAdmin"));
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleSort = (column: string | null) => {
    let direction: SortDirection;
    if (sortState.column !== column) {
      direction = "asc";
    } else if (sortState.direction === "asc") {
      direction = "desc";
    } else {
      direction = null;
      column = null;
    }
    setSortState({ column, direction });
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      language === "bg" ? "bg-BG" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      },
    );
  };

  const filteredAndSortedAdmins = useMemo(() => {
    let result = [...admins];

    // Filter by search query (username only)
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter((admin) =>
        admin.username.toLowerCase().includes(query),
      );
    }

    // Sort
    if (sortState.column && sortState.direction) {
      result.sort((a, b) => {
        let aVal: any = a[sortState.column!];
        let bVal: any = b[sortState.column!];

        if (sortState.column === "created") {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }

        if (aVal < bVal) return sortState.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortState.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [admins, searchQuery, sortState]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedAdmins.length / itemsPerPage);
  const paginatedData = filteredAndSortedAdmins.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortState]);

  // Click-and-drag scrolling
  const handleMouseDown = (e: React.MouseEvent) => {
    const container = tableContainerRef.current;
    if (!container) return;

    // Only start drag if clicking on the container (not on interactive elements)
    if (
      (e.target as HTMLElement).tagName === "INPUT" ||
      (e.target as HTMLElement).tagName === "BUTTON" ||
      (e.target as HTMLElement).tagName === "A" ||
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest("a")
    ) {
      return;
    }

    const startX = e.pageX - container.offsetLeft;
    const scrollLeft = container.scrollLeft;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const x = moveEvent.pageX - container.offsetLeft;
      const walk = (x - startX) * 2;
      container.scrollLeft = scrollLeft - walk;
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      container.style.cursor = "grab";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    container.style.cursor = "grabbing";
  };

  if (loading) {
    return (
      <div>
        <div>
          <div className="loading">{t("loading")}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div>
          <div className="error-box">
            <p>{error}</p>
            <button className="btn-primary" onClick={fetchAdmins}>
              {t("retry")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div>
        <div className="page-header">
          <h1 className="page-title">{t("admins")}</h1>
          <div className="page-actions">
            <button
              className="btn-secondary icon-btn mr-2"
              onClick={fetchAdmins}
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
            <button
              className="btn-primary"
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

        {filteredAndSortedAdmins.length === 0 ? (
          <EmptyState
            icon={<span className="material-icons">person_off</span>}
            title={searchQuery.trim() !== "" ? t("noSearchResults") : t("noUsersFound")}
          />
        ) : (
          <>
            <div
              className="table-container table-grab"
              ref={tableContainerRef}
              onMouseDown={handleMouseDown}
            >
              {/* Click-and-drag scrolling wrapper */}
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
                        {t("memberSince")}
                        {getSortIcon("created")}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((admin) => (
                    <tr key={admin._id}>
                      <td>{admin.username}</td>
                      <td>{admin.email}</td>
                      <td>{formatDate(admin.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  {"<"}
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      className={`pagination-button ${
                        currentPage === page ? "active" : ""
                      }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ),
                )}
                <button
                  className="pagination-button"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  {">"}
                </button>
              </div>
            )}
          </>
        )}

        {/* Add Admin Modal */}
        {showAddAdmin && (
          <div className="modal-overlay">
            <div className="modal">
              <h2 className="modal-title">{t("addAdmin")}</h2>
              <form onSubmit={handleAddAdmin}>
                <div className="form-group">
                  <label className="form-label">{t("email")}</label>
                  <input
                    type="email"
                    className="form-input"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    placeholder={t("enterAdminEmail")}
                  />
                  <p className="helper-text">
                    {t("adminEmailInfo")}
                  </p>
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setShowAddAdmin(false);
                      setAdminEmail("");
                    }}
                  >
                    {t("cancel")}
                  </button>
                  <button type="submit" className="btn-primary">
                    {t("createAdmin")}
                  </button>
                </div>
              </form>
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

export default Admins;
