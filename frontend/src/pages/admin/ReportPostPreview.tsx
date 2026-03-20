import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminAPI, Report } from "../../services/adminAPI";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation } from "../../utils/translations";
import { getToken } from "../../utils/auth";
import { postsAPI, usersAPI, UserProfile, Comment, Post as PostType } from "../../services/api";
import api from "../../services/api";
import { Category } from "../../services/adminAPI";
import "./AdminPages.css";
import Snackbar from "../../components/Snackbar";

const ReportPostPreview = () => {
  const navigate = useNavigate();
  const { reportId } = useParams<{ reportId: string }>();
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);

  const [report, setReport] = useState<Report | null>(null);
  const [post, setPost] = useState<PostType | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: "success" | "error";
  }>({ open: false, message: "", type: "success" });

  // Translation states (for post preview)
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationCache, setTranslationCache] = useState<{ title: string; content: string } | null>(null);
  const [translating, setTranslating] = useState(false);

  // Translation states for comment
  const [commentShowTranslation, setCommentShowTranslation] = useState(false);
  const [commentTranslationCache, setCommentTranslationCache] = useState<string | null>(null);
  const [commentTranslating, setCommentTranslating] = useState(false);

  // States for user preview
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<PostType[]>([]);
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [selectedUserCategoryId, setSelectedUserCategoryId] = useState<string | null>(null);

  const currentUserId = useMemo(() => {
    const token = getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || null;
    } catch {
      return null;
    }
  }, []);

  // Compute special categories (recipe, flex, question) for tabs
  const specialCategories = useMemo(() => {
    if (!userCategories.length) return [];
    const lowerNames = ["recipe", "flex", "question"];
    return userCategories.filter((cat) => lowerNames.includes(cat.name.toLowerCase()));
  }, [userCategories]);

  // Set default selected category when specialCategories load
  useEffect(() => {
    if (report?.targetType === "user" && specialCategories.length > 0 && !selectedUserCategoryId) {
      setSelectedUserCategoryId(specialCategories[0]._id);
    }
  }, [report?.targetType, specialCategories, selectedUserCategoryId]);

  // Filter posts by selected category
  const filteredPosts = useMemo(() => {
    if (!selectedUserCategoryId) return [];
    return userPosts.filter((post) => post.category && post.category._id === selectedUserCategoryId);
  }, [userPosts, selectedUserCategoryId]);

  useEffect(() => {
    if (reportId) {
      fetchReportAndPost();
    }
  }, [reportId]);

  const fetchReportAndPost = async () => {
    if (!reportId) return;
    try {
      const reports = await adminAPI.getReports();
      const currentReport = reports.find((r) => r._id === reportId);
      if (!currentReport) {
        setSnackbar({
          open: true,
          message: t("somethingWentWrong") || "Report not found",
          type: "error",
        });
        return;
      }
      setReport(currentReport);

      if (currentReport.targetType === "post") {
        // For post reports: fetch the post only (no comments)
        const postData = await postsAPI.getPost(currentReport.targetId);
        setPost(postData);
        setComments([]); // No comments to show
      } else if (currentReport.targetType === "comment") {
        // For comment reports: fetch the specific comment AND the post it belongs to
        try {
          const commentData = await postsAPI.getComment(currentReport.targetId);
          // Fetch the post that the comment is on
          const postData = await postsAPI.getPost(commentData.postId);
          setPost(postData);
          setComments([commentData]); // Only this comment in the comments array
        } catch (err) {
          console.error("Failed to fetch comment or post:", err);
          setPost(null);
          setComments([]);
        }
      } else if (currentReport.targetType === "user") {
        // For user reports: fetch user profile data and user's posts
        try {
          // Reset selected category for new user
          setSelectedUserCategoryId(null);
          // Fetch user details using usersAPI
          const userData = await usersAPI.getUser(currentReport.targetId);
          setUser(userData);

          // Fetch user's posts
          const postsResponse = await api.get<PostType[]>(`/posts/author/${currentReport.targetId}`);
          let posts = postsResponse.data;
          // If viewing another user's profile (i.e., the admin is not the user), hide unapproved posts (as regular users see)
          if (currentUserId && currentUserId !== userData._id) {
            posts = posts.filter(post => post.isApproved !== false);
          }
          setUserPosts(posts);

          // Fetch categories for post category names (and tabs if needed)
          const categoriesResponse = await api.get<Category[]>("/categories");
          setUserCategories(categoriesResponse.data);
        } catch (err) {
          console.error("Failed to fetch user data:", err);
          setUser(null);
          setUserPosts([]);
          setUserCategories([]);
        }
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || t("somethingWentWrong"),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryDisplayName = (categoryName: string) => {
    const translated = t(categoryName.toLowerCase());
    if (translated && translated !== categoryName.toLowerCase()) {
      return translated;
    }
    return categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
  };

  const handleNextImage = () => {
    if (post?.image && post.image.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % post.image.length);
    }
  };

  const handlePrevImage = () => {
    if (post?.image && post.image.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + post.image.length) % post.image.length);
    }
  };

  const formatCommentTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return t("justNow") || "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      const unit = minutes === 1 ? (t("minute") || "minute") : (t("minutes") || "minutes");
      return language === "bg" ? `${t("ago")} ${minutes} ${unit}` : `${minutes} ${unit} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      const unit = hours === 1 ? (t("hour") || "hour") : (t("hours") || "hours");
      return language === "bg" ? `${t("ago")} ${hours} ${unit}` : `${hours} ${unit} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      const unit = days === 1 ? (t("day") || "day") : (t("days") || "days");
      return language === "bg" ? `${t("ago")} ${days} ${unit}` : `${days} ${unit} ago`;
    } else {
      return date.toLocaleDateString(language === "bg" ? "bg-BG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  // Language detection for translation
  const detectLanguage = (text: string): 'en' | 'bg' => {
    if (!text) return 'en';
    if (/[а-яА-Я]/.test(text)) {
      return 'bg';
    }
    return 'en';
  };

  // Category style function for colored badges
  const getCategoryStyle = (categoryName: string) => {
    const styles: Record<string, { borderColor: string; backgroundColor: string; color: string }> = {
      flex: {
        borderColor: "#2196F3",
        backgroundColor: "rgba(33, 150, 243, 0.15)",
        color: "#1976D2"
      },
      recipe: {
        borderColor: "#4CAF50",
        backgroundColor: "rgba(76, 175, 80, 0.15)",
        color: "#388E3C"
      },
      question: {
        borderColor: "#9C27B0",
        backgroundColor: "rgba(156, 39, 176, 0.15)",
        color: "#7B1FA2"
      },
    };
    return styles[categoryName.toLowerCase()] || null;
  };

  const handleTranslate = async () => {
    if (!post) return;

    if (showTranslation) {
      setShowTranslation(false);
      return;
    }

    // If we already have cached translation, just show it
    if (translationCache) {
      setShowTranslation(true);
      return;
    }

    // If stored translation exists for UI language, use it directly without fetching
    if (post.translations?.title?.[language] && post.translations?.content?.[language]) {
      setTranslationCache({
        title: post.translations.title[language],
        content: post.translations.content[language],
      });
      setShowTranslation(true);
      return;
    }

    // Need to fetch translation
    setTranslating(true);
    try {
      const response = await postsAPI.translatePost(post._id, language);
      setTranslationCache({ title: response.title, content: response.content });
      setShowTranslation(true);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || t("somethingWentWrong"),
        type: "error",
      });
    } finally {
      setTranslating(false);
    }
  };

  const handleTranslateComment = async (commentId: string) => {
    if (!commentId) return;

    if (commentShowTranslation) {
      setCommentShowTranslation(false);
      return;
    }

    // If we already have cached translation, just show it
    if (commentTranslationCache) {
      setCommentShowTranslation(true);
      return;
    }

    // Get the current comment from the array
    const comment = comments.find(c => c._id === commentId);
    if (!comment) return;

    // If stored translation exists for UI language, use it directly without fetching
    if (comment.translations?.[language]) {
      setCommentTranslationCache(comment.translations[language]);
      setCommentShowTranslation(true);
      return;
    }

    // Need to fetch translation
    setCommentTranslating(true);
    try {
      const response = await postsAPI.translateComment(commentId, language);
      setCommentTranslationCache(response.text);
      setCommentShowTranslation(true);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || t("somethingWentWrong"),
        type: "error",
      });
    } finally {
      setCommentTranslating(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div style={{ marginBottom: "24px" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              border: "2px solid var(--theme-text)",
              borderRadius: "12px",
              background: "transparent",
              color: "var(--theme-text)",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            <span className="material-icons" style={{ fontSize: "18px" }}>
              arrow_back
            </span>
            {t("goBack") || "Go Back"}
          </button>
        </div>
        <div className="admin-loading">{t("loading")}</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="admin-page">
        <div style={{ marginBottom: "24px" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              border: "2px solid var(--theme-text)",
              borderRadius: "12px",
              background: "transparent",
              color: "var(--theme-text)",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            <span className="material-icons" style={{ fontSize: "18px" }}>
              arrow_back
            </span>
            {t("goBack") || "Go Back"}
          </button>
        </div>
        <div className="admin-loading">{t("somethingWentWrong")}</div>
      </div>
    );
  }

  // Handle POST report: show post (read-only, no interactions/comments)
  if (report.targetType === "post") {
    if (!post) {
      return (
        <div className="admin-page">
          <div className="admin-loading">{t("somethingWentWrong")}</div>
        </div>
      );
    }

    const postLanguage = detectLanguage(post.title);
    const isPostInUserLanguage = postLanguage === language;
    const isWaitingForApproval = post.isApproved === false;
    const displayTitle = showTranslation
      ? (translationCache?.title || post.translations?.title?.[language] || post.title)
      : post.title;
    const displayContent = showTranslation
      ? (translationCache?.content || post.translations?.content?.[language] || post.content)
      : post.content;

    return (
      <div className="admin-page">
        <div style={{ marginBottom: "24px" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              border: "2px solid var(--theme-text)",
              borderRadius: "12px",
              background: "transparent",
              color: "var(--theme-text)",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            <span className="material-icons" style={{ fontSize: "18px" }}>
              arrow_back
            </span>
            {t("goBack") || "Go Back"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
            <h1 className="admin-page-title" style={{ margin: 0 }}>{displayTitle}</h1>
            {/* Translate Toggle Button */}
            {!isPostInUserLanguage && (
              <button
                onClick={handleTranslate}
                disabled={translating}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "6px 12px",
                  border: "2px solid var(--theme-accent)",
                  background: "var(--theme-accent)",
                  color: "var(--theme-text)",
                  borderRadius: "8px",
                  cursor: translating ? "not-allowed" : "pointer",
                  fontSize: "12px",
                  fontWeight: 500,
                  opacity: translating ? 0.7 : 1,
                }}
              >
                {translating ? (
                  <span className="material-icons spin" style={{ fontSize: "14px" }}>refresh</span>
                ) : (
                  <span className="material-icons" style={{ fontSize: "14px" }}>
                    {showTranslation ? "translate" : "language"}
                  </span>
                )}
                <span>{showTranslation ? t("viewOriginal") : t("translate")}</span>
              </button>
            )}
            {isWaitingForApproval && (
              <div style={{
                display: "inline-block",
                padding: "6px 16px",
                background: "rgba(255, 193, 7, 0.2)",
                color: "#ffc107",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: 500,
                border: "1px solid rgba(255, 193, 7, 0.5)",
              }}>
                {t("waitingForApproval") || "Waiting for approval"}
              </div>
            )}
          </div>
        </div>

        {/* Author (no buttons) */}
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            {post.authorId.profileImage ? (
              <img
                src={post.authorId.profileImage}
                alt={post.authorId.username}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "var(--theme-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--theme-text)",
                  fontWeight: 600,
                  fontSize: "18px",
                }}
              >
                {post.authorId.username.charAt(0).toUpperCase()}
              </div>
            )}
            <span style={{ fontSize: "16px", fontWeight: 500, color: "var(--theme-text)" }}>
              @{post.authorId.username}
            </span>
          </div>
        </div>

        {/* Category Badge */}
        {post.category && (
          <span
            style={{
              fontSize: "13px",
              fontWeight: 700,
              padding: "6px 14px",
              borderRadius: "8px",
              display: "inline-block",
              border: "2px solid",
              ...(getCategoryStyle(post.category.name) ? {
                borderColor: getCategoryStyle(post.category.name)!.borderColor,
                backgroundColor: getCategoryStyle(post.category.name)!.backgroundColor,
                color: getCategoryStyle(post.category.name)!.color,
              } : {
                borderColor: "var(--theme-text)",
                backgroundColor: "transparent",
                color: "var(--theme-text)",
              }),
            }}
          >
            {getCategoryDisplayName(post.category?.name || "")}
          </span>
        )}

        {/* Image Carousel */}
        {post.image && post.image.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                position: "relative",
                width: "100%",
                maxHeight: "500px",
                borderRadius: "12px",
                overflow: "hidden",
                backgroundColor: "var(--theme-bg)",
              }}
            >
              <img
                src={post.image[currentImageIndex]}
                alt={`${displayTitle} - image ${currentImageIndex + 1}`}
                style={{
                  width: "100%",
                  height: "500px",
                  objectFit: "contain",
                }}
              />
              {post.image.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "12px",
                      transform: "translateY(-50%)",
                      background: "rgba(0,0,0,0.5)",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "40px",
                      height: "40px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span className="material-icons">chevron_left</span>
                  </button>
                  <button
                    onClick={handleNextImage}
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: "12px",
                      transform: "translateY(-50%)",
                      background: "rgba(0,0,0,0.5)",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "40px",
                      height: "40px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span className="material-icons">chevron_right</span>
                  </button>
                  <div
                    style={{
                      position: "absolute",
                      bottom: "12px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      display: "flex",
                      gap: "8px",
                    }}
                  >
                    {post.image.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          border: "none",
                          background: index === currentImageIndex ? "white" : "rgba(255,255,255,0.5)",
                          cursor: "pointer",
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div style={{ marginBottom: "16px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {post.tags.map((tag, index) => (
              <span
                key={index}
                style={{
                  background: "transparent",
                  color: "var(--theme-text)",
                  padding: "4px 12px",
                  borderRadius: "16px",
                  fontSize: "12px",
                  border: "1px solid var(--theme-text)",
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontFamily: "Poppins, sans-serif", fontSize: "14px", color: "var(--theme-text)", lineHeight: 1.7, margin: 0 }}>
            {displayContent}
          </p>
        </div>

        {/* No comments or interaction buttons in admin preview */}

        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          open={snackbar.open}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      </div>
    );
  }

  // Handle COMMENT report: show the post and the single reported comment
  if (report.targetType === "comment") {
    const comment = comments[0] || null;

    if (!comment) {
      return (
        <div className="admin-page">
          <div className="admin-loading">{t("somethingWentWrong")}</div>
        </div>
      );
    }

    // Compute displayed comment text based on translation state
    const displayCommentText = commentShowTranslation
      ? (commentTranslationCache || comment.translations?.[language] || comment.text)
      : comment.text;

    return (
      <div className="admin-page">
        <div style={{ marginBottom: "24px" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              border: "2px solid var(--theme-text)",
              borderRadius: "12px",
              background: "transparent",
              color: "var(--theme-text)",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            <span className="material-icons" style={{ fontSize: "18px" }}>
              arrow_back
            </span>
            {t("goBack") || "Go Back"}
          </button>
        </div>

        {/* Comment Content */}
        <div
          style={{
            background: "var(--theme-bg)",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px",
            border: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "16px", opacity: 0.8, margin: "0 0 8px 0" }}>
                @{comment.userId?.username}
              </p>
              <p style={{ fontSize: "14px", opacity: 0.6, margin: 0 }}>
                {formatCommentTime(comment.createdAt)}
              </p>
            </div>
            {/* Translate Button for Comment */}
            <button
              onClick={() => handleTranslateComment(comment._id)}
              disabled={commentTranslating}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                border: "2px solid var(--theme-accent)",
                background: "var(--theme-accent)",
                color: "var(--theme-text)",
                borderRadius: "8px",
                cursor: commentTranslating ? "not-allowed" : "pointer",
                fontSize: "12px",
                fontWeight: 500,
                opacity: commentTranslating ? 0.7 : 1,
              }}
            >
              {commentTranslating ? (
                <span className="material-icons spin" style={{ fontSize: "14px" }}>refresh</span>
              ) : (
                <span className="material-icons" style={{ fontSize: "14px" }}>
                  {commentShowTranslation ? "translate" : "language"}
                </span>
              )}
              <span>{commentShowTranslation ? t("viewOriginal") : t("translate")}</span>
            </button>
          </div>
          <p
            style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: "14px",
              color: "var(--theme-text)",
              lineHeight: 1.7,
              margin: 0,
              whiteSpace: "pre-wrap",
            }}
          >
            {displayCommentText}
          </p>
        </div>

        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          open={snackbar.open}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      </div>
    );
  }

  // Handle USER report: show user profile (read-only)
  if (report.targetType === "user") {
    if (!user) {
      return (
        <div className="admin-page">
          <div className="admin-loading">{t("somethingWentWrong")}</div>
        </div>
      );
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString(
        language === "bg" ? "bg-BG" : "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        }
      );
    };

    return (
      <div className="admin-page">
        <div style={{ marginBottom: "24px" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              border: "2px solid var(--theme-text)",
              borderRadius: "12px",
              background: "transparent",
              color: "var(--theme-text)",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            <span className="material-icons" style={{ fontSize: "18px" }}>
              arrow_back
            </span>
            {t("goBack") || "Go Back"}
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "24px" }}>
          {/* Profile Picture */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "4px solid var(--theme-accent)",
                background: "#ccc",
              }}
            >
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.username}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "48px",
                    fontWeight: 600,
                    color: "var(--theme-text)",
                    background: "var(--theme-accent)",
                  }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* User Info */}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0, color: "var(--theme-text)" }}>
              @{user.username}
            </h1>
            <p style={{ fontSize: "14px", opacity: 0.7, margin: "8px 0 16px 0", color: "var(--theme-text)" }}>
              {t("memberSince")}: {formatDate(user.createdAt)}
            </p>

            {/* Stats */}
            <div style={{ display: "flex", gap: "32px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--theme-text)" }}>
                  {userPosts.length}
                </div>
                <div style={{ fontSize: "14px", color: "var(--theme-text)", opacity: 0.8 }}>
                  {t("posts")}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--theme-text)" }}>
                  {user.followers?.length || 0}
                </div>
                <div style={{ fontSize: "14px", color: "var(--theme-text)", opacity: 0.8 }}>
                  {t("followers")}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--theme-text)" }}>
                  {user.following?.length || 0}
                </div>
                <div style={{ fontSize: "14px", color: "var(--theme-text)", opacity: 0.8 }}>
                  {t("following")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", color: "var(--theme-text)" }}>
              {t("bio")}
            </h3>
            <p
              style={{
                background: "var(--theme-bg)",
                padding: "20px",
                borderRadius: "12px",
                margin: 0,
                lineHeight: 1.7,
                color: "var(--theme-text)",
              }}
            >
              {user.bio}
            </p>
          </div>
        )}

        {/* Divider */}
        <hr style={{ border: 0, borderTop: "1px solid var(--theme-text)", opacity: 0.2, margin: "32px 0" }} />

        {/* Category Tabs */}
        {specialCategories.length > 0 && (
          <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
            {specialCategories
              .filter((category) => category._id)
              .map((category) => (
                <button
                  key={category._id}
                  onClick={() => setSelectedUserCategoryId(category._id)}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    border: selectedUserCategoryId === category._id ? "2px solid var(--theme-accent)" : "2px solid var(--theme-text)",
                    background: selectedUserCategoryId === category._id ? "var(--theme-accent)" : "transparent",
                    color: "var(--theme-text)",
                    fontSize: "16px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    borderRadius: "8px",
                  }}
                >
                  {getCategoryDisplayName(category.name)}
                </button>
              ))}
          </div>
        )}

        {/* Posts Grid */}
        {filteredPosts.length === 0 ? (
          <div className="admin-loading" style={{ textAlign: "center", padding: "40px" }}>
            {selectedUserCategoryId ? t("noPostsFound") : t("selectCategory")}
          </div>
        ) : (
          <div className="admin-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {filteredPosts.map((post) => (
              <div key={post._id} className="admin-card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Post Image if exists */}
                {post.image && post.image.length > 0 && (
                  <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: "8px", overflow: "hidden", background: "#000" }}>
                    <img
                      src={post.image[0]}
                      alt={post.title}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )}
                {/* Post Title */}
                <h3 style={{ fontSize: "18px", fontWeight: 600, margin: 0, color: "var(--theme-text)" }}>
                  {post.title}
                </h3>
                {/* Category & Date */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "var(--theme-text)", opacity: 0.8 }}>
                  <span>{post.category ? getCategoryDisplayName(post.category.name) : '—'}</span>
                  <span>{formatDate(post.createdAt)}</span>
                </div>
                {/* Likes count */}
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "14px", color: "var(--theme-text)", opacity: 0.8 }}>
                  <span className="material-icons" style={{ fontSize: "18px" }}>favorite</span>
                  {post.likes?.length || 0}
                </div>
              </div>
            ))}
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
  }

  // Fallback for unknown target type
  return (
    <div className="admin-page">
      <div style={{ marginBottom: "24px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            border: "2px solid var(--theme-text)",
            borderRadius: "12px",
            background: "transparent",
            color: "var(--theme-text)",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          <span className="material-icons" style={{ fontSize: "18px" }}>
            arrow_back
          </span>
          {t("goBack") || "Go Back"}
        </button>
      </div>
      <div className="admin-loading">{t("somethingWentWrong")}</div>
      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </div>
  );
};

export default ReportPostPreview;
