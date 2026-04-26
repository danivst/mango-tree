/**
 * @file NotFound.tsx
 * @description Custom 404 page displayed when a route doesn't exist.
 * Shows a friendly error message with a button to return home.
 */

import { useThemeLanguage } from "../../../context/ThemeLanguageContext";
import { getTranslation } from "../../../utils/translations";
import { useNavigate } from "react-router-dom";
import Footer from "../../../components/global/Footer";
import "./NotFound.css";
import "../../../styles/shared.css";

const NotFound = () => {
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/home");
  };

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
        <h1 className="not-found-code">404</h1>
        <h2 className="not-found-title">{t("pageNotFound")}</h2>
        <p className="not-found-message">
          {t("pageNotFoundMessage") ||
            "The page you're looking for doesn't exist."}
        </p>
        <button className="btn-primary not-found-button" onClick={handleGoHome}>
          {t("goHome")}
        </button>
        <Footer />
      </div>
    </div>
  );
};

export default NotFound;
