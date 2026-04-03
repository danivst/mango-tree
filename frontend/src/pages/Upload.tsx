import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Snackbar from "../components/Snackbar";
import UserSidebar from "../components/UserSidebar";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { useNotifications } from "../context/NotificationContext";
import { getTranslation } from "../utils/translations";
import "../styles/shared.css";
import "./Upload.css";

/**
 * @interface Category
 * @description Local type definition for post categories.
 * Matches backend Category model structure (partial).
 *
 * @property {string} _id - Unique category identifier
 * @property {string} name - Category name (English key for translation)
 */

interface Category {
  _id: string;
  name: string;
}

/**
 * @interface Tag
 * @description Local type definition for content tags.
 * Matches backend Tag model structure (partial).
 *
 * @property {string} _id - Unique tag identifier
 * @property {string} name - Tag name (English key for translation)
 */

interface Tag {
  _id: string;
  name: string;
}

/**
 * @file Upload.tsx
 * @description Post creation page allowing users to upload images and publish content.
 * Supports multiple image uploads, category selection, tag assignment, and AI content moderation.
 *
 * Features:
 * - Multi-image upload with preview (supports JPEG, PNG, WebP)
 * - Category dropdown populated from backend
 * - Tag selector with search and dropdown
 * - Title and description text fields
 * - AI moderation integration: flagged content shows error and prevents submission
 * - Post-publish redirect to home with snackbar feedback
 * - Auto-refresh notification count after successful post
 *
 * Form Validation:
 * - At least one file required (except for "Question" category)
 * - Category selection required
 * - Title required (max 100 chars)
 * - Description required
 *
 * Workflow:
 * 1. User fills form with title, description, category, tags, and images
 * 2. Form validates all required fields
 * 3. Images convert to base64 and sent to backend
 * 4. Backend checks AI moderation: if flagged, returns error (status 200/202 with flagged=true)
 * 5. If accepted: posts returns 201 (published) or 202 (pending admin review)
 * 6. Success snackbar shows appropriate message; redirect to home after 2s
 *
 * @page
 * @requires useState - React state for form data, file management, UI state
 * @requires useEffect - Fetch categories/tags on mount, cleanup object URLs
 * @requires useNavigate - Redirect after successful post
 * @requires useThemeLanguage - Current UI language for translations
 * @requires useNotifications - Refresh unread notification count
 * @requires api - Axios instance for API calls
 * @requires Snackbar - Feedback notifications
 * @requires UserSidebar - Navigation sidebar
 */

const Upload = () => {
  const navigate = useNavigate();
  const { language } = useThemeLanguage();
  const { refreshUnreadCount } = useNotifications();
  const t = (key: string) => getTranslation(language, key);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const getCategoryDisplayName = (category: Category) => {
    // Try to get translated category name, fallback to capitalized original
    const translated = t(category.name.toLowerCase());
    // If translation exists and is different from the key, use it
    if (translated && translated !== category.name.toLowerCase()) {
      return translated;
    }
    return category.name.charAt(0).toUpperCase() + category.name.slice(1);
  };

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({
    files: "",
    category: "",
    title: "",
    description: "",
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ open: false, message: "", type: "success" });

  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCategories();
    fetchTags();

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowTagDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Generate previews when files change
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);

    // Cleanup: revoke object URLs when component unmounts or files change
    return () => {
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const fetchCategories = async () => {
    try {
      const response = await api.get("/categories");
      setCategories(response.data);
    } catch (error: any) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await api.get("/tags");
      setTags(response.data);
    } catch (error: any) {
      console.error("Failed to fetch tags:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    // Filter for supported formats (JPEG, PNG, WebP)
    const supportedFormats = ["image/jpeg", "image/png", "image/webp"];
    const validFiles = selectedFiles.filter((file) =>
      supportedFormats.includes(file.type),
    );

    if (validFiles.length !== selectedFiles.length) {
      setSnackbar({
        open: true,
        message: t("filesSkippedError"),
        type: "error",
      });
    }

    // Append new files instead of replacing
    setFiles((prevFiles) => [...prevFiles, ...validFiles]);
  };

  const handleAddTag = (tagId: string) => {
    if (!selectedTags.includes(tagId)) {
      setSelectedTags([...selectedTags, tagId]);
    }
    setShowTagDropdown(false);
  };

  const handleRemoveTag = (tagId: string) => {
    setSelectedTags(selectedTags.filter((id) => id !== tagId));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const isQuestion =
      categories.find((c) => c._id === selectedCategory)?.name.toLowerCase() ===
      "question";

    if (!isQuestion && files.length === 0) {
      newErrors.files = t("selectFileError");
    }

    if (!selectedCategory) {
      newErrors.category = t("selectCategoryError");
    }

    if (!title.trim()) {
      newErrors.title = t("enterTitleError");
    }

    if (!description.trim()) {
      newErrors.description = t("enterDescriptionError");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Convert files to base64
      const imagePromises = files.map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const images = await Promise.all(imagePromises);

      const postData = {
        title: title.trim(),
        content: description,
        category: selectedCategory,
        tags: selectedTags,
        image: images,
      };

      const response = await api.post("/posts", postData);

      // Check if content was flagged by AI (server returns flagged: true)
      if (response.data.flagged || response.data.error) {
        // Content was rejected by moderation - DO NOT clear form or redirect
        // User should stay on page to edit and retry
        const reasonKey = response.data.error;
        const errorMessage = t(reasonKey);

        setSnackbar({
          open: true,
          message: errorMessage,
          type: "error",
        });
      } else {
        // Content was accepted - either published or pending admin review
        let successMessage: string;
        if (response.data.messageKey) {
          successMessage = t(response.data.messageKey);
        } else if (response.data.message) {
          successMessage = response.data.message;
        } else if (response.status === 202) {
          successMessage = t("postPendingAdminReview");
        } else {
          successMessage = t("postPublishedSuccess");
        }

        // Use warning type for pending admin review, success for published
        const snackbarType: "success" | "error" | "warning" =
          response.status === 202 ? "warning" : "success";

        setSnackbar({
          open: true,
          message: successMessage,
          type: snackbarType,
        });

        // Refresh notifications to show the new notification immediately
        await refreshUnreadCount();

        // Reset form only on success
        setTitle("");
        setDescription("");
        setSelectedCategory("");
        setSelectedTags([]);
        setFiles([]);

        // Redirect to home after a delay only on success
        setTimeout(() => {
          navigate("/home");
        }, 2000);
      }
    } catch (error: any) {
      console.error("Upload failed:", error);
      const errData = error.response?.data;
      let errorMessage: string;

      if (errData?.error) {
        // Use translation key for known errors
        errorMessage = t(errData.error);
      } else if (errData?.message) {
        // Fallback to raw message (e.g., from other errors)
        errorMessage = errData.message;
      } else {
        errorMessage = t("somethingWentWrong");
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <UserSidebar />
      <div className="page-container">
        <h1 className="page-title mb-4">
          {t("uploadPost")}
        </h1>

        <form onSubmit={handleSubmit}>
          {/* File Upload */}
          <div className="form-group">
            <label className="form-label">{t("files")}</label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="upload-browse-button"
            >
              {files.length > 0
                ? `${files.length} file(s) selected`
                : t("browseFiles")}
            </button>
            <p className="upload-format-hint">
              {t("supportedFormats")}
            </p>
            {files.length > 0 && (
              <div className="upload-previews-grid">
                {files.map((_file, index) => (
                  <div key={index} className="preview-item">
                    <img
                      src={previews[index]}
                      alt={`preview ${index}`}
                      className="preview-image"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newFiles = [...files];
                        newFiles.splice(index, 1);
                        setFiles(newFiles);
                      }}
                      className="preview-remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {errors.files && (
              <p className="error-message">
                {errors.files}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">{t("category")}</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setErrors({ ...errors, category: "" });
              }}
              className={`form-select ${errors.category ? "form-select--error" : ""}`}
            >
              <option value="">
                {t("selectCategory")}
              </option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {getCategoryDisplayName(category)}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="error-message">
                {errors.category}
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">{t("tags")}</label>
            <div className="tags-container">
              {selectedTags.map((tagId) => {
                const tag = tags.find((t) => t._id === tagId);
                return tag ? (
                  <span key={tagId} className="tag-pill">
                    {t(tag.name.toLowerCase()) || tag.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tagId)}
                      className="tag-pill-remove"
                    >
                      ×
                    </button>
                  </span>
                ) : null;
              })}

              {/* Add Tag Plus Icon/Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowTagDropdown(!showTagDropdown)}
                  className="tag-add-button"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {showTagDropdown ? (
                      <>
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </>
                    ) : (
                      <>
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </>
                    )}
                  </svg>
                </button>

                {showTagDropdown && (
                  <div className="tag-dropdown">
                    {/* Search Input */}
                    <div className="tag-dropdown-search">
                      <input
                        type="text"
                        value={tagSearchQuery}
                        onChange={(e) => setTagSearchQuery(e.target.value)}
                        placeholder={t("searchTags")}
                        className="tag-search-input"
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    </div>

                    {/* Filtered Tags List */}
                    {(() => {
                      const availableTags = tags.filter(
                        (tag) =>
                          !selectedTags.includes(tag._id) &&
                          tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
                      );

                      if (availableTags.length === 0) {
                        return (
                          <div className="tag-dropdown-empty">
                            {tagSearchQuery
                              ? t("noTagsFound")
                              : t("noMoreTags")}
                          </div>
                        );
                      }

                      return availableTags.map((tag) => (
                        <div
                          key={tag._id}
                          onClick={() => {
                            handleAddTag(tag._id);
                            setTagSearchQuery("");
                          }}
                          className="tag-dropdown-item"
                        >
                          {t(tag.name.toLowerCase()) || tag.name}
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="form-group">
            <label className="form-label">{t("title")}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors({ ...errors, title: "" });
              }}
              className={`form-input ${errors.title ? "input-error" : ""}`}
              placeholder={
                t("briefDescription")
              }
              maxLength={100}
            />
            {errors.title && (
              <p className="error-message">
                {errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">{t("description")}</label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors({ ...errors, description: "" });
              }}
              className={`form-textarea ${errors.description ? "input-error" : ""}`}
              placeholder={
                t("detailedDescription")
              }
              rows={6}
            />
            {errors.description && (
              <p className="error-message">
                {errors.description}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div
            className="form-group mt-8 text-center"
          >
            <button
              type="submit"
              className="btn-secondary upload-submit"
              disabled={loading}
            >
              {loading ? t("uploading"): t("upload")}
            </button>
          </div>
        </form>

        <Snackbar
          open={snackbar.open}
          message={snackbar.message}
          type={snackbar.type}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
        <footer className="page-footer">
          <p>{t("copyright")}</p>
        </footer>
      </div>
    </div>
  );
};

export default Upload;
