/**
 * @file Loading.tsx
 * @description Full-page loading component used during initial data fetching or route transitions.
 * Features a branded spinner and localized loading text.
 */

import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation } from "../../utils/translations";
import Footer from "./Footer";
import "../../pages/global/not-found/NotFound.css"; // Use the same styles as the NotFound page for consistent layout
import "../../styles/shared.css";

const Loading = () => {
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="logo-container">
          <img
            src="/mangotree-logo.png"
            alt="MangoTree"
            className="not-found-logo"
          />
          <p className="brand-name">MangoTree</p>
        </div>

        <div className="loading-spinner-container">
          <div className="spinner"></div>
        </div>

        <h2 className="not-found-title">{t("loading") || "Loading..."}</h2>
        <p className="not-found-message">
          {t("pleaseWait") || "Please wait while we prepare your content."}
        </p>

        <Footer />
      </div>
    </div>
  );
};

export default Loading;