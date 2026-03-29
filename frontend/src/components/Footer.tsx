import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { getTranslation } from "../utils/translations";

const Footer = () => {
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);
  const currentYear = new Date().getFullYear();

  return (
    <div className="page-footer">
      <p>© {currentYear} Mango Tree. {t("allRightsReserved") || "All rights reserved."}</p>
    </div>
  );
};

export default Footer;
