import { useNavigate } from "react-router-dom";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { getTranslation } from "../utils/translations";
import "./LandingPage.css";
import logo from "../assets/mangotree-logo.png";
import Footer from "../components/Footer";

/**
 * @file LandingPage.tsx
 * @description Public landing page for unauthenticated users.
 * Serves as the app's homepage and marketing page.
 *
 * Features:
 * - App logo and branding
 * - Language switcher (EN/BG) with immediate UI updates
 * - Navigation to login and signup pages
 * - Hero section with welcome message and call-to-action
 * - Features showcase section (3 key features)
 * - Footer with copyright
 *
 * Layout: Header (sticky), Main content (scrollable), Footer
 * No authentication required
 * Accessible to all visitors
 *
 * @component
 * @requires useNavigate - Navigation to auth pages
 * @requires useThemeLanguage - Language switcher and translations
 */

const LandingPage = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);

  return (
    <div className="landing-container">
      {/* Header/Navbar */}
      <header className="landing-header">
        <div className="header-content">
          <div className="header-logo">
            <img src={logo} alt="MangoTree" className="header-logo-img" />
            <span className="header-title">MangoTree</span>
          </div>
          <div className="header-actions">
            {/* Language Switcher: Toggles between English and Bulgarian */}
            <div className="language-switcher">
              <button
                type="button"
                className={`lang-button ${language === "en" ? "lang-active" : ""}`}
                onClick={() => setLanguage("en")}
                aria-label="Switch to English"
              >
                EN
              </button>
              <button
                type="button"
                className={`lang-button ${language === "bg" ? "lang-active" : ""}`}
                onClick={() => setLanguage("bg")}
                aria-label="Switch to Bulgarian"
              >
                БГ
              </button>
            </div>
            {/* Login button navigates to login page */}
            <button
              className="btn-header btn-login"
              onClick={() => navigate("/login")}
            >
              {t("login")}
            </button>
            {/* Signup button navigates to signup (signin) page */}
            <button
              className="btn-header btn-signup"
              onClick={() => navigate("/signin")}
            >
              {t("signin")}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content: Hero + Features */}
      <main className="landing-main">
        <div className="hero-section">
          <h1 className="hero-title">
            {t("landingWelcome")}
          </h1>
          <p className="hero-tagline">
            {t("landingTagline")}
          </p>
          <p className="hero-description">
            {t("landingDescription")}
          </p>
          {/* Primary CTA button */}
          <button
            className="btn-get-started"
            onClick={() => navigate("/signin")}
          >
            {t("getStarted")}
            <span className="material-icons">
              arrow_forward
            </span>
          </button>
        </div>

        {/* Features grid: 3-column layout */}
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
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
