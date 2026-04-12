/**
 * @file UserCard.tsx
 * @description Reusable user card component with avatar, username, join date, and follow/unfollow action.
 * Used throughout the app to display user information consistently.
 */

import React, { useState } from "react";
import { useThemeLanguage } from "../../../context/ThemeLanguageContext";
import { getTranslation } from "../../../utils/translations";
import "./UserCard.css";

// MUI Icon Imports
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';

/**
 * @interface UserCardProps
 * @description Props for the UserCard component.
 *
 * @property {string} userId - The user's unique identifier
 * @property {string} username - The user's display name
 * @property {string} [profileImage] - Optional profile image URL
 * @property {string} createdAt - ISO date string when the user joined
 * @property {boolean} isFollowing - Whether the current user is following this user
 * @property {(userId: string) => void} onToggleFollow - Called when follow/unfollow button is clicked
 * @property {(userId: string) => void} [onUserClick] - Called when user card is clicked (navigate to profile)
 * @property {'sm' | 'md' | 'lg'} [size='md'] - Size variant affecting avatar size and font sizes
 * @property {boolean} [showActions=true] - Whether to show the follow/unfollow button
 * @property {React.ReactNode} [additionalActions] - Optional additional action buttons (e.g., remove, ban)
 */
interface UserCardProps {
  userId: string;
  username: string;
  profileImage?: string;
  createdAt: string;
  isFollowing: boolean;
  onToggleFollow: (userId: string) => void;
  onUserClick?: (userId: string) => void;
  size?: "sm" | "md" | "lg";
  showActions?: boolean;
  additionalActions?: React.ReactNode;
}

/**
 * @component UserCard
 * @param {UserCardProps} props - Component props
 * @returns {React.ReactNode} The user card element
 *
 * Features:
 * - Avatar with fallback initials (uses Avatar component)
 * - Username and join date display
 * - Follow/unfollow toggle button
 * - Clickable card to navigate to profile
 * - Support for additional action buttons (e.g., admin actions)
 * - Multiple size variants
 *
 * @example
 * // Basic usage
 * <UserCard
 * userId={user._id}
 * username={user.username}
 * profileImage={user.profileImage}
 * createdAt={user.createdAt}
 * isFollowing={isFollowing}
 * onToggleFollow={handleToggleFollow}
 * onUserClick={(id) => navigate(`/users/${id}`)}
 * />
 */
const UserCard: React.FC<UserCardProps> = ({
  userId,
  username,
  profileImage,
  createdAt,
  isFollowing,
  onToggleFollow,
  onUserClick,
  size = "md",
  showActions = true,
  additionalActions,
}) => {
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);

  const [localIsFollowing, setLocalIsFollowing] = useState(isFollowing);
  const [isLoading, setIsLoading] = useState(false);

  // Sync with prop changes
  React.useEffect(() => {
    setLocalIsFollowing(isFollowing);
  }, [isFollowing]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "bg" ? "bg-BG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getFallback = (): string => {
    // Remove '@' prefix if present and get first letter of actual username
    const cleanUsername = username.startsWith("@") ? username.slice(1) : username;
    return cleanUsername.charAt(0).toUpperCase();
  };

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking follow button

    setIsLoading(true);
    try {
      await onToggleFollow(userId);
      setLocalIsFollowing(!localIsFollowing);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Failed to toggle follow:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = () => {
    if (onUserClick) {
      onUserClick(userId);
    }
  };

  const cardClasses = [
    "user-card",
    `user-card-${size}`,
    onUserClick ? "user-card-clickable" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cardClasses}
      onClick={handleCardClick}
      role={onUserClick ? "button" : undefined}
    >
      {profileImage ? (
        <img src={profileImage} alt={username} className="user-card-avatar" />
      ) : (
        <div className="user-card-avatar-fallback">{getFallback()}</div>
      )}
      <div className="user-card-info">
        <h3 className="user-card-username">{username}</h3>
        <p className="user-card-meta">
          {t("memberSince")}: {formatDate(createdAt)}
        </p>
      </div>
      <div className="user-card-actions">
        {showActions && (
          <button
            className={`btn-secondary btn-sm icon-btn ${
              localIsFollowing ? "btn-following" : "btn-follow"
            }`}
            onClick={handleFollowClick}
            disabled={isLoading}
          >
            {localIsFollowing ? (
              <PersonRemoveIcon sx={{ fontSize: 20 }} />
            ) : (
              <PersonAddIcon sx={{ fontSize: 20 }} />
            )}
          </button>
        )}
        {additionalActions}
      </div>
    </div>
  );
};

export default UserCard;