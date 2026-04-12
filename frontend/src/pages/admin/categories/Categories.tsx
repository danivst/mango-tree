/**
 * @file Categories.tsx
 * @description Administrative interface for managing post categories.
 * Provides functionality to create, edit, delete, and search through content categories
 * using the centralized AdminDataContext for state management.
 */

import { useState, useEffect, useMemo } from "react";
import { useThemeLanguage } from "../../../context/ThemeLanguageContext";
import { getTranslation } from "../../../utils/translations";
import { adminAPI, Category } from "../../../services/admin-api";
import {
  sortData,
  paginateData,
  getTotalPages,
  SortState,
} from "../../../utils/table-utils";
import "../../../styles/shared.css";
import Footer from "../../../components/global/Footer";
import Snackbar from "../../../components/snackbar/Snackbar";
import { useSnackbar } from "../../../utils/snackbar";
import { useAdminData } from "../../../context/AdminDataContext";
import { AdminTable, ColumnDef } from "../../../components/admin/table";

// MUI Icon Imports
import CategoryIcon from '@mui/icons-material/Category';
import AddIcon from '@mui/icons-material/Add';

const Categories = () => {
  const { categories, categoriesState, fetchCategories } = useAdminData();
  const { loading, error, hasFetched } = categoriesState;
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Filter: search by category name only
  const filteredCategories = useMemo(() => {
    if (!hasFetched) return [];
    if (searchQuery.trim() === "") return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter((cat) => cat.name.toLowerCase().includes(query));
  }, [categories, searchQuery, hasFetched]);

  // Sort
  const sortedCategories = useMemo(() => {
    return sortData(
      filteredCategories,
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
            return "";
        }
      },
    );
  }, [filteredCategories, sortState]);

  // Paginate
  const paginatedCategories = useMemo(() => {
    return paginateData(sortedCategories, currentPage, itemsPerPage);
  }, [sortedCategories, currentPage]);

  const totalPages = useMemo(() => {
    return getTotalPages(sortedCategories.length, itemsPerPage);
  }, [sortedCategories.length]);

  const handleSort = (column: string) => {
    setSortState((prev) => {
      if (prev.column === column) {
        if (prev.direction === "asc") return { column, direction: "desc" };
        if (prev.direction === "desc") return { column: null, direction: null };
      }
      return { column, direction: "asc" };
    });
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    try {
      await fetchCategories();
    } catch (err: any) {
      showError(t("failedToLoadCategories"));
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      showError(t("categoryNameRequired"));
      return;
    }
    try {
      await adminAPI.createCategory(categoryName.trim());
      showSuccess(t("categoryCreated"));
      setShowAddCategory(false);
      setCategoryName("");
      await fetchCategories();
    } catch (error: any) {
      showError(t("categoryCreateFailed"));
    }
  };

  const handleDeleteCategoryClick = (id: string) => {
    setDeleteCategoryId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteCategoryConfirm = async () => {
    if (!deleteCategoryId) return;
    try {
      await adminAPI.deleteCategory(deleteCategoryId);
      showSuccess(t("categoryDeleted"));
      await fetchCategories();
    } catch (error: any) {
      showError(t("deleteCategoryError"));
    } finally {
      setShowDeleteModal(false);
      setDeleteCategoryId(null);
    }
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
      showSuccess(t("categoryUpdated"));
      setShowEditModal(false);
      setEditCategoryId(null);
      setEditCategoryName("");
      await fetchCategories();
    } catch (error: any) {
      showError(t("categoryUpdateFailed"));
    }
  };

  // Columns definition
  const columns: ColumnDef<Category>[] = [
    {
      key: "name",
      label: t("category"),
      sortable: true,
      minWidth: "200px",
      render: (cat) => cat.name,
    },
    {
      key: "by",
      label: t("by"),
      sortable: true,
      minWidth: "150px",
      render: (cat) => {
        return cat.createdBy
          ? t(cat.createdBy.toLowerCase()) || cat.createdBy
          : t("system");
      },
    },
  ];

  // Empty state using MUI Icon
  const emptyState = {
    icon: <CategoryIcon sx={{ fontSize: 40 }} />,
    title: t("noCategoriesFound"),
  };

  return (
    <div>
      <h1 className="page-container-title">{t("categories")}</h1>

      <AdminTable<Category>
        data={paginatedCategories}
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
        filterControls={
          <button
            className="btn-primary"
            onClick={() => setShowAddCategory(true)}
          >
            <AddIcon sx={{ fontSize: 20, mr: 0.5 }} />
            {t("addCategory")}
          </button>
        }
        actionsRender={(category) => (
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
        )}
      />

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
                  placeholder={t("enterCategoryName")}
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
                  placeholder={t("enterCategoryName")}
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
        onClose={closeSnackbar}
      />
      <Footer />
    </div>
  );
};

export default Categories;