import { useState, useEffect } from "react";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { authAPI } from "../services/api";
import Snackbar from "../components/Snackbar";
import UserSidebar from "../components/UserSidebar";
import { getTranslation } from "../utils/translations";
import { clearAuth } from "../utils/auth";
import "../styles/shared.css";
import "./Settings.css";

/**
 * @type DeleteStep
 * @description State machine for multi-step account deletion flow.
 * Controls which modal step is shown during account deletion process.
 *
 * @property {"warning"} warning - Initial warning screen (confirm intention to delete)
 * @property {"reason"} reason - Admin deletion only: reason text input required
 * @property {"confirm"} confirm - Final confirmation before irreversible deletion
 * @property {null} null - No deletion modal visible
 */
type DeleteStep = "warning" | "reason" | "confirm" | null;

/**
 * @file Settings.tsx
 * @description User settings page for account management, preferences, and security.
 * Allows users to update profile, change password, enable/disable 2FA, and delete account.
 * Admins see additional controls for account deletion with mandatory reason.
 *
 * Features:
 * - Profile editing: username (with availability check), read-only email
 * - Password change with current password verification
 * - Two-Factor Authentication (2FA) enable/disable with email verification
 * - Theme selector (all 5 themes: dark, purple, cream, light, mango)
 * - Language selector (English/Bulgarian)
 * - Account deletion with multi-step confirmation (admins must provide reason)
 *
 * Security:
 * - Password change requires current password
 * - 2FA verification code sent via email (6-digit, 10-min expiry)
 * - Username change validates uniqueness via API call
 * - Account deletion clears auth tokens and localStorage
 *
 * Access Control:
 * - Regular users: can delete own account (no reason required)
 * - Admins: can delete other users (reason mandatory, logged)
 *
 * State Machine (DeleteStep):
 * 1. warning → user clicks "Delete Account", shows warning
 * 2. reason → (admin only) enter deletion reason
 * 3. confirm → final confirmation before execution
 *
 * @page
 * @requires useState - Form state, theme/language state, deletion flow state
 * @requires useEffect - Fetch user info on mount
 * @requires useNavigate - Redirect to login after account deletion, to home after password change
 * @requires useThemeLanguage - Theme and language setters (live preview) + translations
 * @requires api - General API service (get current user, update username, delete user)
 * @requires authAPI - Authentication-specific operations (change password, 2FA)
 * @requires Snackbar - Success/error feedback
 * @requires UserSidebar / AdminSidebar - Context-appropriate navigation
 * @requires clearAuth - Utility to clear tokens and localStorage on logout/deletion
 */

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{
    _id: string;
    username: string;
    email: string;
    role: string;
    twoFactorEnabled?: boolean;
    bio?: string;
    translations?: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteStep, setDeleteStep] = useState<DeleteStep>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { theme, setTheme, language, setLanguage } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: "success" | "error";
  }>({ open: false, message: "", type: "success" });
  const [deleting, setDeleting] = useState(false);
  // 2FA states
  const [showEnable2FAModal, setShowEnable2FAModal] = useState(false);
  const [settingsTwoFACode, setSettingsTwoFACode] = useState("");
  const [settingsVerifying2FA, setSettingsVerifying2FA] = useState(false);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await api.get("/users/me");
      setUser(response.data);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t("failedToLoadUserInfo"),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setSnackbar({
        open: true,
        message: t("fillAllPasswordFields"),
        type: "error",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setSnackbar({
        open: true,
        message: t("passwordsDoNotMatch"),
        type: "error",
      });
      return;
    }

    setChangingPassword(true);
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      // Clear the mustChangePassword flag from localStorage if it exists
      localStorage.removeItem("mustChangePassword");
      setSnackbar({
        open: true,
        message: t("passwordChangedSuccess"),
        type: "success",
      });
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // Optionally redirect to home after a short delay
      setTimeout(() => {
        navigate("/home");
      }, 1500);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t("serverError"),
        type: "error",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!user) return;
    try {
      await authAPI.enable2FA();
      setShowEnable2FAModal(true);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t("failedToSendVerificationCode"),
        type: "error",
      });
    }
  };

  const handleVerifySettings2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!settingsTwoFACode || settingsTwoFACode.length !== 6 || !/^\d+$/.test(settingsTwoFACode)) {
      setSnackbar({
        open: true,
        message: t("invalid2FACode"),
        type: "error",
      });
      return;
    }

    setSettingsVerifying2FA(true);
    try {
      const response = await authAPI.verify2FA(user._id, settingsTwoFACode);
      // Update user with new token and 2FA status
      const token = response.token;
      const refreshToken = response.refreshToken;
      if (token && refreshToken) {
        localStorage.setItem("token", token);
        localStorage.setItem("refreshToken", refreshToken);
      }
      setUser({ ...user, twoFactorEnabled: true });
      setShowEnable2FAModal(false);
      setSettingsTwoFACode("");
      setSnackbar({
        open: true,
        message: t("twoFAEnabledSuccess"),
        type: "success",
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t("actionFailed"),
        type: "error",
      });
      setSettingsTwoFACode("");
    } finally {
      setSettingsVerifying2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!user) return;
    try {
      await authAPI.disable2FA();
      setUser({ ...user, twoFactorEnabled: false });
      setSnackbar({
        open: true,
        message: t("twoFADisabledSuccess"),
        type: "success",
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t("actionFailed"),
        type: "error",
      });
    }
  };

  const handleDeleteContinue = () => {
    if (isAdmin) {
      setDeleteStep("reason");
    } else {
      // For self-deletion, execute delete immediately without extra confirm step
      handleDeleteConfirm();
    }
  };

  const handleDeleteBack = () => {
    setDeleteStep("warning");
    setDeleteReason("");
  };

  const handleDeleteTerminate = () => {
    // For admin deletion, this is the final step - directly confirm
    handleDeleteConfirm();
  };

  const handleDeleteConfirm = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      // Only send reason if admin is deleting (though admin delete button is hidden)
      const url = isAdmin
        ? `/users/${user._id}?reason=${encodeURIComponent(deleteReason)}`
        : `/users/${user._id}`;

      await api.delete(url);

      // Clear auth and set flag for login page
      clearAuth();
      sessionStorage.setItem("accountDeleted", "true");

      // Navigate to login immediately (no need to show snackbar here, login page will show it)
      navigate("/login");
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t("failedToDeleteUser"),
        type: "error",
      });
      setDeleting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="page-container">
        <div className="loading">{t("loading")}</div>
      </div>
    );
  }

  const isAdmin = user.role === "admin";

  const settingsContent = (
    <>
        <h1 className="page-title">{t("settings")}</h1>
        {/* Account Section */}
        <div className="settings-section">
          <h2 className="settings-section-title">{t("account")}</h2>
          <div className="settings-form">
            <div className="form-group">
              <label className="form-label">{t("username")}</label>
              <div className="form-row username-row">
                <input
                  type="text"
                  className="form-input"
                  value={user.username}
                  onChange={(e) =>
                    setUser({ ...user, username: e.target.value })
                  }
                  disabled={isAdmin}
                  title={t("unableToEditUsername")}
                />
                {!isAdmin && (
                  <button
                    className="btn-primary"
                    onClick={async () => {
                      if (!user) return;
                      try {
                        const check = await api.get(
                          `/users/check-username?username=${encodeURIComponent(
                            user.username,
                          )}`,
                        );
                        if (check.data.exists) {
                          setSnackbar({
                            open: true,
                            message:
                              t("usernameExists"),
                            type: "error",
                          });
                          return;
                        }
                        await api.put(`/users/${user._id}`, {
                          username: user.username,
                        });
                        setSnackbar({
                          open: true,
                          message: t("usernameUpdated"),
                          type: "success",
                        });
                      } catch (error: any) {
                        setSnackbar({
                          open: true,
                          message: t("serverError"),
                          type: "error",
                        });
                      }
                    }}
                  >
                    {t("changeUsername")}
                  </button>
                )}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t("email")}</label>
              <div className="relative">
                <input
                  type="email"
                  className="form-input"
                  value={user.email}
                  disabled
                  title={t("emailCannotBeEdited")}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t("password")}</label>
              <div className="form-row">
                <input
                  type="password"
                  className="form-input"
                  value={"•".repeat(8)}
                  readOnly
                  disabled
                  title={t("passwordCannotBeEdited")}
                />
                <button
                  className="btn-primary text-nowrap"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                >
                  {t("changePassword")}
                </button>
              </div>
              {showPasswordForm && (
                <form className="password-change-form" onSubmit={handleChangePassword}>
                  <div className="form-group">
                    <label className="form-label">
                      {t("currentPassword")}
                    </label>
                    <input
                      type="password"
                      className="form-input"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      {t("newPassword")}
                    </label>
                    <input
                      type="password"
                      className="form-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      {t("confirmPassword")}
                    </label>
                    <input
                      type="password"
                      className="form-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                    >
                      {t("cancel")}
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={changingPassword}
                    >
                      {changingPassword ? t("sending") : t("changePassword")}
                    </button>
                  </div>
                </form>
              )}
            </div>
            {/* 2FA Section */}
            <div className="form-group twofa-section">
              <label className="form-label">{t("twoFactorAuth")}</label>
              <div className="form-row items-center">
                <p className="twofa-description">
                  {t("twoFactorDescription")}
                </p>
                {user?.twoFactorEnabled ? (
                  <>
                    <span className="twofa-status-enabled text-nowrap">
                      {t("twoFAEnabled")}
                    </span>
                    <button
                      className="btn-secondary btn-sm text-nowrap"
                      onClick={handleDisable2FA}
                    >
                      {t("disable2FA")}
                    </button>
                  </>
                ) : (
                  <button
                    className="btn-primary btn-sm text-nowrap"
                    onClick={handleEnable2FA}
                  >
                    {t("enable2FA")}
                  </button>
                )}
              </div>
            </div>
            {!isAdmin && (
              <div className="form-group">
                <button
                  className="btn-danger"
                  onClick={() => setDeleteStep("warning")}
                >
                  {t("deleteAccount")}
                </button>
              </div>
            )}
          </div>
        </div>
        {/* App Theme Section */}
        <div className="settings-section section-spaced">
          <h2 className="settings-section-title">{t("appTheme")}</h2>
          <div className="theme-selector">
            <div
              className={`theme-option ${theme === "dark" ? "active" : ""}`}
              onClick={() => setTheme("dark")}
            >
              <div
                className="theme-preview"
                style={{
                  background: "#000000",
                  borderColor: theme === "dark" ? "#1a1a1a" : "#ddd",
                }}
              >
                <div
                  className="preview-inner"
                  style={{
                    background: "#1a1a1a",
                  }}
                ></div>
              </div>
              <span>{t("dark")}</span>
              {theme === "dark" && <span className="theme-check">✓</span>}
            </div>
            <div
              className={`theme-option ${theme === "purple" ? "active" : ""}`}
              onClick={() => setTheme("purple")}
            >
              <div
                className="theme-preview"
                style={{
                  background: "#250B24",
                  borderColor: theme === "purple" ? "#361134" : "#ddd",
                }}
              >
                <div
                  className="preview-inner"
                  style={{
                    background: "#361134",
                  }}
                ></div>
              </div>
              <span>{t("purple")}</span>
              {theme === "purple" && <span className="theme-check">✓</span>}
            </div>
            <div
              className={`theme-option ${theme === "cream" ? "active" : ""}`}
              onClick={() => setTheme("cream")}
            >
              <div
                className="theme-preview"
                style={{
                  background: "#F1F0CC",
                  borderColor: theme === "cream" ? "#FCFBE4" : "#ddd",
                }}
              >
                <div
                  className="preview-inner"
                  style={{
                    background: "#FCFBE4",
                  }}
                ></div>
              </div>
              <span>{t("cream")}</span>
              {theme === "cream" && <span className="theme-check">✓</span>}
            </div>
            <div
              className={`theme-option ${theme === "mango" ? "active" : ""}`}
              onClick={() => setTheme("mango")}
            >
              <div
                className="theme-preview"
                style={{
                  background: "#FFFFFF",
                  borderColor: theme === "mango" ? "#E77728" : "#ddd",
                }}
              >
                <div
                  className="preview-inner"
                  style={{
                    background: "#FFFFFF",
                    border: theme === "mango" ? "2px solid #ffd151" : "none",
                  }}
                ></div>
              </div>
              <span className="text-accent">{t("mango")}</span>
              {theme === "mango" && <span className="theme-check">✓</span>}
            </div>
            <div
              className={`theme-option ${theme === "light" ? "active" : ""}`}
              onClick={() => setTheme("light")}
            >
              <div
                className="theme-preview"
                style={{
                  background: "#FFFFFF",
                  borderColor: theme === "light" ? "#F5F5F5" : "#ddd",
                }}
              >
                <div
                  className="preview-inner"
                  style={{
                    background: "#F5F5F5",
                  }}
                ></div>
              </div>
              <span>{t("light")}</span>
              {theme === "light" && <span className="theme-check">✓</span>}
            </div>
          </div>
        </div>
        {/* Language Section */}
        <div className="settings-section section-spaced">
          <h2 className="settings-section-title">{t("language")}</h2>
          <div
            className="theme-selector grid-2"
          >
            <div
              className={`theme-option ${language === "en" ? "active" : ""}`}
              onClick={() => setLanguage("en")}
            >
              <div
                className="theme-preview"
                style={{
                  background: "#F1F0CC",
                  borderColor: language === "en" ? "#E77728" : "#ddd",
                }}
              >
                <span className="flag-icon">🇬🇧</span>
              </div>
              <span>{t("english")}</span>
              {language === "en" && <span className="theme-check">✓</span>}
            </div>
            <div
              className={`theme-option ${language === "bg" ? "active" : ""}`}
              onClick={() => setLanguage("bg")}
            >
              <div
                className="theme-preview"
                style={{
                  background: "#F1F0CC",
                  borderColor: language === "bg" ? "#E77728" : "#ddd",
                }}
              >
                <span className="flag-icon">🇧🇬</span>
              </div>
              <span>{t("bulgarian")}</span>
              {language === "bg" && <span className="theme-check">✓</span>}
            </div>
          </div>
        </div>
        {/* Delete Account Modal */}
        {deleteStep && (
          <div className="modal-overlay">
            <div className="modal modal-danger">
              {/* Warning step (shown for both self and admin deletion) */}
              {deleteStep === "warning" && (
                <>
                  <h2 className="modal-title">{t("deleteAccount")}</h2>
                  <p className="modal-text">
                    {t("deleteAccountWarning")}
                  </p>
                  <div className="modal-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => setDeleteStep(null)}
                    >
                      {t("cancel")}
                    </button>
                    <button
                      className="btn-danger"
                      onClick={handleDeleteContinue}
                      disabled={deleting}
                    >
                      {deleting ? t("loading") : t("continue")}
                    </button>
                  </div>
                </>
              )}

              {/* Reason step (only for admin) */}
              {deleteStep === "reason" && (
                <>
                  <h2 className="modal-title">
                    {t("reasonForDeletion")}
                  </h2>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleDeleteTerminate();
                    }}
                  >
                    <div className="form-group">
                      <label className="form-label">
                        {t("reasonForDeletion")}
                      </label>
                      <textarea
                        className="form-textarea"
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        required
                        rows={4}
                        placeholder={t("reasonForDeletionPlaceholder")}
                      />
                    </div>
                    <div className="modal-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleDeleteBack}
                      >
                        {t("goBack")}
                      </button>
                      <button
                        type="submit"
                        className="btn-danger"
                        disabled={deleting}
                      >
                        {deleting ? t("loading") : t("terminateAccount")}
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* Final confirmation (shown for both, but reached differently) */}
              {deleteStep === "confirm" && (
                <>
                  <h2 className="modal-title">{t("confirmDeletion")}</h2>
                  <p className="modal-text">
                    {isAdmin
                      ? t("confirmDeletionText")
                      : t("deleteAccountWarning")}
                  </p>
                  <div className="modal-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setDeleteStep(null);
                        if (isAdmin) setDeleteReason("");
                      }}
                    >
                      {t("cancel")}
                    </button>
                    <button
                      className="btn-danger"
                      onClick={handleDeleteConfirm}
                      disabled={deleting}
                    >
                      {deleting ? t("loading") : t("delete")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        {/* Enable 2FA Modal */}
        {showEnable2FAModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h2 className="modal-title">{t("twoFactorAuth")}</h2>
              <p className="modal-text">
                {t("twoFactorDescription")}
              </p>
              <form onSubmit={handleVerifySettings2FA} className="mt-5">
                <div className="form-group">
                  <label className="form-label">{t("twoFACodeLabel")}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="form-input twofa-code-input"
                    value={settingsTwoFACode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setSettingsTwoFACode(value);
                    }}
                    placeholder={t("twoFACodePlaceholder")}
                    autoFocus
                    disabled={settingsVerifying2FA}
                  />
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setShowEnable2FAModal(false);
                      setSettingsTwoFACode("");
                    }}
                    disabled={settingsVerifying2FA}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={settingsVerifying2FA || settingsTwoFACode.length !== 6}
                  >
                    {settingsVerifying2FA ? t("verifying2FA") : t("verify")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          open={snackbar.open}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
        <footer className="page-footer">
          <p>{t("copyright")}</p>
        </footer>
    </>
  );

  if (isAdmin) {
    return settingsContent;
  }

  return (
    <div className="settings-container">
      <UserSidebar />
      <div className="page-container">
        {settingsContent}
      </div>
    </div>
  );
};

export default Settings;
