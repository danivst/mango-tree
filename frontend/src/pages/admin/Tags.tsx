import { useState, useEffect, useMemo } from "react";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation } from "../../utils/translations";
import { useAdminData } from "../../context/AdminDataContext";
import { adminAPI, Tag } from "../../services/admin-api";
import Snackbar from "../../components/Snackbar";
import {
  sortData,
  paginateData,
  getTotalPages,
  SortState,
} from "../../utils/table-utils";
import "../../styles/shared.css";
import "./Tags.css";
import Footer from "../../components/Footer";

/**
 * @file Tags.tsx
 * @description Admin page for managing system tags.
 * View all user-submitted tags, create new system tags, edit, and delete tags.
 *
 * Features:
 * - List all tags with name, creator, and usage count
 * - Filter by creator: all, system-generated, admin-created
 * - Date range filter (created from/to) - UI present but not fully implemented
 * - Add new tag (system tags)
 * - Edit tag name
 * - Delete tag with confirmation
 * - Sortable columns: name, createdAt, createdBy, usageCount
 * - Search by tag name
 * - Pagination (20 per page)
 *
 * CRUD Operations:
 * - Create: POST /api/admin/tags { name } (creates system tag)
 * - Update: PUT /api/admin/tags/:id { name }
 * - Delete: DELETE /api/admin/tags/:id
 *
 * Data Source:
 * - Uses AdminDataContext.tags (fetched by initialize() or fetchTags())
 *
 * Access Control:
 * - Route protected by AdminRoute (admin only)
 *
 * @page
 * @requires useState - Tags list, filters, modals, loading state
 * @requires useMemo - Filtered/sorted/paginated computed list
 * @requires useThemeLanguage - Translations
 * @requires useAdminData - Access to tags array and tagsState
 * @requires adminAPI - CRUD operations for tags
 * @requires Snackbar - Success/error feedback
 * @requires Footer - Footer component
 * @requires sortData, paginateData, getTotalPages - Table utilities
 */

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
        if (!tag.createdAt) return false;
        const tagDate = new Date(tag.createdAt);
        return tagDate >= fromDate;
      });
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((tag) => {
        if (!tag.createdAt) return false;
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
        message: t("failedToLoadTags"),
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
        message: t("tagCreatedFailed"),
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
        message: t("tagDeleteFailed"),
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
        message: t("tagUpdatedSuccess"),
        type: "success",
      });
      setShowEditModal(false);
      setEditTagId(null);
      setEditTagName("");
      await fetchTags();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t("tagUpdateFailed"),
        type: "error",
      });
    }
  };

  return (
    <>
      <div className="page-container-header">
        <h1 className="page-container-title">{t("tags")}</h1>
        <div className="page-container-actions">
          <button
            className="btn-secondary btn-refresh"
            onClick={handleRefresh}
            disabled={loading}
          >
            <span className="material-icons icon-base">
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
        <div className="error-box">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="loading">{t("loading")}</div>
      ) : !hasFetched ? (
        <div className="loading loading-padded">
          No data loaded. Click Refresh to load data.
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th
                  className="sortable-header"
                  onClick={() => handleSort("name")}
                >
                  <div className="sort-header-content">
                    {t("tag")}
                    {getSortIcon("name")}
                  </div>
                </th>
                {/* Removed 'created' column header */}
                <th
                  className="sortable-header"
                  onClick={() => handleSort("by")}
                >
                  <div className="sort-header-content">
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
                    <div className="table-actions">
                      <button
                        className="btn-danger"
                        onClick={() => handleDeleteTagClick(tag._id)}
                      >
                        {t("delete")}
                      </button>
                      <button
                        className="btn-admin-action"
                        onClick={() => handleEditClick(tag)}
                      >
                        {t("edit")}
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

      {/* Delete Tag Modal (moved outside table) */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal modal-danger">
            <h2 className="modal-title">{t("deleteTag")}</h2>
            <p className="modal-text">{t("deleteTagWarning")}</p>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTagId(null);
                }}
              >
                {t("cancel")}
              </button>
              <button
                className="btn-danger"
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
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">{t("addTag")}</h2>
            <form onSubmit={handleAddTag}>
              <div className="form-group">
                <label className="form-label">{t("tag")}</label>
                <input
                  type="text"
                  className="form-input"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  required
                  maxLength={20}
                  placeholder={
                    t("enterTagName")
                  }
                />
                <p className="char-counter">
                  {tagName.length}/20 {t("characters")}
                </p>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowAddTag(false);
                    setTagName("");
                  }}
                >
                  {t("cancel")}
                </button>
                <button type="submit" className="btn-primary">
                  {t("createTag")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tag Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">{t("editTag")}</h2>
            <form onSubmit={handleEditConfirm}>
              <div className="form-group">
                <label className="form-label">{t("tag")}</label>
                <input
                  type="text"
                  className="form-input"
                  value={editTagName}
                  onChange={(e) => setEditTagName(e.target.value)}
                  required
                  maxLength={20}
                  placeholder={t("enterTagName")}
                />
                <p className="char-counter">
                  {editTagName.length}/20 {t("characters")}
                </p>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditTagId(null);
                    setEditTagName("");
                  }}
                >
                  {t("cancel")}
                </button>
                <button type="submit" className="btn-primary">
                  {t("saveChanges")}
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
      <Footer />
    </>
  );
};

export default Tags;
