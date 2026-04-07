/**
 * @file LanguageSwitcher.tsx
 * @description Language toggle buttons component.
 * Allows switching between English and Bulgarian.
 *
 * @component
 * @param {Object} props
 * @param {string} props.language - Current language code ('en' | 'bg')
 * @param {(lang: 'en' | 'bg') => void} props.onLanguageChange - Handler for language change
 * @returns {JSX.Element}
 */
import React from 'react';

interface LanguageSwitcherProps {
  language: string;
  onLanguageChange: (lang: 'en' | 'bg') => void;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  language,
  onLanguageChange
}) => {
  return (
    <div className="language-switcher">
      <button
        type="button"
        className={`lang-button ${language === "en" ? "lang-active" : ""}`}
        onClick={() => onLanguageChange("en")}
      >
        EN
      </button>
      <button
        type="button"
        className={`lang-button ${language === "bg" ? "lang-active" : ""}`}
        onClick={() => onLanguageChange("bg")}
      >
        БГ
      </button>
    </div>
  );
};

export default LanguageSwitcher;
