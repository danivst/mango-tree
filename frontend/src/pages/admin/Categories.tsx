import { useState, useEffect, useMemo } from "react";
import { adminAPI, Category } from "../../services/admin-api";
import Snackbar from "../../components/Snackbar";
import {
  sortData,
  paginateData,
  getTotalPages,
  SortState,
} from "../../utils/table-utils";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation } from "../../utils/translations";
import { useAdminData } from "../../context/AdminDataContext";
import "../../styles/shared.css";
import "./Categories.css";
import Footer from "../../components/Footer";

/**
 * @file Categories.tsx
 * @description Admin page for managing post categories.
 * View, create, edit, and delete content categories used for post organization.
 *
 * Features:
 * - List all categories with name and post count
 * - Add new category via inline form
 * - Edit category name with modal
 * - Delete category with confirmation
 * - Sortable columns: name, postCount
 * - Search filter by category name
 * - Pagination (20 per page)
 *
 * CRUD Operations:
 * - Create: POST /api/admin/categories { name }
 * - Update: PUT /api/admin/categories/:id { name }
 * - Delete: DELETE /api/admin/categories/:id
 *
 * Data Source:
 * - Uses AdminDataContext.categories (fetched by initialize() or fetchCategories())
 *
 * Access Control:
 * - Route protected by AdminRoute (admin only)
 *
 * @page
 * @requires useState - Categories list, form inputs, search, sort, pagination, modal state
 * @requires useMemo - Filtered/sorted/paginated computed list
 * @requires useThemeLanguage - Translations and language switcher
 * @requires useAdminData - Access to categories array and categoriesState
 * @requires adminAPI - All CRUD operations for categories
 * @requires Snackbar - Success/error feedback
 * @requires Footer - Footer component
 * @requires sortData, paginateData, getTotalPages - Table utilities
 */

const Categories = () => {
  const { categories, categoriesState, fetchCategories } = useAdminData();
  const { loading, error, hasFetched } = categoriesState;
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categoryName, setCategoryName] = useState("");
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");

  const filteredData = useMemo(() => {
    let filtered = categories;
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((cat) =>
        cat.name.toLowerCase().includes(query),
      );
    }
    return filtered;
  }, [searchQuery, categories]);

  const sortedData = useMemo(() => {
    return sortData(
      filteredData,
      sortState.column,
      sortState.direction,
      (cat, column) => {
        switch (column) {
          case "name":
            return cat.name;
          case "added":
            return cat.createdAt;
          case "by":
            return cat.createdBy || "System";
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
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchQuery]);

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
      await fetchCategories();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: t("failedToLoadCategories"),
        type: "error",
      });
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setSnackbar({
        open: true,
        message: t("categoryNameRequired"),
        type: "error",
      });
      return;
    }
    try {
      await adminAPI.createCategory(categoryName.trim());
      setSnackbar({
        open: true,
        message: t("categoryCreated"),
        type: "success",
      });
      setShowAddCategory(false);
      setCategoryName("");
      await fetchCategories();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t("categoryCreateFailed"),
        type: "error",
      });
    }
  };

  const handleDeleteCategoryClick = (id: string) => {
    setDeleteCategoryId(id);
    setShowDeleteModal(true);
  };

  const handleEditClick = (category: Category) => {
    setEditCategoryId(category._id);
    setEditCategoryName(category.name);
    setShowEditModal(true);
  };

  const handleEditConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCategoryId) return;
    try {
      await adminAPI.updateCategory(editCategoryId, editCategoryName.trim());
      setSnackbar({
        open: true,
        message: t("categoryUpdated"),
        type: "success",
      });
      setShowEditModal(false);
      setEditCategoryId(null);
      setEditCategoryName("");
      await fetchCategories();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t("categoryUpdateFailed"),
        type: "error",
      });
    }
  };

  const handleDeleteCategoryConfirm = async () => {
    if (!deleteCategoryId) return;
    try {
      await adminAPI.deleteCategory(deleteCategoryId);
      setSnackbar({
        open: true,
        message: t("categoryDeleted"),
        type: "success",
      });
      await fetchCategories();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t("deleteCategoryError"),
        type: "error",
      });
    } finally {
      setShowDeleteModal(false);
      setDeleteCategoryId(null);
    }
  };

  return (
    <div>
      <div className="page-container-header">
        <h1 className="page-container-title">{t("categories")}</h1>
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
            placeholder={
              t("search") + " " + t("categories").toLowerCase() + "..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className="btn-primary"
            onClick={() => setShowAddCategory(true)}
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
            {t("addCategory")}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-box-colored">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="loading">{t("loading")}</div>
      ) : !hasFetched ? (
        <div className="loading">
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
                  <div className="header-content">
                    {t("category")}
                  </div>
                </th>
                <th
                  className="sortable-header"
                  onClick={() => handleSort("by")}
                >
                  <div className="header-content">
                    {t("by")}
                  </div>
                </th>
                <th>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((category) => (
                <tr key={category._id}>
                  <td>{category.name}</td>
                  <td>
                    {category.createdBy
                      ? t(category.createdBy.toLowerCase()) ||
                        category.createdBy
                      : t("system")}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn-danger"
                        onClick={() => handleDeleteCategoryClick(category._id)}
                      >
                        {t("delete")}
                      </button>
                      <button
                        className="btn-admin-action"
                        onClick={() => handleEditClick(category)}
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
                {t("page")} {currentPage} {t("of")} {totalPages}
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

      {/* Delete Category Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal modal-danger">
            <h2 className="modal-title">{t("deleteCategory")}</h2>
            <p className="modal-text">{t("deleteCategoryWarning")}</p>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteCategoryId(null);
                }}
              >
                {t("cancel")}
              </button>
              <button
                className="btn-danger"
                onClick={handleDeleteCategoryConfirm}
              >
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">{t("addCategory")}</h2>
            <form onSubmit={handleAddCategory}>
              <div className="form-group">
                <label className="form-label">{t("category")}</label>
                <input
                  type="text"
                  className="form-input"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                  maxLength={20}
                  placeholder={
                    t("enterCategoryName")
                  }
                />
                <p className="helper-text">
                  {categoryName.length}/20 {t("characters")}
                </p>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowAddCategory(false);
                    setCategoryName("");
                  }}
                >
                  {t("cancel")}
                </button>
                <button type="submit" className="btn-primary">
                  {t("createCategory")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">{t("editCategory")}</h2>
            <form onSubmit={handleEditConfirm}>
              <div className="form-group">
                <label className="form-label">{t("category")}</label>
                <input
                  type="text"
                  className="form-input"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  required
                  maxLength={20}
                  placeholder={
                    t("enterCategoryName")
                  }
                />
                <p className="helper-text">
                  {editCategoryName.length}/20 {t("characters")}
                </p>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditCategoryId(null);
                    setEditCategoryName("");
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
    </div>
  );
};

export default Categories;
