import { useState, useEffect, useMemo, useRef } from "react";
import api from "../../services/api";
import "./AdminPages.css";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation } from "../../utils/translations";
import AdminSidebar from "../../components/AdminSidebar";

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

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/users/admins");
      setAdmins(response.data);
    } catch (err: any) {
      console.error("Failed to fetch admins:", err);
      setError(err.response?.data?.message || "Failed to load admins");
    } finally {
      setLoading(false);
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

  const filteredAndSortedAdmins = useMemo(() => {
    let result = [...admins];

    // Filter by search query (username only)
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter((admin) =>
        admin.username.toLowerCase().includes(query)
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
    currentPage * itemsPerPage
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
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <AdminSidebar />
        <div className="admin-page" style={{ flex: 1 }}>
          <div className="admin-loading">{t("loading")}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <AdminSidebar />
        <div className="admin-page" style={{ flex: 1 }}>
          <div className="admin-error">
            <p>{error}</p>
            <button className="admin-button-primary" onClick={fetchAdmins}>
              {t("retry") || "Retry"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <AdminSidebar />
      <div className="admin-page" style={{ flex: 1 }}>
        <div className="admin-page-header">
          <h1 className="admin-page-title">{t("admins")}</h1>
          <div className="admin-page-actions">
            <button
              className="admin-button-secondary"
              onClick={fetchAdmins}
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
          </div>
        </div>

        {filteredAndSortedAdmins.length === 0 ? (
          <div className="admin-loading">
            {searchQuery.trim() !== "" ? t("noSearchResults") : t("noUsersFound")}
          </div>
        ) : (
          <>
            <div
              className="admin-table-container"
              ref={tableContainerRef}
              onMouseDown={handleMouseDown}
              style={{ cursor: "grab" }}
            >
              {/* Click-and-drag scrolling wrapper */}
              <table className="admin-table">
                <thead>
                  <tr>
                    <th
                      className="sortable-header"
                      onClick={() => handleSort("username")}
                      style={{ minWidth: "150px" }}
                    >
                      <div className="header-content">
                        {t("username")}
                        {getSortIcon("username")}
                      </div>
                    </th>
                    <th
                      className="sortable-header"
                      onClick={() => handleSort("email")}
                      style={{ minWidth: "200px" }}
                    >
                      <div className="header-content">
                        {t("email")}
                        {getSortIcon("email")}
                      </div>
                    </th>
                    <th
                      className="sortable-header"
                      onClick={() => handleSort("created")}
                      style={{ minWidth: "150px" }}
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
              <div className="admin-pagination">
                <button
                  className="admin-pagination-button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  {"<"}
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`admin-pagination-button ${
                      currentPage === page ? "active" : ""
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="admin-pagination-button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  {">"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Admins;
