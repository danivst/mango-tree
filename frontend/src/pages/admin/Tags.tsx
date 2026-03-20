import { useState, useEffect, useMemo } from "react";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation } from "../../utils/translations";
import { useAdminData } from "../../context/AdminDataContext";
import { adminAPI, Tag } from "../../services/adminAPI";
import Snackbar from "../../components/Snackbar";
import {
  sortData,
  paginateData,
  getTotalPages,
  SortState,
} from "../../utils/tableUtils";
import "./AdminPages.css";

const Tags = () => {
  const { tags, tagsState, fetchTags } = useAdminData();
  const { loading, error, hasFetched } = tagsState;

  const [searchQuery, setSearchQuery] = useState("");
  const [creatorFilter, _setCreatorFilter] = useState<
    "all" | "system" | "admin"
  >("all");
  const [dateFrom, _setDateFrom] = useState("");
  const [dateTo, _setDateTo] = useState("");
  const [showAddTag, setShowAddTag] = useState(false);
  const [tagName, setTagName] = useState("");
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: "success" | "error";
  }>({ open: false, message: "", type: "success" });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTagId, setEditTagId] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState("");


  // Filter tags based on search, creator, and date range
  const filteredData = useMemo(() => {
    let filtered = tags;

    // Search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((tag) =>
        tag.name.toLowerCase().includes(query),
      );
    }

    // Creator filter
    if (creatorFilter === "system") {
      filtered = filtered.filter(
        (tag) => !tag.createdBy || tag.createdBy === "System",
      );
    } else if (creatorFilter === "admin") {
      filtered = filtered.filter(
        (tag) => tag.createdBy && tag.createdBy !== "System",
      );
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter((tag) => {
        const tagDate = new Date(tag.createdAt);
        return tagDate >= fromDate;
      });
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((tag) => {
        const tagDate = new Date(tag.createdAt);
        return tagDate <= toDate;
      });
    }

    return filtered;
  }, [searchQuery, creatorFilter, dateFrom, dateTo, tags]);

  // Sort filtered data
  const sortedData = useMemo(() => {
    return sortData(
      filteredData,
      sortState.column,
      sortState.direction,
      (tag, column) => {
        switch (column) {
          case "name":
            return tag.name;
          case "added":
            return tag.createdAt;
          case "by":
            return tag.createdBy || "System";
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
  }, [searchQuery, creatorFilter, dateFrom, dateTo]);

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
      await fetchTags();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to load tags",
        type: "error",
      });
    }
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

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tagName || tagName.trim().length === 0) {
      setSnackbar({
        open: true,
        message: t("tagNameEmpty"),
        type: "error",
      });
      return;
    }

    if (tagName.length > 20) {
      setSnackbar({
        open: true,
        message: t("tagNameTooLong"),
        type: "error",
      });
      return;
    }

    try {
      await adminAPI.createTag(tagName.trim());
      setSnackbar({
        open: true,
        message: t("tagCreatedSuccess"),
        type: "success",
      });
      setShowAddTag(false);
      setTagName("");
      await fetchTags();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to create tag",
        type: "error",
      });
    }
  };

  const [deleteTagId, setDeleteTagId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const handleDeleteTagClick = (tagId: string) => {
    setDeleteTagId(tagId);
    setShowDeleteModal(true);
  };
  const handleDeleteTagConfirm = async () => {
    if (!deleteTagId) return;
    try {
      await adminAPI.deleteTag(deleteTagId);
      setSnackbar({
        open: true,
        message: t("tagDeletedSuccess"),
        type: "success",
      });
      await fetchTags();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || t("tagDeleteFailed"),
        type: "error",
      });
    } finally {
      setShowDeleteModal(false);
      setDeleteTagId(null);
    }
  };

  const handleEditClick = (tag: Tag) => {
    setEditTagId(tag._id);
    setEditTagName(tag.name);
    setShowEditModal(true);
  };

  const handleEditConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTagId) return;
    try {
      await adminAPI.updateTag(editTagId, editTagName.trim());
      setSnackbar({
        open: true,
        message: t("tagUpdatedSuccess") || "Tag updated successfully!",
        type: "success",
      });
      setShowEditModal(false);
      setEditTagId(null);
      setEditTagName("");
      await fetchTags();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || t("tagUpdateFailed") || "Failed to update tag.",
        type: "error",
      });
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">{t("tags")}</h1>
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
            onClick={() => setShowAddTag(true)}
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
            {t("addTag")}
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-error" style={{ color: '#d32f2f', marginBottom: '16px', padding: '12px', background: '#ffebee', borderRadius: '8px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="admin-loading">{t("loading")}</div>
      ) : !hasFetched ? (
        <div className="admin-loading" style={{ textAlign: "center", padding: "40px" }}>
          No data loaded. Click Refresh to load data.
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th
                  className="sortable-header"
                  onClick={() => handleSort("name")}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                    }}
                  >
                    {t("tag")}
                    {getSortIcon("name")}
                  </div>
                </th>
                {/* Removed 'created' column header */}
                <th
                  className="sortable-header"
                  onClick={() => handleSort("by")}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                    }}
                  >
                    {t("by")}
                    {getSortIcon("by")}
                  </div>
                </th>
                <th>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((tag) => (
                <tr key={tag._id}>
                  <td>
                    {t(tag.name.toLowerCase()) !== tag.name.toLowerCase()
                      ? t(tag.name.toLowerCase())
                      : tag.name}
                  </td>
                  {/* Removed 'created' column cell */}
                  <td>
                    {tag.createdBy
                      ? t(tag.createdBy.toLowerCase()) || tag.createdBy
                      : t("system")}
                  </td>
                  <td>
                    <button
                      className="admin-delete-button"
                      onClick={() => handleDeleteTagClick(tag._id)}
                    >
                      {t("delete")}
                    </button>
                    <button
                      className="admin-button-edit"
                      onClick={() => handleEditClick(tag)}
                      style={{ marginLeft: "8px" }}
                    >
                      {t("edit")}
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

      {/* Delete Tag Modal (moved outside table) */}
      {showDeleteModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-danger">
            <h2 className="admin-modal-title">{t("deleteTag")}</h2>
            <p className="admin-modal-text">{t("deleteTagWarning")}</p>
            <div className="admin-modal-actions">
              <button
                className="admin-button-secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTagId(null);
                }}
              >
                {t("cancel")}
              </button>
              <button
                className="admin-button-danger"
                onClick={handleDeleteTagConfirm}
              >
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Tag Modal */}
      {showAddTag && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-add">
            <h2 className="admin-modal-title">{t("addTag")}</h2>
            <form onSubmit={handleAddTag}>
              <div className="admin-form-group">
                <label className="admin-form-label">{t("tag")}</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  required
                  maxLength={20}
                  placeholder={
                    t("enterTagName") || "Enter tag name (1-20 characters)"
                  }
                />
                <p
                  style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}
                >
                  {tagName.length}/20 characters
                </p>
              </div>
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-button-secondary"
                  onClick={() => {
                    setShowAddTag(false);
                    setTagName("");
                  }}
                >
                  {t("cancel")}
                </button>
                <button type="submit" className="admin-button-primary">
                  {t("createTag") || t("addTag")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tag Modal */}
      {showEditModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h2 className="admin-modal-title">{t("editTag")}</h2>
            <form onSubmit={handleEditConfirm}>
              <div className="admin-form-group">
                <label className="admin-form-label">{t("tag")}</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={editTagName}
                  onChange={(e) => setEditTagName(e.target.value)}
                  required
                  maxLength={20}
                  placeholder={
                    t("enterTagName") || "Enter tag name (1-20 characters)"
                  }
                />
                <p
                  style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}
                >
                  {editTagName.length}/20 {t("characters")}
                </p>
              </div>
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-button-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditTagId(null);
                    setEditTagName("");
                  }}
                >
                  {t("cancel")}
                </button>
                <button type="submit" className="admin-button-primary">
                  {t("saveChanges") || t("edit")}
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
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </div>
  );
};

export default Tags;
