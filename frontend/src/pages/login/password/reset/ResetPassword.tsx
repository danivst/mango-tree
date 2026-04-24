/**
 * @file ResetPassword.tsx
 * @description Password reset page for users who forgot their password.
 * User receives an email with a reset token link. This page validates the token and allows password reset.
 *
 * Flow:
 * 1. Extract token from URL query params.
 * 2. Fetch user's email associated with token via /api/auth/reset-token/:token.
 * 3. If valid, show password reset form.
 * 4. Submit new password to /api/auth/reset-password.
 * 5. On success, show message and redirect to login.
 */

import { useState, useEffect } from "react";
import { useThemeLanguage } from "../../../../context/ThemeLanguageContext";
import { getTranslation } from "../../../../utils/translations";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSnackbar } from "../../../../utils/snackbar";
import Snackbar from "../../../../components/snackbar/Snackbar";
import { validatePassword, validatePasswordMatch } from "../../../../utils/validators";
import "./ResetPassword.css";
import "../../Login.css";

// MUI Icon Imports
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

/**
 * @component ResetPassword
 * @description Component for resetting account password using a unique secure token.
 * * Features:
 * - Token validation (redirects to login if missing/invalid).
 * - Email display (read-only) fetched from token lookup.
 * - Password complexity validation (Upper, Lower, Number, Special Character).
 * - Show/hide password toggles for both password and confirmation fields.
 * - Language switcher support (EN/BG).
 *
 * Route: /reset-password?token=...
 * Access: Public (requires valid reset token from email).
 *
 * @requires useSearchParams - Get reset token from URL.
 * @requires useNavigate - Redirect after completion or on error.
 * @requires useThemeLanguage - Translations and language switching.
 * @requires useSnackbar - Feedback message management.
 * @returns {JSX.Element} The rendered reset password view.
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

  /**
   * Effect: Fetch email from token and verify access on mount.
   * Ensures the user has a valid reset link before showing the form.
   */
  useEffect(() => {
    // Require reset token for all access
    if (!token) {
      showError(t("invalidResetLink"));
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      setFetchingEmail(false);
      return;
    }

    // Fetch email from reset token
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

    // Use Centralized Password Validator
    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrors({
        password: t(passwordError),
      });
      setLoading(false);
      return;
    }

    // Use Centralized Password Match Validator
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
      {/* Language Toggle */}
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

      <div className="login-box">
        <div className="login-header">
          <img src="/mangotree-logo.png" alt="MangoTree" className="logo-placeholder" />
          <h1 className="login-title">MangoTree</h1>
        </div>

        {fetchingEmail ? (
          <div className="loading-state">
            <p>Loading...</p>
            <p>Verifying reset token...</p>
          </div>
        ) : email ? (
          <form onSubmit={handleReset} className="login-form">
            {/* Read-only Email Field */}
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

            {/* New Password Field */}
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

            {/* Confirm Password Field */}
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

            {/* Form Actions */}
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