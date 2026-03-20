import { useState, useEffect } from "react";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { authAPI } from "../services/api";
import Snackbar from "../components/Snackbar";
import UserSidebar from "../components/UserSidebar";
import { getTranslation } from "../utils/translations";
import { clearAuth } from "../utils/auth";
import "./admin/AdminPages.css";
import AdminSidebar from "../components/AdminSidebar";

type DeleteStep = "warning" | "reason" | "confirm" | null;

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{
    _id: string;
    username: string;
    email: string;
    role: string;
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
        message: error.response?.data?.message || "Failed to load user info",
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
        message: t("passwordsDoNotMatch") || "Passwords do not match.",
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
        message: error.response?.data?.message || t("serverError"),
        type: "error",
      });
    } finally {
      setChangingPassword(false);
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
        message:
          error.response?.data?.message ||
          t("failedToDeleteUser") ||
          "Failed to delete account",
        type: "error",
      });
      setDeleting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="admin-page">
        <div className="admin-loading">{t("loading")}</div>
      </div>
    );
  }

  const isAdmin = user.role === "admin";

  return (
    <div style={{ display: "flex" }}>
      {isAdmin ? <AdminSidebar /> : <UserSidebar />}
      <div className="admin-page" style={{ flex: 1 }}>
        <h1 className="admin-page-title">{t("settings")}</h1>
        {/* Account Section */}
        <div className="settings-section">
          <h2 className="settings-section-title">{t("account")}</h2>
          <div className="settings-form">
            <div className="admin-form-group">
              <label className="admin-form-label">{t("username")}</label>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                }}
              >
                <input
                  type="text"
                  className="admin-form-input"
                  value={user.username}
                  onChange={(e) =>
                    setUser({ ...user, username: e.target.value })
                  }
                  style={{
                    flex: 1,
                    background: isAdmin ? "rgba(0, 0, 0, 0.1)" : undefined,
                    cursor: isAdmin ? "not-allowed" : undefined,
                    opacity: isAdmin ? 0.6 : undefined,
                  }}
                  disabled={isAdmin}
                  title={t("unableToEditUsername")}
                />
                {!isAdmin && (
                  <button
                    className="admin-button-primary"
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
                              t("usernameExists") || "Username already exists!",
                            type: "error",
                          });
                          return;
                        }
                        await api.put(`/users/${user._id}`, {
                          username: user.username,
                        });
                        setSnackbar({
                          open: true,
                          message: t("usernameUpdated") || "Username updated!",
                          type: "success",
                        });
                      } catch (error: any) {
                        setSnackbar({
                          open: true,
                          message:
                            error.response?.data?.message || t("serverError"),
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
            <div className="admin-form-group">
              <label className="admin-form-label">{t("email")}</label>
              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  className="admin-form-input"
                  value={user.email}
                  disabled
                  style={{
                    background: "rgba(0, 0, 0, 0.1)",
                    cursor: "not-allowed",
                    opacity: 0.6,
                  }}
                  title={t("emailCannotBeEdited")}
                />
              </div>
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">{t("password")}</label>
              <button
                className="admin-button-primary"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                style={{ whiteSpace: "nowrap" }}
              >
                {t("changePassword")}
              </button>
              {showPasswordForm && (
                <form
                  onSubmit={handleChangePassword}
                  style={{
                    marginTop: "16px",
                    padding: "16px",
                    background: "rgba(0, 0, 0, 0.05)",
                    borderRadius: "8px",
                  }}
                >
                  <div className="admin-form-group">
                    <label className="admin-form-label">
                      {t("currentPassword") || "Current Password"}
                    </label>
                    <input
                      type="password"
                      className="admin-form-input"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">
                      {t("newPassword") || "New Password"}
                    </label>
                    <input
                      type="password"
                      className="admin-form-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">
                      {t("confirmPassword")}
                    </label>
                    <input
                      type="password"
                      className="admin-form-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      type="submit"
                      className="admin-button-primary"
                      disabled={changingPassword}
                    >
                      {changingPassword ? t("sending") : t("changePassword")}
                    </button>
                    <button
                      type="button"
                      className="admin-button-secondary"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </form>
              )}
            </div>
            {!isAdmin && (
              <div className="admin-form-group" style={{ marginTop: "32px" }}>
                <button
                  className="admin-button-danger"
                  onClick={() => setDeleteStep("warning")}
                >
                  {t("deleteAccount")}
                </button>
                </div>
              )}
          </div>
        </div>
        {/* App Theme Section */}
        <div className="settings-section" style={{ marginTop: "48px" }}>
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
                  style={{
                    background: "#1a1a1a",
                    width: "60%",
                    height: "60%",
                    borderRadius: "4px",
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
                  style={{
                    background: "#361134",
                    width: "60%",
                    height: "60%",
                    borderRadius: "4px",
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
                  style={{
                    background: "#FCFBE4",
                    width: "60%",
                    height: "60%",
                    borderRadius: "4px",
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
                  style={{
                    background: "#FFFFFF",
                    width: "60%",
                    height: "60%",
                    borderRadius: "4px",
                    border: theme === "mango" ? "2px solid #ffd151" : "none",
                  }}
                ></div>
              </div>
              <span style={{ color: "#E77728" }}>{t("mango")}</span>
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
                  style={{
                    background: "#F5F5F5",
                    width: "60%",
                    height: "60%",
                    borderRadius: "4px",
                  }}
                ></div>
              </div>
              <span>{t("light")}</span>
              {theme === "light" && <span className="theme-check">✓</span>}
            </div>
          </div>
        </div>
        {/* Language Section */}
        <div className="settings-section" style={{ marginTop: "48px" }}>
          <h2 className="settings-section-title">{t("language")}</h2>
          <div
            className="theme-selector"
            style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: "32px" }}>🇬🇧</span>
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: "32px" }}>🇧🇬</span>
              </div>
              <span>{t("bulgarian")}</span>
              {language === "bg" && <span className="theme-check">✓</span>}
            </div>
          </div>
        </div>
        {/* Delete Account Modal */}
        {deleteStep && (
          <div className="admin-modal-overlay">
            <div className="admin-modal admin-modal-danger">
              {/* Warning step (shown for both self and admin deletion) */}
              {deleteStep === "warning" && (
                <>
                  <h2 className="admin-modal-title">{t("deleteAccount")}</h2>
                  <p className="admin-modal-text">
                    {t("deleteAccountWarning")}
                  </p>
                  <div className="admin-modal-actions">
                    <button
                      className="admin-button-secondary"
                      onClick={() => setDeleteStep(null)}
                    >
                      {t("cancel")}
                    </button>
                    <button
                      className="admin-button-danger"
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
                  <h2 className="admin-modal-title">
                    {t("reasonForDeletion")}
                  </h2>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleDeleteTerminate();
                    }}
                  >
                    <div className="admin-form-group">
                      <label className="admin-form-label">
                        {t("reasonForDeletion")}
                      </label>
                      <textarea
                        className="admin-form-textarea"
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        required
                        rows={4}
                        placeholder={t("reasonForDeletionPlaceholder")}
                      />
                    </div>
                    <div className="admin-modal-actions">
                      <button
                        type="button"
                        className="admin-button-secondary"
                        onClick={handleDeleteBack}
                      >
                        {t("goBack")}
                      </button>
                      <button
                        type="submit"
                        className="admin-button-danger"
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
                  <h2 className="admin-modal-title">{t("confirmDeletion")}</h2>
                  <p className="admin-modal-text">
                    {isAdmin ? t("confirmDeletionText") : t("deleteAccountWarning")}
                  </p>
                  <div className="admin-modal-actions">
                    <button
                      className="admin-button-secondary"
                      onClick={() => {
                        setDeleteStep(null);
                        if (isAdmin) setDeleteReason("");
                      }}
                    >
                      {t("cancel")}
                    </button>
                    <button
                      className="admin-button-danger"
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
        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          open={snackbar.open}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      </div>
    </div>
  );
};

export default Settings;