import { useState, useEffect } from "react";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { getTranslation } from "../utils/translations";
import { useNavigate, useSearchParams } from "react-router-dom";
import Snackbar from "../components/Snackbar";
import "./ResetPassword.css";
import "./Login.css";
import logo from "../assets/mangotree-logo.png";

/**
 * @file ResetPassword.tsx
 * @description Password reset page for users who forgot their password.
 * User receives email with reset token link. This page validates token and allows password reset.
 *
 * Flow:
 * 1. Extract token from URL query params
 * 2. Fetch user's email associated with token via /api/auth/reset-token/:token
 * 3. If valid, show password reset form
 * 4. Submit new password to /api/auth/reset-password
 * 5. On success, show message and redirect to login
 *
 * Features:
 * - Token validation (redirects if missing/invalid)
 * - Email display (read-only) from token lookup
 * - Password complexity validation (same as SetupPassword)
 * - Show/hide password toggles
 * - Language switcher (EN/BG)
 *
 * Route: /reset-password?token=...
 * Access: Public (requires valid reset token from email)
 *
 * @page
 * @requires useSearchParams - Get reset token from URL
 * @requires useNavigate - Redirect after completion or on error
 * @requires useThemeLanguage - Translations and language switching
 * @requires Snackbar - Feedback messages
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
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: "success" | "error";
  }>({ open: false, message: "", type: "success" });
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  // Fetch email from token and check access
  useEffect(() => {
    console.log("ResetPassword component mounted");
    console.log(
      "🔑 Token from URL:",
      token ? `${token.substring(0, 10)}...` : "No token",
    );

    // Require reset token for all access
    if (!token) {
      console.log("No token found in URL, redirecting to login");
      setSnackbar({
        open: true,
        message: t("invalidResetLink"),
        type: "error",
      });
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      setFetchingEmail(false);
      return;
    }

    // Fetch email from reset token
    const fetchEmail = async () => {
      console.log("Fetching email for reset token...");
      try {
        const response = await fetch(`/api/auth/reset-token/${token}`);
        console.log("Response status:", response.status);
        const data = await response.json();
        console.log("Response data:", data);

        if (!response.ok) {
          throw new Error(data.message || "Invalid token");
        }

        if (!data.email) {
          throw new Error("Email not found for this token");
        }

        console.log("Email fetched successfully:", data.email);
        setEmail(data.email);
        setFetchingEmail(false);
      } catch (error: any) {
        console.error("Error fetching email:", error);
        setSnackbar({
          open: true,
          message: error.message || "Invalid or expired token",
          type: "error",
        });
        setFetchingEmail(false);
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    };

    fetchEmail();
  }, [token, navigate]);

  /**
   * Handles password reset form submission.
   * Validates password meets complexity requirements and matches confirmation.
   * Sends POST request to /api/auth/reset-password with token and new password.
   *
   * On success: shows success snackbar, redirects to login after 2s
   * On error: displays field-specific errors or general snackbar
   *
   * @param {React.FormEvent} e - Form submission event
   */
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Frontend validation for new password
    if (!password) {
      setErrors({
        password: t("passwordMinLength"),
      });
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setErrors({
        password: t("passwordMinLength"),
      });
      setLoading(false);
      return;
    }

    // Password complexity validation (same as SetupPassword)
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      setErrors({
        password: t("passwordMinLength"),
      });
      setLoading(false);
      return;
    }

    // Check password match
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: t("passwordsDoNotMatch") });
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
          setSnackbar({
            open: true,
            message: data.message || "Failed to reset password",
            type: "error",
          });
        }
        setLoading(false);
        return;
      }

      setSnackbar({
        open: true,
        message: t("passwordResetSuccess"),
        type: "success",
      });

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || "Failed to reset password",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <div className="login-container">
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
          <img src={logo} alt="MangoTree" className="logo-placeholder" />
          <h1 className="login-title">MangoTree</h1>
        </div>

        {fetchingEmail ? (
          <div className="loading-state">
            <p>Loading...</p>
            <p>Verifying reset token...</p>
          </div>
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
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
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
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword}</span>
              )}
            </div>

            <div className="form-actions">
              <button type="button" className="invisible">
                Placeholder
              </button>
              <button type="submit" className="btn-solid" disabled={loading}>
                {loading
                  ? t("sending")
                  : t("resetPassword")}
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
