/**
 * @file Upload.tsx
 * @description Post creation page allowing users to upload images and publish content.
 * Supports multiple image uploads, category selection, tag assignment, and AI content moderation.
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import Snackbar from "../../../components/snackbar/Snackbar";
import UserSidebar from "../../../components/user/sidebar/UserSidebar";
import { useThemeLanguage } from "../../../context/ThemeLanguageContext";
import { useNotifications } from "../../../context/NotificationContext";
import { getTranslation } from "../../../utils/translations";
import { useSnackbar } from "../../../utils/snackbar";
import { validateRequired } from "../../../utils/validators";
import "../../../styles/shared.css";
import "./Upload.css";
import Footer from "../../../components/global/Footer";

// MUI Icon Imports
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

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
 * Upload Component
 * Features multi-image preview, category/tag selection, and AI moderation integration.
 *
 * @returns {JSX.Element}
 */
const Upload = () => {
  const navigate = useNavigate();
  const { language } = useThemeLanguage();
  const { refreshUnreadCount } = useNotifications();
  const t = (key: string) => getTranslation(language, key);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const getCategoryDisplayName = (category: Category) => {
    const translated = t(category.name.toLowerCase());
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
  const { snackbar, showSuccess, showError, showWarning, closeSnackbar } =
    useSnackbar();

  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCategories();
    fetchTags();

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
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);

    return () => {
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const fetchCategories = async () => {
    try {
      const response = await api.get("/categories");
      setCategories(response.data);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Failed to fetch categories:", error);
      }
      showError(t("failedToLoadCategories"));}
  };

  const fetchTags = async () => {
    try {
      const response = await api.get("/tags");
      setTags(response.data);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Failed to fetch tags:", error);
      }
      showError(t("failedToLoadTags"));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const supportedFormats = ["image/jpeg", "image/png", "image/webp"];
    const validFiles = selectedFiles.filter((file) =>
      supportedFormats.includes(file.type),
    );

    if (validFiles.length !== selectedFiles.length) {
      showError(t("filesSkippedError"));
    }

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

    // Use Centralized Required Validator
    const categoryError = validateRequired(selectedCategory, "category");
    if (categoryError) {
      newErrors.category = t("selectCategoryError");
    }

    const titleError = validateRequired(title, "title");
    if (titleError) {
      newErrors.title = t("enterTitleError");
    }

    const descriptionError = validateRequired(description, "description");
    if (descriptionError) {
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

      if (response.data.flagged || response.data.error) {
        const reasonKey = response.data.error;
        const errorMessage = t(reasonKey);
        showError(errorMessage);
      } else {
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

        const snackbarType: "success" | "error" | "warning" =
          response.status === 202 ? "warning" : "success";

        if (snackbarType === "warning") {
          showWarning(successMessage);
        } else {
          showSuccess(successMessage);
        }

        await refreshUnreadCount();

        setTitle("");
        setDescription("");
        setSelectedCategory("");
        setSelectedTags([]);
        setFiles([]);

        setTimeout(() => {
          navigate("/home");
        }, 2000);
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Upload failed:", error);
      }
      const errData = error.response?.data;
      let errorMessage: string;

      if (errData?.error) {
        errorMessage = t(errData.error);
      } else if (errData?.message) {
        errorMessage = errData.message;
      } else {
        errorMessage = t("somethingWentWrong");
      }

      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <UserSidebar />
      <div className="page-container">
        <h1 className="page-title mb-4">{t("uploadPost")}</h1>

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
            <p className="upload-format-hint">{t("supportedFormats")}</p>
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
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {errors.files && <p className="error-message">{errors.files}</p>}
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
              <option value="">{t("selectCategory")}</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {getCategoryDisplayName(category)}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="error-message">{errors.category}</p>
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
                      <CloseIcon sx={{ fontSize: 14 }} />
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
                  {showTagDropdown ? (
                    <CloseIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <AddIcon sx={{ fontSize: 18 }} />
                  )}
                </button>

                {showTagDropdown && (
                  <div className="tag-dropdown">
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

                    {(() => {
                      const availableTags = tags.filter(
                        (tag) =>
                          !selectedTags.includes(tag._id) &&
                          tag.name
                            .toLowerCase()
                            .includes(tagSearchQuery.toLowerCase()),
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
              placeholder={t("briefDescription")}
              maxLength={100}
            />
            {errors.title && <p className="error-message">{errors.title}</p>}
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
              placeholder={t("detailedDescription")}
              rows={6}
            />
            {errors.description && (
              <p className="error-message">{errors.description}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="form-group mt-8 text-center">
            <button
              type="submit"
              className="btn-secondary upload-submit"
              disabled={loading}
            >
              {loading ? t("uploading") : t("upload")}
            </button>
          </div>
        </form>

        <Snackbar
          open={snackbar.open}
          message={snackbar.message}
          type={snackbar.type}
          onClose={closeSnackbar}
        />
        <Footer />
      </div>
    </div>
  );
};

export default Upload;