/**
 * @file Footer.tsx
 * @description Reusable footer component that displays localized copyright information.
 */

import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation } from "../../utils/translations";

/**
 * @component Footer
 * @description Renders the application footer with a localized copyright notice.
 * @requires useThemeLanguage - Provides the current language.
 * @requires getTranslation - Resolves localized copy.
 * @returns {JSX.Element} The rendered footer.
 */
const Footer = () => {
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);

  const renderCopyright = (): React.ReactElement => {
    return <p>{t("copyright")}</p>;
  };

  return (
    <footer className="page-footer">
      {renderCopyright()}
    </footer>
  );
};

export default Footer;
