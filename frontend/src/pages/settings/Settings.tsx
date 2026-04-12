/**
 * @file Settings.tsx
 * @description User settings page for account management, preferences, and security.
 * Composes specialized sub-components into a unified layout and handles initial data orchestration.
 */
import { useState, useEffect } from "react";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import api from "../../services/api";
import UserSidebar from "../../components/user/sidebar/UserSidebar";
import Footer from "../../components/global/Footer";
import { getTranslation } from "../../utils/translations";
import { useSnackbar } from "../../utils/snackbar";
import Snackbar from "../../components/snackbar/Snackbar";

import ProfileSettings from "./ProfileSettings";
import ThemeLanguageSettings from "./ThemeLanguageSettings";

/**
 * @component Settings
 * @description Main orchestrator for the Settings view. Responsible for fetching 
 * user information and providing the layout structure for sub-settings.
 */
const Settings = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { theme, setTheme, language, setLanguage } = useThemeLanguage();
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();
  const t = (key: string) => getTranslation(language, key);

  /**
   * @function useEffect
   * @description Fetches the current user's profile data on component mount.
   */
  useEffect(() => {
    api.get("/users/me")
      .then((res) => setUser(res.data))
      .catch(() => showError(t("failedToLoadUserInfo")))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !user) return <div className="loading">{t("loading")}</div>;

  const isAdmin = user.role === "admin";

  const content = (
    <>
      <h1 className="page-title">{t("settings")}</h1>
      <ProfileSettings user={user} setUser={setUser} isAdmin={isAdmin} t={t} showError={showError} showSuccess={showSuccess} />
      <ThemeLanguageSettings theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} t={t} />
      <Snackbar {...snackbar} onClose={closeSnackbar} />
      <Footer />
    </>
  );

  return isAdmin ? content : (
    <div className="settings-container">
      <UserSidebar />
      <div className="page-container">{content}</div>
    </div>
  );
};

export default Settings;