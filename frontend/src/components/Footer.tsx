import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { getTranslation } from "../utils/translations";

/**
 * @file Footer.tsx
 * @description Reusable footer component that displays localized copyright information.
 * Renders at the bottom of every page in the application, providing consistent branding and legal information.
 *
 * Features:
 * - Displays copyright text translated to current UI language
 * - Responsive design that adapts to theme
 * - Consistent placement across all pages
 *
 * @component
 * @requires useThemeLanguage - React Context hook for accessing current language and theme
 * @requires getTranslation - Localization utility function for getting translated string keys
 */

const Footer = () => {
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);

  /**
   * Renders the copyright text in the current language.
   * Uses translation key "copyright" with fallback to English if translation missing.
   *
   * @returns {React.ReactElement} Paragraph element containing copyright text
   */
  const renderCopyright = (): React.ReactElement => {
    return <p>{t("copyright")}</p>;
  };

  return <div className="page-footer">{renderCopyright()}</div>;
};

export default Footer;
