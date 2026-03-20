import { useNavigate } from "react-router-dom";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { getTranslation } from "../utils/translations";
import "./LandingPage.css";
import logo from "../assets/mangotree-logo.png";

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
            <div className="language-switcher">
              <button
                type="button"
                className={`lang-button ${language === "en" ? "lang-active" : ""}`}
                onClick={() => setLanguage("en")}
              >
                EN
              </button>
              <button
                type="button"
                className={`lang-button ${language === "bg" ? "lang-active" : ""}`}
                onClick={() => setLanguage("bg")}
              >
                БГ
              </button>
            </div>
            <button
              className="btn-header btn-login"
              onClick={() => navigate("/login")}
            >
              {t("login")}
            </button>
            <button
              className="btn-header btn-signup"
              onClick={() => navigate("/signin")}
            >
              {t("signin")}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="landing-main">
        <div className="hero-section">
          <h1 className="hero-title">
            {t("landingWelcome") || "Welcome to MangoTree"}
          </h1>
          <p className="hero-tagline">
            {t("landingTagline") || "Connect, share, and grow with a community that matters."}
          </p>
          <p className="hero-description">
            {t("landingDescription") || "MangoTree is a social platform where you can share your thoughts, discover new content, and connect with like-minded people. Join our community today and start your journey."}
          </p>
          <button
            className="btn-get-started"
            onClick={() => navigate("/signin")}
          >
            {t("getStarted") || "Get Started"}
            <span className="material-icons" style={{ fontSize: "20px", marginLeft: "8px" }}>
              arrow_forward
            </span>
          </button>
        </div>

        <div className="features-section">
          <div className="feature">
            <h3>{t("feature1Title") || "Share Your Voice"}</h3>
            <p>{t("feature1Desc") || "Create posts, express your ideas, and let your creativity shine."}</p>
          </div>
          <div className="feature">
            <h3>{t("feature2Title") || "Discover Content"}</h3>
            <p>{t("feature2Desc") || "Browse through personalized feeds and explore content curated just for you."}</p>
          </div>
          <div className="feature">
            <h3>{t("feature3Title") || "Connect & Engage"}</h3>
            <p>{t("feature3Desc") || "Follow users, comment on posts, and build meaningful connections."}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
