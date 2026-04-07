import { useState } from "react";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { getTranslation } from "../utils/translations";

/**
 * @interface PastUsernamesProps
 * @description Props for the PastUsernames collapsible component.
 *
 * @property {Array<{ username: string; changedAt: string }>} pastUsernames - Array of previous username entries with timestamps
 * @property {string} [className] - Optional additional CSS class for styling
 */

interface PastUsernamesProps {
  pastUsernames: Array<{ username: string; changedAt: string }>;
  className?: string;
}

/**
 * @file PastUsernames.tsx
 * @description Collapsible component for displaying previous usernames history.
 * Shows a summary with count when collapsed, expands to show full list with dates.
 *
 * Features:
 * - Toggle between collapsed/expanded states
 * - Shows count of previous usernames when collapsed
 * - Displays each username with its change date formatted for current language
 * - Consistent styling across all profile views (user account, admin preview, reports)
 *
 * @component
 * @requires useState - Manage collapse/expand state
 * @requires useThemeLanguage - Current UI language for date formatting
 * @requires getTranslation - Localization for button text
 */

const PastUsernames = ({ pastUsernames, className = "" }: PastUsernamesProps) => {
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);
  const [isExpanded, setIsExpanded] = useState(false);

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

  if (!pastUsernames || pastUsernames.length === 0) {
    return null;
  }

  return (
    <div className={`past-usernames-section ${className}`}>
      <h3
        className="profile-section-title"
        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="material-icons" style={{ fontSize: '20px' }}>
          {isExpanded ? "expand_less" : "expand_more"}
        </span>
        {t("previousUsernames")}
        <span className="badge" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '12px', fontSize: '14px' }}>
          {pastUsernames.length}
        </span>
      </h3>

      {isExpanded && (
        <ul className="past-usernames-list" style={{ marginTop: '12px', paddingLeft: '24px' }}>
          {pastUsernames.map((entry: any, idx: number) => (
            <li key={idx} className="past-username-item" style={{ marginBottom: '8px' }}>
              <span style={{ fontWeight: '500' }}>@{entry.username}</span>
              <span style={{ color: 'var(--color-text-secondary)', marginLeft: '8px' }}>
                ({formatDate(entry.changedAt)})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PastUsernames;
