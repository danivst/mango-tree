import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authAPI, usersAPI, UserProfile } from "../services/api";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { getTranslation } from "../utils/translations";
import { useNotifications } from "../context/NotificationContext";
import { Theme, Language } from "../utils/types";
import Snackbar from "../components/Snackbar";
import "./Login.css";
import logo from "../assets/mangotree-logo.png";

/**
 * @file Login.tsx
 * @description Unified authentication page combining login and signup (register) flows.
 * Supports:
 * - User login with username/password
 * - User registration (signin) with username/email/password
 * - Two-factor authentication (2FA) verification
 * - Password reset via email ("Forgot Password")
 * - Account suspension notifications
 * - Session expiry handling
 *
 * Features:
 * - Tabbed interface (Login / Signup)
 * - Real-time form validation
 * - 2FA modal for accounts with 2FA enabled
 * - Suspension modal with reason display
 * - Forgot password modal with email verification
 * - Route-based tab sync (URL determines active tab)
 * - Automatic theme/language preference loading
 *
 * Routes:
 * - /login → Login tab active
 * - /signin → Signup tab active
 *
 * Session flags checked on mount (sessionStorage):
 * - accountDeleted: Shows success message
 * - sessionExpired: Shows error message
 * - accountSuspended: Shows suspension modal with reason
 *
 * @page
 * @requires useNavigate - Navigation on auth success, tab switching
 * @requires useLocation - Path-based tab syncing, return redirect
 * @requires useThemeLanguage - Preferences and translations
 * @requires useNotifications - Refresh unread count on login
 * @requires authAPI - Login, register, 2FA verification
 * @requires usersAPI - Preference loading, username check
 */

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, setTheme } = useThemeLanguage();
  const { refreshUnreadCount } = useNotifications();
  const t = (key: string) => getTranslation(language, key);

  const [activeTab, setActiveTab] = useState<"login" | "signin">(() => {
    if (location.pathname === "/signin") return "signin";
    return "login";
  });

  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFAUserId, setTwoFAUserId] = useState<string | null>(null);
  const [twoFACode, setTwoFACode] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);

  // Check for account deletion, session expiry, and account suspension
  useEffect(() => {
    const accountDeleted = sessionStorage.getItem("accountDeleted");
    if (accountDeleted === "true") {
      setSnackbar({
        open: true,
        message: t("accountDeletedSuccessfully"),
        type: "success",
      });
      sessionStorage.removeItem("accountDeleted");
      sessionStorage.removeItem("sessionExpired");
    }

    const sessionExpired = sessionStorage.getItem("sessionExpired");
    if (sessionExpired === "true") {
      setSnackbar({
        open: true,
        message: t("sessionExpired"),
        type: "error",
      });
      sessionStorage.removeItem("sessionExpired");
    }

    const accountSuspended = sessionStorage.getItem("accountSuspended");
    const suspensionReason = sessionStorage.getItem("suspensionReason");
    if (accountSuspended === "true" && suspensionReason) {
      setShowSuspensionModal(true);
      setSuspensionReason(suspensionReason);
      sessionStorage.removeItem("accountSuspended");
      sessionStorage.removeItem("suspensionReason");
    }
  }, [language]);

  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");

  /**
   * Handles acknowledgment of account suspension.
   * Closes suspension modal, clears reason, and redirects to login page.
   * Used when suspended user tries to access app and sees suspension notice.
   */
  const handleSuspensionOK = () => {
    setShowSuspensionModal(false);
    setSuspensionReason("");
    window.location.href = "/login";
  };

  /**
   * Fetches user preferences from backend and applies them to UI.
   * Used after successful authentication to sync theme and language.
   * If not logged in or request fails, silently ignores (defaults used).
   */
  const loadUserPreferences = async () => {
    try {
      const user: UserProfile = await usersAPI.getCurrentUser();
      if (user.theme) {
        setTheme(user.theme as Theme);
      }
      if (user.language) {
        setLanguage(user.language as Language);
      }
    } catch (error) {
      console.log("No user preferences loaded (not logged in)");
    }
  };

  const [loginUsername, setLoginUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [username, setUsername] = useState("");
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSigninPassword, setShowSigninPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: "success" | "error";
  }>({ open: false, message: "", type: "success" });
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    signinUsername?: string;
    signinEmail?: string;
    signinPassword?: string;
    forgotEmail?: string;
    twofaCode?: string;
  }>({});

  // Sync path with active tab
  useEffect(() => {
    const path = activeTab === "login" ? "/login" : "/signin";
    if (location.pathname !== path) {
      navigate(path, { replace: true });
    }
  }, [activeTab, navigate, location.pathname]);

  // Sync active tab with path
  useEffect(() => {
    if (location.pathname === "/signin" && activeTab !== "signin") {
      setActiveTab("signin");
    } else if (location.pathname === "/login" && activeTab !== "login") {
      setActiveTab("login");
    }
  }, [location.pathname]);

  /**
   * Handles login form submission.
   * Validates username (min 3 chars) and password presence.
   * Attempts authentication via authAPI.login.
   *
   * Flow:
   * 1. If 2FA required → show 2FA modal, don't navigate yet
   * 2. If success → save tokens, load preferences, refresh notifications, redirect after 1s
   * 3. If rememberMe checked → set 30-day token expiration
   * 4. Error handling:
   *    - Account banned → show suspension modal via sessionStorage
   *    - Field errors → map to appropriate error messages
   *    - Generic errors → snackbar
   *
   * @param {React.FormEvent} e - Form submission event
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const trimmedUsername = loginUsername.trim();
    if (!trimmedUsername || trimmedUsername.length < 3) {
      setErrors({ username: t("usernameMinLength") });
      setLoading(false);
      return;
    }

    if (!password) {
      setErrors({ password: t("passwordMinLength") });
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.login(trimmedUsername, password);

      if (response.twoFactorRequired) {
        setTwoFAUserId(response.userId ?? null);
        setShow2FAModal(true);
        setSnackbar({
          open: true,
          message: t("twoFACodeSent"),
          type: "success",
        });
        setLoading(false);
        return;
      }

      setSnackbar({
        open: true,
        message: t("successfullyLoggedIn"),
        type: "success",
      });

      if (response.token && response.refreshToken) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("refreshToken", response.refreshToken);

        if (rememberMe) {
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + 30);
          localStorage.setItem("tokenExpiration", expirationDate.toISOString());
        }
      }

      await loadUserPreferences();
      await refreshUnreadCount();

      const redirectTo = response.redirectTo || "/home";
      setTimeout(() => {
        navigate(redirectTo);
      }, 1000);
    } catch (error: any) {
      const errorData = error.response?.data;
      let errorMessage = t("serverError");
      const errorField = errorData?.field;

      if (errorMessage === "accountBanned" && errorData?.reason) {
        const reason = errorData.reason;
        const template = t("accountBannedMessage");
        errorMessage = template.replace(/{reason}/g, reason);
      }

      if (errorField === "username") {
        setErrors({ username: errorMessage });
      } else if (errorField === "password") {
        if (errorMessage.toLowerCase().includes("incorrect")) {
          errorMessage = t("incorrectPassword");
        } else if (
          errorMessage.toLowerCase().includes("must contain") ||
          errorMessage.toLowerCase().includes("requirements")
        ) {
          errorMessage = t("invalidPassword");
        }
        setErrors({ password: errorMessage });
      } else {
        setSnackbar({
          open: true,
          message: errorMessage,
          type: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles "Forgot Password" form submission.
   * Validates email format, then calls forgotPassword API.
   *
   * On success: closes modal, clears email field, shows success snackbar.
   * On error: distinguishes between "email not found" and other errors;
   *           field error goes in forgotEmail error, else snackbar.
   *
   * @param {React.FormEvent} e - Form submission event
   */
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSendingEmail(true);
    setErrors({ ...errors, forgotEmail: undefined });

    const trimmedEmail = forgotEmail.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setErrors({ ...errors, forgotEmail: t("emailMustContain") });
      setSendingEmail(false);
      return;
    }

    try {
      await authAPI.forgotPassword(trimmedEmail);
      setSnackbar({
        open: true,
        message: t("emailSent"),
        type: "success",
      });
      setShowForgotModal(false);
      setForgotEmail("");
      setErrors({ ...errors, forgotEmail: undefined });
    } catch (error: any) {
      let errorMessage = t("serverError");
      const lowerMsg = errorMessage.toLowerCase();
      if (
        lowerMsg.includes("not found") ||
        lowerMsg.includes("no account") ||
        lowerMsg.includes("email does not exist")
      ) {
        errorMessage = t("emailNotFound");
      }
      if (errorMessage.toLowerCase().includes("email")) {
        setErrors({ ...errors, forgotEmail: errorMessage });
      } else {
        setSnackbar({
          open: true,
          message: errorMessage,
          type: "error",
        });
      }
    } finally {
      setSendingEmail(false);
    }
  };

  /**
   * Handles 2FA code verification after initial login.
   * Validates 6-digit numeric code, then calls verify2FA API.
   *
   * On success: saves tokens, loads preferences, closes modal, redirects.
   * On error: shows snackbar, clears code field for retry.
   *
   * @param {React.FormEvent} e - Form submission event
   */
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFAUserId) return;

    if (!twoFACode || twoFACode.length !== 6 || !/^\d+$/.test(twoFACode)) {
      setSnackbar({
        open: true,
        message: t("invalid2FACode"),
        type: "error",
      });
      return;
    }

    setVerifying2FA(true);
    try {
      const response = await authAPI.verify2FA(twoFAUserId, twoFACode);

      setSnackbar({
        open: true,
        message: t("twoFACodeVerified"),
        type: "success",
      });

      if (response.token && response.refreshToken) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("refreshToken", response.refreshToken);
      }

      await loadUserPreferences();
      await refreshUnreadCount();

      setShow2FAModal(false);
      setTwoFAUserId(null);
      setTwoFACode("");

      const redirectTo = response.redirectTo || "/home";
      setTimeout(() => {
        navigate(redirectTo);
      }, 1000);
    } catch (error: any) {
      let errorMessage = t("serverError");
      setSnackbar({
        open: true,
        message: errorMessage,
        type: "error",
      });
      setTwoFACode("");
    } finally {
      setVerifying2FA(false);
    }
  };

  /**
   * Handles user registration (signup) form submission.
   * Validates username (>=3 chars), email (contains @), and password.
   * Calls authAPI.register to create new account.
   *
   * On success: saves tokens, loads preferences, clears form, redirects to home after 1s.
   * On error: maps field-level errors to appropriate form error states or snackbar.
   *
   * @param {React.FormEvent} e - Form submission event
   */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setErrors({});

    const trimmedUsername = username.trim();
    if (!trimmedUsername || trimmedUsername.length < 3) {
      setErrors({ username: t("usernameMinLength") });
      setSigningIn(false);
      return;
    }

    const trimmedEmail = signinEmail.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setErrors({ signinEmail: t("emailMustContain") });
      setSigningIn(false);
      return;
    }

    if (!signinPassword) {
      setErrors({ signinPassword: t("passwordMinLength") });
      setSigningIn(false);
      return;
    }

    try {
      const response = await authAPI.register(
        trimmedUsername,
        trimmedEmail,
        signinPassword,
      );

      setSnackbar({
        open: true,
        message: t("successfullyCreatedAccount"),
        type: "success",
      });

      if (response.token && response.refreshToken) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("refreshToken", response.refreshToken);
      }

      await loadUserPreferences();
      await refreshUnreadCount();

      setUsername("");
      setSigninEmail("");
      setSigninPassword("");

      setTimeout(() => {
        navigate("/home");
      }, 1000);
    } catch (error: any) {
      const errorData = error.response?.data;
      let errorMessage = t("couldntCreateAccount");
      const errorField = errorData?.field;

      if (errorField === "username") {
        setErrors({ username: errorMessage });
      } else if (errorField === "email") {
        setErrors({ signinEmail: errorMessage });
      } else if (errorField === "password") {
        if (errorMessage.toLowerCase().includes("incorrect")) {
          errorMessage = t("incorrectPassword");
        } else if (
          errorMessage.toLowerCase().includes("must contain") ||
          errorMessage.toLowerCase().includes("requirements")
        ) {
          errorMessage = t("invalidPassword");
        }
        setErrors({ signinPassword: errorMessage });
      } else {
        setSnackbar({
          open: true,
          message: errorMessage,
          type: "error",
        });
      }
    } finally {
      setSigningIn(false);
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
          <button
            onClick={() => navigate("/")}
            className="logo-button"
          >
            <img src={logo} alt="MangoTree" className="logo-placeholder" />
            <h1 className="login-title">MangoTree</h1>
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <button
            type="button"
            className={`login-tab-button ${activeTab === "login" ? "login-tab-active" : ""}`}
            onClick={() => {
              setActiveTab("login");
              setErrors({});
              navigate("/login", { replace: true });
            }}
          >
            {t("login")}
          </button>
          <button
            type="button"
            className={`login-tab-button ${activeTab === "signin" ? "login-tab-active" : ""}`}
            onClick={() => {
              setActiveTab("signin");
              setErrors({});
              navigate("/signin", { replace: true });
            }}
          >
            {t("signin")}
          </button>
        </div>

        {/* Login Form */}
        {activeTab === "login" && (
          <form
            onSubmit={(e) => {
              console.log("Form onSubmit event fired!");
              handleLogin(e);
            }}
            className="login-form"
          >
            <div className="login-form-group">
              <label
                htmlFor="username"
                className={`login-form-label ${errors.username ? "login-label-error" : ""}`}
              >
                {t("username")}
              </label>
              <input
                id="username"
                type="text"
                className={`login-form-input ${errors.username ? "login-input-error" : ""}`}
                value={loginUsername}
                onChange={(e) => {
                  setLoginUsername(e.target.value);
                  if (errors.username) {
                    setErrors({ ...errors, username: undefined });
                  }
                }}
                placeholder={t("enterYourUsername")}
              />
              {errors.username && (
                <span className="login-error-message">{errors.username}</span>
              )}
            </div>

            <div className="login-form-group">
              <label
                htmlFor="password"
                className={`login-form-label ${errors.password ? "login-label-error" : ""}`}
              >
                {t("password")}
              </label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={`login-form-input password-input ${errors.password ? "login-input-error" : ""}`}
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
                <span className="login-error-message">{errors.password}</span>
              )}
            </div>

            <div className="remember-me-group">
              <label htmlFor="remember-me" className="remember-me-label">
                {t("rememberMe")}
              </label>
              <input
                id="remember-me"
                type="checkbox"
                className="remember-me-checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
            </div>

            <div className="login-form-actions">
              <button
                type="button"
                className="btn-text"
                onClick={() => setShowForgotModal(true)}
              >
                {t("forgotPassword")}
              </button>
              <button
                type="button"
                className="btn-solid"
                disabled={loading}
                onClick={(e) => {
                  console.log("Button clicked directly!");
                  e.preventDefault();
                  handleLogin(e as any);
                }}
              >
                {loading ? t("loggingIn") : t("login")}
              </button>
            </div>
          </form>
        )}

        {/* Sign In Form */}
        {activeTab === "signin" && (
          <form onSubmit={handleSignIn} className="login-form">
            <div className="login-form-group">
              <label
                htmlFor="username"
                className={`login-form-label ${errors.username ? "login-label-error" : ""}`}
              >
                {t("username")}
              </label>
              <input
                id="username"
                type="text"
                className={`login-form-input ${errors.username ? "login-input-error" : ""}`}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) {
                    setErrors({ ...errors, username: undefined });
                  }
                }}
                placeholder={t("enterYourUsername")}
              />
              {errors.username && (
                <span className="login-error-message">{errors.username}</span>
              )}
            </div>

            <div className="login-form-group">
              <label
                htmlFor="signin-email"
                className={`login-form-label ${errors.signinEmail ? "login-label-error" : ""}`}
              >
                {t("email")}
              </label>
              <input
                id="signin-email"
                type="email"
                className={`login-form-input ${errors.signinEmail ? "login-input-error" : ""}`}
                value={signinEmail}
                onChange={(e) => {
                  setSigninEmail(e.target.value);
                  if (errors.signinEmail) {
                    setErrors({ ...errors, signinEmail: undefined });
                  }
                }}
                placeholder={t("enterYourEmail")}
              />
              {errors.signinEmail && (
                <span className="login-error-message">{errors.signinEmail}</span>
              )}
            </div>

            <div className="login-form-group">
              <label
                htmlFor="signin-password"
                className={`login-form-label ${errors.signinPassword ? "login-label-error" : ""}`}
              >
                {t("password")}
              </label>
              <div className="password-input-wrapper">
                <input
                  id="signin-password"
                  type={showSigninPassword ? "text" : "password"}
                  className={`login-form-input password-input ${errors.signinPassword ? "login-input-error" : ""}`}
                  value={signinPassword}
                  onChange={(e) => {
                    setSigninPassword(e.target.value);
                    if (errors.signinPassword) {
                      setErrors({ ...errors, signinPassword: undefined });
                    }
                  }}
                  placeholder={t("enterYourPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowSigninPassword(!showSigninPassword)}
                  className="password-toggle"
                  aria-label={showSigninPassword ? "Hide password" : "Show password"}
                >
                  {showSigninPassword ? (
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
              {errors.signinPassword && (
                <span className="login-error-message">{errors.signinPassword}</span>
              )}
            </div>

            <div className="login-form-actions">
              <button type="button" className="invisible">
                Placeholder
              </button>
              <button
                type="button"
                className="btn-solid"
                disabled={signingIn}
                onClick={(e) => {
                  e.preventDefault();
                  handleSignIn(e);
                }}
              >
                {signingIn ? t("creatingAccount") : t("signin")}
              </button>
            </div>
          </form>
        )}
      </div>

      {showForgotModal && (
        <div
          className="login-modal-overlay"
          onClick={() => setShowForgotModal(false)}
        >
          <div className="login-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="login-modal-title">{t("forgotPasswordTitle")}</h2>
            <p className="login-modal-subtitle">{t("forgotPasswordSubtitle")}</p>
            <form onSubmit={handleForgotPassword} className="login-modal-form">
              <div className="login-form-group">
                <label
                  htmlFor="forgot-email"
                  className={`login-form-label ${errors.forgotEmail ? "login-label-error" : ""}`}
                >
                  {t("email")}
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  className={`login-form-input ${errors.forgotEmail ? "login-input-error" : ""}`}
                  value={forgotEmail}
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    if (errors.forgotEmail) {
                      setErrors({ ...errors, forgotEmail: undefined });
                    }
                  }}
                  placeholder={t("enterYourEmail")}
                />
                {errors.forgotEmail && (
                  <span className="login-error-message">{errors.forgotEmail}</span>
                )}
              </div>
              <div className="login-form-actions">
                <button
                  type="button"
                  className="btn-text"
                  onClick={() => setShowForgotModal(false)}
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="btn-solid"
                  disabled={sendingEmail}
                >
                  {sendingEmail ? t("sending") : t("send")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA Verification Modal */}
      {show2FAModal && (
        <div className="login-modal-overlay">
          <div className="login-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="login-modal-title">{t("twoFactorAuth")}</h2>
            <p className="login-modal-subtitle">
              {t("twoFactorDescription")}
            </p>
            <form onSubmit={handleVerify2FA} className="login-modal-form">
              <div className="login-form-group">
                <label
                  htmlFor="twofa-code"
                  className={`login-form-label ${
                    errors.twofaCode ? "login-label-error" : ""
                  }`}
                >
                  {t("twoFACodeLabel")}
                </label>
                <input
                  id="twofa-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className={`login-form-input login-twofa-code-input ${
                    errors.twofaCode ? "login-input-error" : ""
                  }`}
                  value={twoFACode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setTwoFACode(value);
                    if (errors.twofaCode) {
                      setErrors({ ...errors, twofaCode: undefined });
                    }
                  }}
                  placeholder={t("twoFACodePlaceholder")}
                  autoFocus
                  disabled={verifying2FA}
                />
              </div>
              <div className="login-form-actions">
                <button
                  type="button"
                  className="btn-text"
                  onClick={() => {
                    setShow2FAModal(false);
                    setTwoFAUserId(null);
                    setTwoFACode("");
                  }}
                  disabled={verifying2FA}
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="btn-solid"
                  disabled={verifying2FA || twoFACode.length !== 6}
                >
                  {verifying2FA ? t("verifying2FA") : t("verify")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Suspension Modal */}
      {showSuspensionModal && (
        <div className="login-modal-overlay">
          <div className="login-modal-content">
            <h2 className="login-modal-title">{t("accountSuspended")}</h2>
            <p className="login-modal-subtitle mb-6 text-left">
              {t("suspensionMessage")} <strong>{suspensionReason}</strong>
            </p>
            <p className="login-modal-subtitle mb-6 text-left">
              {t("contactSupport")}
            </p>
            <div className="login-form-actions modal-actions-center">
              <button className="btn-solid" onClick={handleSuspensionOK}>
                {t("ok")}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="login-footer">
        <p>{t("copyright")}</p>
      </footer>

      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={closeSnackbar}
      />
    </div>
  );
};

export default Login;
