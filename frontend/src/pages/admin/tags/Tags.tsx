/**
 * @file Tags.tsx
 * @description Administrative interface for managing content tags.
 * Provides a comprehensive dashboard for creating, editing, deleting, and searching 
 * through system tags. Utilizes the centralized AdminDataContext for state synchronization 
 * and AdminTable for standardized data presentation.
 */

import { useState, useEffect, useMemo } from "react";
import { useThemeLanguage } from "../../../context/ThemeLanguageContext";
import { getTranslation } from "../../../utils/translations";
import { adminAPI, Tag } from "../../../services/admin-api";
import {
  sortData,
  paginateData,
  getTotalPages,
  SortState,
} from "../../../utils/table-utils";
import "../../../styles/shared.css";
import "./Tags.css";
import Footer from "../../../components/global/Footer";
import Snackbar from "../../../components/snackbar/Snackbar";
import { useSnackbar } from "../../../utils/snackbar";
import { useAdminData } from "../../../context/AdminDataContext";
import {
  AdminTable,
  ColumnDef,
} from "../../../components/admin/table";

// MUI Icon Imports
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AddIcon from '@mui/icons-material/Add';

const Tags = () => {
  const { tags, tagsState, fetchTags } = useAdminData();
  const { loading, error, hasFetched } = tagsState;
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);

  // Fetch tags on initial load (avoid requiring manual refresh)
  useEffect(() => {
    if (!hasFetched && !loading) {
      fetchTags().catch(() => {
        // error state handled by context; page also renders `error` if present
      });
    }
  }, [hasFetched, loading, fetchTags]);

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();
  const [showAddTag, setShowAddTag] = useState(false);
  const [tagName, setTagName] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTagId, setEditTagId] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState("");
  const [deleteTagId, setDeleteTagId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  /**
   * Effect: Reset pagination to the first page whenever the search query changes.
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  /**
   * Filters the tags list based on the search query against tag names.
   */
  const filteredTags = useMemo(() => {
    if (!hasFetched) return [];
    if (searchQuery.trim() === "") return tags;
    const query = searchQuery.toLowerCase();
    return tags.filter((tag) => tag.name.toLowerCase().includes(query));
  }, [tags, searchQuery, hasFetched]);

  /**
   * Sorts the filtered tags based on the current sort state.
   */
  const sortedTags = useMemo(() => {
    return sortData(
      filteredTags,
      sortState.column,
      sortState.direction,
      (tag, column) => {
        switch (column) {
          case "name":
            return tag.name;
          case "by":
            return tag.createdBy || "System";
          default:
            return "";
        }
      },
    );
  }, [filteredTags, sortState]);

  /**
   * Slices the sorted tags for the current page view.
   */
  const paginatedTags = useMemo(() => {
    return paginateData(sortedTags, currentPage, itemsPerPage);
  }, [sortedTags, currentPage]);

  const totalPages = useMemo(() => {
    return getTotalPages(sortedTags.length, itemsPerPage);
  }, [sortedTags.length]);

  /**
   * Cycles through sort directions: asc -> desc -> null.
   * @param {string} column - The column key to sort by.
   */
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

  /**
   * Manual refresh handler for the tags dataset.
   */
  const handleRefresh = async () => {
    try {
      await fetchTags();
    } catch (err: any) {
      showError(t("failedToLoadTags"));
    }
  };

  /**
   * Creates a new tag via the admin API.
   * @param {React.FormEvent} e - Form submission event.
   */
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName || tagName.trim().length === 0) {
      showError(t("tagNameEmpty"));
      return;
    }
    if (tagName.length > 20) {
      showError(t("tagNameTooLong"));
      return;
    }
    try {
      await adminAPI.createTag(tagName.trim());
      showSuccess(t("tagCreatedSuccess"));
      setShowAddTag(false);
      setTagName("");
      await fetchTags();
    } catch (error: any) {
      showError(t("tagCreatedFailed"));
    }
  };

  const handleDeleteTagClick = (tagId: string) => {
    setDeleteTagId(tagId);
    setShowDeleteModal(true);
  };

  /**
   * Confirms and executes tag deletion.
   */
  const handleDeleteTagConfirm = async () => {
    if (!deleteTagId) return;
    try {
      await adminAPI.deleteTag(deleteTagId);
      showSuccess(t("tagDeletedSuccess"));
      await fetchTags();
    } catch (error: any) {
      showError(t("tagDeleteFailed"));
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

  /**
   * Confirms and executes tag updates.
   * @param {React.FormEvent} e - Form submission event.
   */
  const handleEditConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTagId) return;
    try {
      await adminAPI.updateTag(editTagId, editTagName.trim());
      showSuccess(t("tagUpdatedSuccess"));
      setShowEditModal(false);
      setEditTagId(null);
      setEditTagName("");
      await fetchTags();
    } catch (error: any) {
      showError(t("tagUpdateFailed"));
    }
  };

  /**
   * AdminTable Column Definitions.
   */
  const columns: ColumnDef<Tag>[] = [
    {
      key: "name",
      label: t("tag"),
      sortable: true,
      minWidth: "150px",
      render: (tag) => {
        const translated = t(tag.name.toLowerCase());
        return translated !== tag.name.toLowerCase() ? translated : tag.name;
      },
    },
    {
      key: "by",
      label: t("by"),
      sortable: true,
      minWidth: "150px",
      render: (tag) => {
        return tag.createdBy
          ? t(tag.createdBy.toLowerCase()) || tag.createdBy
          : t("system");
      },
    },
  ];

  const emptyState = {
    icon: <LocalOfferIcon sx={{ fontSize: 40 }} />,
    title: t("noTagsFound"),
  };

  return (
    <div>
      <h1 className="page-container-title">{t("tags")}</h1>

      <AdminTable<Tag>
        data={paginatedTags}
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
          <button className="btn-primary" onClick={() => setShowAddTag(true)}>
            <AddIcon sx={{ fontSize: 20, mr: 0.5 }} />
            {t("addTag")}
          </button>
        }
        actionsRender={(tag) => (
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
        )}
      />

      {/* Delete Tag Modal */}
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
              <button className="btn-danger" onClick={handleDeleteTagConfirm}>
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
                  placeholder={t("enterTagName")}
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
        onClose={closeSnackbar}
      />
      <Footer />
    </div>
  );
};

export default Tags;