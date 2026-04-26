/**
 * @file ResetPassword.tsx
 * @description Password reset page for users who arrive with a reset token.
 */

import { useState, useEffect } from "react";
import { useThemeLanguage } from "../../../../context/ThemeLanguageContext";
import { getTranslation } from "../../../../utils/translations";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSnackbar } from "../../../../utils/snackbar";
import Snackbar from "../../../../components/snackbar/Snackbar";
import Loading from "../../../../components/global/Loading";
import { validatePassword, validatePasswordMatch } from "../../../../utils/validators";
import "./ResetPassword.css";
import "../../Login.css";

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LanguageSwitcher from "../../LanguageSwitcher";

/**
 * @component ResetPassword
 * @description Renders the password reset flow for a validated reset token.
 * @requires useSearchParams - Reads the reset token from the URL.
 * @requires useNavigate - Redirects after completion or invalid access.
 * @requires useThemeLanguage - Provides translations and language switching.
 * @requires useSnackbar - Shows feedback messages.
 * @returns {JSX.Element} The rendered reset password page.
 */
const ResetPassword = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingEmail, setFetchingEmail] = useState(true);
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    if (!token) {
      showError(t("invalidResetLink"));
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      setFetchingEmail(false);
      return;
    }

    const fetchEmail = async () => {
      try {
        const response = await fetch(`/api/auth/reset-token/${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Invalid token");
        }

        if (!data.email) {
          throw new Error("Email not found for this token");
        }

        setEmail(data.email);
        setFetchingEmail(false);
      } catch (error: any) {
        showError(error.message || "Invalid or expired token");
        setFetchingEmail(false);
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    };

    fetchEmail();
  }, [token, navigate, showError, t]);

  /**
   * Handles password reset form submission.
   * Validates password meets complexity requirements and matches confirmation.
   * Sends POST request to /api/auth/reset-password with token and new password.
   *
   * On success: shows success snackbar, redirects to login after 2s.
   * On error: displays field-specific errors or general snackbar.
   *
   * @param {React.FormEvent} e - Form submission event.
   */
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrors({
        password: t(passwordError),
      });
      setLoading(false);
      return;
    }

    const matchError = validatePasswordMatch(password, confirmPassword);
    if (matchError) {
      setErrors({ confirmPassword: t(matchError) });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorField = data.field;
        if (errorField === "password") {
          setErrors({ password: data.message });
        } else {
          showError(data.message || "Failed to reset password");
        }
        setLoading(false);
        return;
      }

      showSuccess(t("passwordResetSuccess"));

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error: any) {
      showError(error.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <LanguageSwitcher language={language} onLanguageChange={setLanguage} />
      <div className="login-box">
        <div className="login-header">
          <img src="/mangotree-logo.png" alt="MangoTree" className="logo-placeholder" />
          <h1 className="login-title">MangoTree</h1>
        </div>
        {fetchingEmail ? (
          <Loading />
        ) : email ? (
          <form onSubmit={handleReset} className="login-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                {t("email")}
              </label>
              <input
                id="email"
                type="email"
                className="form-input email-disabled"
                value={email}
                readOnly
                disabled
                title="Email for resetting password cannot be edited"
              />
            </div>
            <div className="form-group">
              <label
                htmlFor="password"
                className={`form-label ${errors.password ? "label-error" : ""}`}
              >
                {t("password")}
              </label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={`form-input ${errors.password ? "input-error" : ""}`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors({ ...errors, password: undefined });
                    }
                  }}
                  placeholder={t("enterYourPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <VisibilityOff sx={{ fontSize: 20 }} />
                  ) : (
                    <Visibility sx={{ fontSize: 20 }} />
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>
            <div className="form-group">
              <label
                htmlFor="confirmPassword"
                className={`form-label ${errors.confirmPassword ? "label-error" : ""}`}
              >
                {t("confirmPassword")}
              </label>
              <div className="password-input-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className={`form-input ${errors.confirmPassword ? "input-error" : ""}`}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: undefined });
                    }
                  }}
                  placeholder={t("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="password-toggle"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <VisibilityOff sx={{ fontSize: 20 }} />
                  ) : (
                    <Visibility sx={{ fontSize: 20 }} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword}</span>
              )}
            </div>
            <div className="form-actions">
              <button type="button" className="invisible" disabled aria-hidden="true">
                Placeholder
              </button>
              <button type="submit" className="btn-solid" disabled={loading}>
                {loading ? t("sending") : t("resetPassword")}
              </button>
            </div>
          </form>
        ) : (
          <div className="unable-load-message">
            <p>{t("unableToLoadResetForm")}</p>
          </div>
        )}
        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          open={snackbar.open}
          onClose={closeSnackbar}
        />
      </div>
    </div>
  );
};

export default ResetPassword;
