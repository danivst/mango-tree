import { useState, useEffect, useMemo } from "react";
import { adminAPI, Category } from "../../services/adminAPI";
import Snackbar from "../../components/Snackbar";
import {
  sortData,
  paginateData,
  getTotalPages,
  SortState,
} from "../../utils/tableUtils";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation } from "../../utils/translations";
import { useAdminData } from "../../context/AdminDataContext";
import "./AdminPages.css";
import Footer from "../../components/Footer";

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
        message: err.response?.data?.message || "Failed to load categories",
        type: "error",
      });
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    // ...existing logic for adding a category...
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
        message: error.response?.data?.message || t("categoryUpdateFailed"),
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
        message: error.response?.data?.message || t("deleteCategoryError"),
        type: "error",
      });
    } finally {
      setShowDeleteModal(false);
      setDeleteCategoryId(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">{t("categories")}</h1>
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
            placeholder={
              t("search") + " " + t("categories").toLowerCase() + "..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className="admin-add-button"
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
                    {t("category")}
                  </div>
                </th>
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
                    <button
                      className="admin-delete-button"
                      onClick={() => handleDeleteCategoryClick(category._id)}
                    >
                      {t("delete")}
                    </button>
                    <button
                      className="admin-button-edit"
                      onClick={() => handleEditClick(category)}
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
                {t("page")} {currentPage} {t("of")} {totalPages}
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

      {/* Delete Category Modal */}
      {showDeleteModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-danger">
            <h2 className="admin-modal-title">{t("deleteCategory")}</h2>
            <p className="admin-modal-text">{t("deleteCategoryWarning")}</p>
            <div className="admin-modal-actions">
              <button
                className="admin-button-secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteCategoryId(null);
                }}
              >
                {t("cancel")}
              </button>
              <button
                className="admin-button-danger"
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
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h2 className="admin-modal-title">{t("addCategory")}</h2>
            <form onSubmit={handleAddCategory}>
              <div className="admin-form-group">
                <label className="admin-form-label">{t("category")}</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                  maxLength={20}
                  placeholder={
                    t("enterCategoryName") ||
                    "Enter category name (1-20 characters)"
                  }
                />
                <p
                  style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}
                >
                  {categoryName.length}/20 {t("characters")}
                </p>
              </div>
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-button-secondary"
                  onClick={() => {
                    setShowAddCategory(false);
                    setCategoryName("");
                  }}
                >
                  {t("cancel")}
                </button>
                <button type="submit" className="admin-button-primary">
                  {t("createCategory") || "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h2 className="admin-modal-title">{t("editCategory")}</h2>
            <form onSubmit={handleEditConfirm}>
              <div className="admin-form-group">
                <label className="admin-form-label">{t("category")}</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  required
                  maxLength={20}
                  placeholder={
                    t("enterCategoryName") ||
                    "Enter category name (1-20 characters)"
                  }
                />
                <p
                  style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}
                >
                  {editCategoryName.length}/20 {t("characters")}
                </p>
              </div>
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-button-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditCategoryId(null);
                    setEditCategoryName("");
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
      <Footer />
    </div>
  );
};

export default Categories;
