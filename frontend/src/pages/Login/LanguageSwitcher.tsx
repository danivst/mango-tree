/**
 * @file LanguageSwitcher.tsx
 * @description Language toggle buttons component.
 * Allows users to switch the application's UI language between English and Bulgarian.
 */

import React from 'react';
import "../../styles/shared.css";
import "../global/landing-page/LandingPage.css";

/**
 * @interface LanguageSwitcherProps
 * @description Props for the LanguageSwitcher component.
 * * @property {string} language - Current active language code (e.g., 'en' | 'bg')
 * @property {(lang: 'en' | 'bg') => void} onLanguageChange - Callback function triggered when a language button is clicked
 */
interface LanguageSwitcherProps {
  language: string;
  onLanguageChange: (lang: 'en' | 'bg') => void;
}

/**
 * @component LanguageSwitcher
 * @description Presentational component that renders toggle buttons for language selection.
 * Highlights the active language and propagates selection changes to the parent context or state.
 * * @param {LanguageSwitcherProps} props - Component props
 * @returns {JSX.Element} The rendered language switcher buttons
 */
const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  language,
  onLanguageChange
}) => {
  return (
    <div className="language-switcher">
      {/* English Toggle Button */}
      <button
        type="button"
        className={`lang-button ${language === "en" ? "lang-active" : ""}`}
        onClick={() => onLanguageChange("en")}
        aria-label="Switch to English"
      >
        EN
      </button>
      
      {/* Bulgarian Toggle Button */}
      <button
        type="button"
        className={`lang-button ${language === "bg" ? "lang-active" : ""}`}
        onClick={() => onLanguageChange("bg")}
        aria-label="Switch to Bulgarian"
      >
        БГ
      </button>
    </div>
  );
};

export default LanguageSwitcher;