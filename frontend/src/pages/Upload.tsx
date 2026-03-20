import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Snackbar from "../components/Snackbar";
import UserSidebar from "../components/UserSidebar";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { getTranslation } from "../utils/translations";
import "./admin/AdminPages.css";

interface Category {
  _id: string;
  name: string;
}

interface Tag {
  _id: string;
  name: string;
}

const Upload = () => {
  const navigate = useNavigate();
  const { language } = useThemeLanguage();
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
  const [errors, setErrors] = useState<Record<string, string>>({
    files: "",
    category: "",
    title: "",
    description: "",
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: "success" | "error";
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
        message:
          t("filesSkippedError") ||
          "Some files were skipped. Only JPEG, PNG, and WebP formats are supported.",
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
      newErrors.files =
        t("selectFileError") || "Please select at least one file.";
    }

    if (!selectedCategory) {
      newErrors.category =
        t("selectCategoryError") || "Please select a category.";
    }

    if (!title.trim()) {
      newErrors.title = t("enterTitleError") || "Please enter a title.";
    }

    if (!description.trim()) {
      newErrors.description =
        t("enterDescriptionError") || "Please enter a description.";
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
        content: description.trim(),
        category: selectedCategory,
        tags: selectedTags,
        image: images,
      };

      await api.post("/posts", postData);

      setSnackbar({
        open: true,
        message:
          t("uploadSuccess") ||
          "Success! Your post is pending for verification. You will be notified once it has been approved/disapproved.",
        type: "success",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setSelectedCategory("");
      setSelectedTags([]);
      setFiles([]);

      // Redirect to home after a delay
      setTimeout(() => {
        navigate("/home");
      }, 2000);
    } catch (error: any) {
      console.error("Upload failed:", error);
      const errorMessage =
        error.response?.data?.message ||
        t("somethingWentWrong") ||
        "Something went wrong.";
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
    <div style={{ display: "flex" }}>
      <UserSidebar />
      <div className="admin-page" style={{ flex: 1 }}>
        <h1 className="admin-page-title" style={{ marginBottom: "16px" }}>
          {t("uploadPost") || "Upload a post"}
        </h1>

        <form onSubmit={handleSubmit}>
          {/* File Upload */}
          <div className="admin-form-group">
            <label className="admin-form-label">{t("files") || "Files"}</label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="admin-button-primary"
              style={{
                width: "100%",
                padding: "12px",
                textAlign: "center",
                marginBottom: "8px",
                border: "2px solid var(--theme-text)",
                background: "transparent",
                color: "var(--theme-text)",
              }}
            >
              {files.length > 0
                ? `${files.length} file(s) selected`
                : t("browseFiles") || "Browse Files"}
            </button>
            <p
              style={{
                fontSize: "14px",
                color: "var(--theme-text)",
                opacity: 0.7,
                marginTop: "4px",
              }}
            >
              {t("supportedFormats") ||
                "Supported formats: JPEG, PNG, WebP (verified by AI model)"}
            </p>
            {files.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                  gap: "10px",
                  marginTop: "12px",
                }}
              >
                {files.map((_file, index) => (
                  <div
                    key={index}
                    style={{
                      position: "relative",
                      aspectRatio: "1/1",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: "1px solid var(--theme-accent)",
                    }}
                  >
                    <img
                      src={previews[index]}
                      alt={`preview ${index}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newFiles = [...files];
                        newFiles.splice(index, 1);
                        setFiles(newFiles);
                      }}
                      style={{
                        position: "absolute",
                        top: "4px",
                        right: "4px",
                        background: "rgba(0,0,0,0.5)",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: "20px",
                        height: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {errors.files && (
              <p
                style={{
                  color: "#d32f2f",
                  fontSize: "14px",
                  marginTop: "4px",
                  marginBottom: "0",
                }}
              >
                {errors.files}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="admin-form-group">
            <label className="admin-form-label">{t("category")}</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setErrors({ ...errors, category: "" });
              }}
              className="admin-form-input"
              style={{
                borderColor: errors.category ? "#d32f2f" : undefined,
                appearance: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
              }}
            >
              <option value="">
                {t("selectCategory") || "Select a category"}
              </option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {getCategoryDisplayName(category)}
                </option>
              ))}
            </select>
            {errors.category && (
              <p
                style={{
                  color: "#d32f2f",
                  fontSize: "14px",
                  marginTop: "4px",
                  marginBottom: "0",
                }}
              >
                {errors.category}
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="admin-form-group">
            <label className="admin-form-label">{t("tags")}</label>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginBottom: "8px",
                alignItems: "center",
              }}
            >
              {selectedTags.map((tagId) => {
                const tag = tags.find((t) => t._id === tagId);
                return tag ? (
                  <span
                    key={tagId}
                    style={{
                      background: "transparent",
                      color: "var(--theme-text)",
                      padding: "4px 10px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      border: "2px solid var(--theme-text)",
                    }}
                  >
                    {t(tag.name.toLowerCase()) || tag.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tagId)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--theme-text)",
                        cursor: "pointer",
                        fontSize: "18px",
                        padding: "0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </span>
                ) : null;
              })}

              {/* Add Tag Plus Icon/Dropdown */}
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowTagDropdown(!showTagDropdown)}
                  style={{
                    background: "transparent",
                    color: "var(--theme-text)",
                    border: "2px solid var(--theme-text)",
                    borderRadius: "8px",
                    width: "32px",
                    height: "30px", // Matches tag height (14px font + 4px*2 padding + 2px*2 border)
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    padding: "0",
                  }}
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
                    style={{
                      transition: "transform 0.2s ease",
                      transform: showTagDropdown ? "rotate(0)" : "rotate(0)",
                    }}
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
                  <div
                    style={{
                      position: "absolute",
                      top: "40px",
                      left: "0",
                      background: "var(--theme-accent)",
                      border: "1px solid var(--theme-text)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      zIndex: 100,
                      minWidth: "160px",
                      maxHeight: "200px",
                      overflowY: "auto",
                    }}
                  >
                    {tags.filter((tag) => !selectedTags.includes(tag._id))
                      .length === 0 ? (
                      <div
                        style={{
                          padding: "10px",
                          fontSize: "14px",
                          color: "var(--theme-text)",
                          opacity: 0.7,
                        }}
                      >
                        No more tags
                      </div>
                    ) : (
                      tags
                        .filter((tag) => !selectedTags.includes(tag._id))
                        .map((tag) => (
                          <div
                            key={tag._id}
                            onClick={() => handleAddTag(tag._id)}
                            style={{
                              padding: "10px 16px",
                              cursor: "pointer",
                              fontSize: "14px",
                              color: "var(--theme-text)",
                              borderBottom: "1px solid rgba(0,0,0,0.05)",
                              transition: "background 0.2s ease",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                "rgba(0,0,0,0.05)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            {t(tag.name.toLowerCase()) || tag.name}
                          </div>
                        ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="admin-form-group">
            <label className="admin-form-label">{t("title")}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors({ ...errors, title: "" });
              }}
              className="admin-form-input"
              placeholder={
                t("briefDescription") || "Brief description of your upload"
              }
              maxLength={100}
              style={{
                borderColor: errors.title ? "#d32f2f" : undefined,
              }}
            />
            {errors.title && (
              <p
                style={{
                  color: "#d32f2f",
                  fontSize: "14px",
                  marginTop: "4px",
                  marginBottom: "0",
                }}
              >
                {errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="admin-form-group">
            <label className="admin-form-label">{t("description")}</label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors({ ...errors, description: "" });
              }}
              className="admin-form-textarea"
              placeholder={
                t("detailedDescription") ||
                "Detailed description of what you've uploaded"
              }
              rows={6}
              style={{
                borderColor: errors.description ? "#d32f2f" : undefined,
              }}
            />
            {errors.description && (
              <p
                style={{
                  color: "#d32f2f",
                  fontSize: "14px",
                  marginTop: "4px",
                  marginBottom: "0",
                }}
              >
                {errors.description}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div
            className="admin-form-group"
            style={{ marginTop: "32px", textAlign: "center" }}
          >
            <button
              type="submit"
              className="admin-button-primary"
              disabled={loading}
              style={{
                width: "200px",
                border: "2px solid var(--theme-text)",
                background: "transparent",
                color: "var(--theme-text)",
              }}
            >
              {loading ? t("uploading") || "Uploading..." : t("upload")}
            </button>
          </div>
        </form>

        <Snackbar
          open={snackbar.open}
          message={snackbar.message}
          type={snackbar.type}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      </div>
    </div>
  );
};

export default Upload;
