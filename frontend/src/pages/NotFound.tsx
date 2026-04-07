import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { getTranslation } from "../utils/translations";
import { useNavigate } from "react-router-dom";
import logo from "../assets/mangotree-logo.png";
import Footer from "../components/Footer";
import "./NotFound.css";

/**
 * @file NotFound.tsx
 * @description Custom 404 page displayed when a route doesn't exist.
 * Shows a friendly error message with a button to return home.
 *
 * Features:
 * - Theme-aware styling (uses theme classes)
 * - Language localization
 * - Responsive layout
 *
 * @page
 */

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
        {/* Logo and Brand */}
        <div className="logo-container">
          <img src={logo} alt="MangoTree" className="not-found-logo" />
          <p className="brand-name">MangoTree</p>
        </div>
        {/* 404 Number */}
        <h1 className="not-found-code">404</h1>
        {/* Message */}
        <h2 className="not-found-title">{t("pageNotFound")}</h2>
        <p className="not-found-message">
          {t("pageNotFoundMessage") || "The page you're looking for doesn't exist."}
        </p>
        {/* Action */}
        <button className="btn-primary not-found-button" onClick={handleGoHome}>
          {t("goHome")}
        </button>
        {/* Footer inside the box */}
        <Footer />
      </div>
    </div>
  );
};

export default NotFound;
