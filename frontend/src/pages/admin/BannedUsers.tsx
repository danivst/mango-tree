import { useState, useEffect, useMemo } from "react";
import { adminAPI } from "../../services/admin-api";
import Snackbar from "../../components/Snackbar";
import { useAdminData } from "../../context/AdminDataContext";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation } from "../../utils/translations";
import { sortData, paginateData, getTotalPages, SortState } from "../../utils/table-utils";
import "../../styles/shared.css";
import Footer from "../../components/Footer";
import { useSnackbar } from "../../utils/snackbar";
import { AdminTable, ColumnDef } from "../../components/AdminTable";

const BannedUsers = () => {
  const { bannedUsers, bannedUsersState, fetchBannedUsers } = useAdminData();
  const { loading, error, hasFetched } = bannedUsersState;
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();
  const [unbanUserId, setUnbanUserId] = useState<string | null>(null);
  const [showUnbanConfirm, setShowUnbanConfirm] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteStep, setDeleteStep] = useState<"warning" | "reason" | "confirm" | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFrom, dateTo]);

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
            return "";
        }
      },
    );
  }, [filteredData, sortState]);

  const paginatedData = useMemo(() => {
    return paginateData(sortedData, currentPage, itemsPerPage);
  }, [sortedData, currentPage]);

  const totalPages = useMemo(() => {
    return getTotalPages(sortedData.length, itemsPerPage);
  }, [sortedData.length]);

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

  const handleRefresh = async () => {
    try {
      await fetchBannedUsers();
    } catch (err: any) {
      showError(t("failedToLoadBannedUsers"));
    }
  };

  const handleUnbanClick = (bannedUserId: string) => {
    setUnbanUserId(bannedUserId);
    setShowUnbanConfirm(true);
  };

  const handleUnbanConfirm = async () => {
    if (!unbanUserId) return;
    try {
      await adminAPI.unbanUser(unbanUserId);
      showSuccess(`User ${userToUnban?.username} unbanned successfully.`);
      setShowUnbanConfirm(false);
      setUnbanUserId(null);
      await fetchBannedUsers();
    } catch (error: any) {
      showError(t("failedToUnbanUser"));
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
      showSuccess(`User ${userToDelete?.username} deleted successfully.`);
      setDeleteStep(null);
      setDeleteUserId(null);
      setDeleteReason("");
      await fetchBannedUsers();
    } catch (error: any) {
      showError(t("failedToDeleteUser"));
    }
  };

  const userToUnban = useMemo(() => {
    return bannedUsers.find((user) => user._id === unbanUserId);
  }, [unbanUserId, bannedUsers]);

  const userToDelete = useMemo(() => {
    return bannedUsers.find((user) => user._id === deleteUserId);
  }, [deleteUserId, bannedUsers]);

  // Columns definition
  const columns: ColumnDef<any>[] = [
    {
      key: 'username',
      label: t('username'),
      sortable: true,
      minWidth: '150px',
      render: (user) => user.username
    },
    {
      key: 'email',
      label: t('email'),
      sortable: true,
      minWidth: '200px',
      render: (user) => user.email
    },
    {
      key: 'ban_reason',
      label: t('reasonForBan'),
      sortable: true,
      minWidth: '200px',
      render: (user) => user.ban_reason
    },
    {
      key: 'banned_at',
      label: t('bannedAt'),
      sortable: true,
      minWidth: '150px',
      render: (user) => new Date(user.banned_at).toLocaleDateString(
        language === "bg" ? "bg-BG" : "en-US",
        { year: "numeric", month: "short", day: "numeric" }
      )
    }
  ];

  // Empty state
  const emptyState = {
    icon: <span className="material-icons">person_off</span>,
    title: t('noBannedUsersFound')
  };

  return (
    <div>
      <h1 className="page-container-title">{t("bannedUsers")}</h1>

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
        hasFetched={hasFetched}
        onRefresh={handleRefresh}
        emptyState={emptyState}
        enableDragScroll={true}
        filterControls={
          <>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="date-input"
              placeholder="From"
              style={{ minWidth: '150px' }}
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="date-input"
              placeholder="To"
              style={{ minWidth: '150px' }}
            />
          </>
        }
        actionsRender={(user) => (
          <div className="table-actions">
            <button
              className="btn-danger"
              onClick={() => handleDeleteClick(user._id)}
            >
              {t("delete")}
            </button>
            <button
              className="btn-admin-action"
              onClick={() => handleUnbanClick(user._id)}
            >
              {t("unban")}
            </button>
          </div>
        )}
      />

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
                    <label className="form-label">{t("adminReasonForDeletion")}</label>
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
                  {t("adminConfirmDeletionText").replace("{username}", userToDelete.username)}
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
        onClose={closeSnackbar}
      />
      <Footer />
    </div>
  );
};

export default BannedUsers;
