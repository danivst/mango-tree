/**
 * @file PastUsernames.tsx
 * @description Collapsible component for displaying previous usernames history.
 * Shows a summary with count when collapsed, expands to show full list with dates.
 */

import { useState } from "react";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation } from "../../utils/translations";

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

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
 * @component PastUsernames
 * @description Collapsible component for displaying previous usernames.
 * @requires useState - Manages the expanded state.
 * @requires useThemeLanguage - Provides localized date formatting.
 * @requires getTranslation - Resolves button text.
 * @returns {JSX.Element | null} The rendered usernames history or null if empty.
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
        {isExpanded ? (
          <ExpandLessIcon sx={{ fontSize: 20 }} />
        ) : (
          <ExpandMoreIcon sx={{ fontSize: 20 }} />
        )}
        {t("previousUsernames")}
        <span className="badge" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '12px', fontSize: '14px' }}>
          {pastUsernames.length}
        </span>
      </h3>

      {isExpanded && (
        <ul className="past-usernames-list" style={{ marginTop: '12px', paddingLeft: '24px' }}>
          {pastUsernames.map((entry: { username: string; changedAt: string }, idx: number) => (
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
