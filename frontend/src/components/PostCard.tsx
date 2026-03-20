import { useNavigate } from "react-router-dom";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { getTranslation } from "../utils/translations";
import { Post } from "../services/api";

interface PostCardProps {
  post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
  const { language } = useThemeLanguage();
  const navigate = useNavigate();
  const t = (key: string) => getTranslation(language, key);

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

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + "...";
  };

  const handlePostClick = () => {
    navigate(`/posts/${post._id}`);
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/users/${post.authorId._id}`);
  };

  const displayTitle = post.translations?.title?.[language] || post.title;
  const displayContent = post.translations?.content?.[language] || post.content;

  return (
    <div
      className="admin-card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        cursor: "pointer",
      }}
      onClick={handlePostClick}
    >
      {/* Post Image */}
      {post.image && post.image.length > 0 && (
        <div
          style={{
            position: "relative",
            paddingTop: "56.25%",
            borderRadius: "8px",
            overflow: "hidden",
            background: "#000",
          }}
        >
          <img
            src={post.image[0]}
            alt={displayTitle}
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

      {/* Title */}
      <h3
        style={{
          fontSize: "18px",
          fontWeight: 600,
          margin: 0,
          color: "var(--theme-text)",
          cursor: "pointer",
        }}
      >
        {displayTitle}
      </h3>

      {/* Content Preview */}
      <p
        style={{
          fontSize: "14px",
          color: "var(--theme-text)",
          opacity: 0.8,
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {truncateContent(displayContent)}
      </p>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
          {post.tags.slice(0, 5).map((tag, idx) => (
            <span
              key={idx}
              style={{
                display: "inline-block",
                padding: "2px 8px",
                background: "rgba(0,0,0,0.05)",
                border: "1px solid var(--theme-text)",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: 500,
                color: "var(--theme-text)",
                opacity: 0.7,
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Approval Status Badge */}
      {post.isApproved === false && (
        <div
          style={{
            display: "inline-block",
            padding: "4px 12px",
            background: "rgba(255, 193, 7, 0.2)",
            color: "#ffc107",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: 500,
            marginBottom: "8px",
            border: "1px solid rgba(255, 193, 7, 0.5)",
          }}
        >
          {t("waitingForApproval") || "Waiting for approval"}
        </div>
      )}

      {/* Author & Category & Date Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginTop: "8px",
          flexWrap: "wrap",
        }}
      >
        {/* Author Avatar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
          }}
          onClick={handleAuthorClick}
        >
          {post.authorId.profileImage ? (
            <img
              src={post.authorId.profileImage}
              alt={post.authorId.username}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "var(--theme-accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--theme-text)",
              }}
            >
              {post.authorId.username.charAt(0).toUpperCase()}
            </div>
          )}
          <span
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--theme-text)",
            }}
          >
            @{post.authorId.username}
          </span>
        </div>

        {/* Dot separator */}
        <span style={{ color: "var(--theme-text)", opacity: 0.5, fontSize: "12px" }}>•</span>

        {/* Category */}
        {post.category && (
          <span
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--theme-text)",
              opacity: 0.8,
              cursor: "default",
            }}
            title={post.category.translations?.name?.[language] || post.category.name}
          >
            {post.category.translations?.name?.[language] || post.category.name}
          </span>
        )}

        {/* Date */}
        <span
          style={{
            fontSize: "13px",
            color: "var(--theme-text)",
            opacity: 0.7,
            marginLeft: "auto",
          }}
        >
          {formatDate(post.createdAt)}
        </span>
      </div>

      {/* Stats: Likes and Comments */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          fontSize: "14px",
          color: "var(--theme-text)",
          opacity: 0.8,
          marginTop: "4px",
        }}
      >
        {/* Likes */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span className="material-icons" style={{ fontSize: "18px" }}>
            favorite
          </span>
          {post.likes?.length || 0}
        </div>

        {/* Comments */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span className="material-icons" style={{ fontSize: "18px" }}>
            chat_bubble_outline
          </span>
          {post.commentCount || 0}
        </div>
      </div>
    </div>
  );
};

export default PostCard;
