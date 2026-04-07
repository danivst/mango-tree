import { useState, useEffect, useMemo } from "react";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation } from "../../utils/translations";
import api from "../../services/api";
import { adminAPI } from "../../services/admin-api";
import { sortData, paginateData, getTotalPages, SortState, SortDirection } from "../../utils/table-utils";
import "../../styles/shared.css";
import "./Admins.css";
import Footer from "../../components/Footer";
import Snackbar from "../../components/Snackbar";
import { useSnackbar } from "../../utils/snackbar";
import { AdminTable, ColumnDef } from "../../components/AdminTable";

const Admins = () => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);

  const [sortState, setSortState] = useState<SortState>({ column: null, direction: null });
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

  // Filter
  const filteredAdmins = useMemo(() => {
    if (searchQuery.trim() === "") return admins;
    const query = searchQuery.toLowerCase();
    return admins.filter(admin => admin.username.toLowerCase().includes(query));
  }, [admins, searchQuery]);

  // Sort
  const sortedAdmins = useMemo(() => {
    return sortData(filteredAdmins, sortState.column, sortState.direction, (admin, column) => {
      switch (column) {
        case 'username':
          return admin.username;
        case 'email':
          return admin.email;
        case 'created':
          return admin.createdAt;
        default:
          return "";
      }
    });
  }, [filteredAdmins, sortState]);

  // Paginate
  const paginatedData = useMemo(() => {
    return paginateData(sortedAdmins, currentPage, itemsPerPage);
  }, [sortedAdmins, currentPage]);

  const totalPages = useMemo(() => {
    return getTotalPages(sortedAdmins.length, itemsPerPage);
  }, [sortedAdmins.length]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortState.column, sortState.direction]);

  const handleRefresh = async () => {
    try {
      await fetchAdmins();
    } catch (err: any) {
      showError(t("failedToLoadAdmins"));
    }
  };

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

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      language === "bg" ? "bg-BG" : "en-US",
      { year: "numeric", month: "short", day: "numeric" }
    );
  };

  // Columns definition
  const columns: ColumnDef<any>[] = [
    {
      key: 'username',
      label: t('username'),
      sortable: true,
      minWidth: '150px',
      render: (admin) => admin.username
    },
    {
      key: 'email',
      label: t('email'),
      sortable: true,
      minWidth: '200px',
      render: (admin) => admin.email
    },
    {
      key: 'created',
      label: t('memberSince'),
      sortable: true,
      minWidth: '150px',
      render: (admin) => formatDate(admin.createdAt)
    }
  ];

  // Empty state
  const emptyState = {
    icon: <span className="material-icons">person_off</span>,
    title: searchQuery.trim() !== "" ? t("noSearchResults") : t("noUsersFound")
  };

  return (
    <div>
      <h1 className="page-container-title">{t("admins")}</h1>

      <AdminTable<any>
        data={paginatedData}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        sortState={sortState}
        onSort={handleSort}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        columns={columns}
        loading={loading}
        error={error}
        hasFetched={!loading && !error} // hasFetched true after first load completes
        onRefresh={handleRefresh}
        emptyState={emptyState}
        filterControls={
          <button
            className="btn-primary"
            onClick={() => setShowAddAdmin(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t("addAdmin")}
          </button>
        }
      />

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
                <p className="helper-text">{t("adminEmailInfo")}</p>
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
  );
};

export default Admins;
