/**
 * @file LandingPage.tsx
 * @description Public landing page for unauthenticated users.
 */

import { useNavigate } from "react-router-dom";
import { useThemeLanguage } from "../../../context/ThemeLanguageContext";
import { getTranslation } from "../../../utils/translations";
import "./LandingPage.css";
import "../../../styles/shared.css";
import Footer from "../../../components/global/Footer";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LanguageSwitcher from "../../login/LanguageSwitcher";

/**
 * @component LandingPage
 * @description Renders the public landing page and entry points to authentication.
 * @requires useNavigate - Navigates to authentication routes.
 * @requires useThemeLanguage - Provides translations and language switching.
 */
const LandingPage = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);

  return (
    <div className="landing-container">
      <header className="landing-header">
        <div className="header-content">
          <div className="header-logo">
            <img
              src="/mangotree-logo.png"
              alt="MangoTree"
              className="header-logo-img"
            />
            <span className="header-title">MangoTree</span>
          </div>
          <div className="header-actions">
            <button
              className="btn-header btn-login"
              onClick={() => navigate("/login")}
            >
              {t("login")}
            </button>
            <button
              className="btn-header btn-signup"
              onClick={() => navigate("/signup")}
            >
              {t("signup")}
            </button>
            <LanguageSwitcher
              language={language}
              onLanguageChange={setLanguage}
            />
          </div>
        </div>
      </header>
      <main className="landing-main">
        <div className="hero-section">
          <h1 className="hero-title">{t("landingWelcome")}</h1>
          <p className="hero-tagline">{t("landingTagline")}</p>
          <p className="hero-description">{t("landingDescription")}</p>
          <button
            className="btn-get-started"
            onClick={() => navigate("/signup")}
          >
            {t("getStarted")}
            <ArrowForwardIcon sx={{ ml: 1, fontSize: 20 }} />
          </button>
        </div>
        <div className="features-section">
          <div className="feature">
            <h3>{t("feature1Title")}</h3>
            <p>{t("feature1Desc")}</p>
          </div>
          <div className="feature">
            <h3>{t("feature2Title")}</h3>
            <p>{t("feature2Desc")}</p>
          </div>
          <div className="feature">
            <h3>{t("feature3Title")}</h3>
            <p>{t("feature3Desc")}</p>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default LandingPage;
