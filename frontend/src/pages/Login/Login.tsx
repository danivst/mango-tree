/**
 * @file Login.tsx
 * @description Login page container component.
 * Orchestrates high-level authentication flows including login, registration, 
 * Two-Factor Authentication (2FA), and password recovery.
 * * Responsibilities:
 * - Manages centralized state for multiple auth forms and modals.
 * - Handles session-based notifications (account deletion, expiration, suspension).
 * - Synchronizes UI state (tabs) with browser routing (/login vs /signin).
 * - Loads and applies persistent user preferences (theme, language) post-auth.
 */

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authAPI, usersAPI, UserProfile } from "../../services/api";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation } from "../../utils/translations";
import { useNotifications } from "../../context/NotificationContext";
import { Theme, Language } from "../../utils/types";
import { useSnackbar } from "../../utils/snackbar";
import { 
  validateUsername, 
  validatePassword, 
  validateEmail, 
  validateTwoFactorCode, 
} from "../../utils/validators";
import LanguageSwitcher from "./LanguageSwitcher";
import LoginHeader from "./LoginHeader";
import LoginTabs from "./LoginTabs";
import LoginForm from "./forms/LoginForm";
import SignupForm from "./forms/SignupForm";
import TwoFactorModal from "./modals/TwoFactorModal";
import ForgotPasswordModal from "./password/forgotten/ForgotPasswordModal";
import SuspensionModal from "./modals/SuspensionModal";
import Footer from "../../components/global/Footer";
import Snackbar from "../../components/snackbar/Snackbar";
import "./Login.css";

/**
 * @component Login
 * @description The primary authentication entry point. Orchestrates the interaction 
 * between specialized forms and security modals while managing the complex business 
 * logic of the auth lifecycle.
 * * @requires useThemeLanguage - Handles real-time localization and theme application.
 * @requires useNotifications - Updates unread counts upon successful login.
 * @requires authAPI - Logic for backend communication (Login, Register, 2FA).
 * @requires useSnackbar - Standardized toast notifications for user feedback.
 * @returns {JSX.Element} The assembled Login/Signup page view.
 */
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, setLanguageImmediate, setThemeImmediate } =
    useThemeLanguage() as { 
      language: Language; 
      setLanguage: (l: Language) => void;
      setLanguageImmediate: (l: Language) => void;
      setThemeImmediate: (t: Theme) => void;
    };
  const { refreshUnreadCount } = useNotifications();
  const t = (key: string) => getTranslation(language, key);
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  // Get redirect URL from query params to resume previous navigation after login
  const redirectPath =
    new URLSearchParams(location.search).get("redirect");
  const routeState = location.state as
    | { from?: { pathname?: string; search?: string; hash?: string } }
    | undefined;
  const stateRedirectPath = routeState?.from?.pathname
    ? `${routeState.from.pathname}${routeState.from.search || ""}${routeState.from.hash || ""}`
    : null;

  const resolveRedirectTarget = (fallback: string) => {
    const candidates = [redirectPath, stateRedirectPath];

    for (const candidate of candidates) {
      if (!candidate) continue;

      let decoded = candidate;
      try {
        decoded = decodeURIComponent(candidate);
      } catch {
        decoded = candidate;
      }

      // Accept relative in-app paths only.
      if (decoded.startsWith("/")) {
        return decoded;
      }

      // If a full URL is passed (e.g. copied link), allow it only when same-origin.
      try {
        const parsed = new URL(decoded);
        if (parsed.origin === window.location.origin) {
          return `${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
      } catch {
        // ignore malformed redirect candidate and continue
      }
    }

    return fallback;
  };

  /**
   * State: Active view tab (Login vs Sign-up).
   * Initialized based on current URL path.
   */
  const [activeTab, setActiveTab] = useState<"login" | "signin">(() => {
    if (location.pathname === "/signin") return "signin";
    return "login";
  });

  // Security & Modal States
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFAUserId, setTwoFAUserId] = useState<string | null>(null);
  const [twoFACode, setTwoFACode] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);

  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");

  // LoginForm-specific state
  const [loginUsername, setLoginUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // SignupForm-specific state
  const [username, setUsername] = useState("");
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const [showSigninPassword, setShowSigninPassword] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  // Password Recovery state
  const [forgotEmail, setForgotEmail] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Validation & Server Error State
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    signinEmail?: string;
    signinPassword?: string;
    forgotEmail?: string;
    twofaCode?: string;
  }>({});

  /**
   * Effect: Check for session-based flags on mount.
   * Handles edge cases like redirected logout, account deletion confirmation, 
   * session expiration, and administrative suspensions.
   */
  useEffect(() => {
    const accountDeleted = sessionStorage.getItem("accountDeleted");
    if (accountDeleted === "true") {
      showSuccess(t("accountDeletedSuccessfully"));
      sessionStorage.removeItem("accountDeleted");
      sessionStorage.removeItem("sessionExpired");
    }

    const sessionExpired = sessionStorage.getItem("sessionExpired");
    if (sessionExpired === "true") {
      showError(t("sessionExpired"));
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
  }, [language, showSuccess, showError, t]);

  /**
   * Effect: Sync browser URL path with the active tab state.
   */
  useEffect(() => {
    const path = activeTab === "login" ? "/login" : "/signin";
    if (location.pathname !== path) {
      navigate(path, { replace: true });
    }
  }, [activeTab, navigate, location.pathname]);

  /**
   * Effect: Sync active tab state with the browser URL path (Back/Forward navigation support).
   */
  useEffect(() => {
    if (location.pathname === "/signin" && activeTab !== "signin") {
      setActiveTab("signin");
    } else if (location.pathname === "/login" && activeTab !== "login") {
      setActiveTab("login");
    }
  }, [location.pathname, activeTab]);

  /**
   * Retrieves and applies user-specific settings (Theme/Language) upon successful login.
   * Uses Immediate setters to bypass normal state lag and provide a seamless transition.
   */
  const loadUserPreferences = async () => {
    try {
      const user: UserProfile = await usersAPI.getCurrentUser();
      if (user.theme) {
        setThemeImmediate(user.theme as Theme);
      }
      if (user.language) {
        setLanguageImmediate(user.language as Language);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("No user preferences loaded (not logged in)", error);
      }
    }
  };

  /**
   * Logic: Handle Login Submission.
   * Orchestrates 2FA redirection, credential validation, cookie-based session login, and redirection.
   * Handles specific error codes like 403 (Banned) and 401 (Unauthorized).
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Use Centralized Validators
    const usernameError = validateUsername(loginUsername);
    if (usernameError) {
      setErrors({ username: t(usernameError) });
      setLoading(false);
      return;
    }

    // Manual check for password presence (Backend handles strict strength on login)
    if (!password) {
      setErrors({ password: t("passwordRequired") });
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.login(loginUsername.trim(), password);

      // Handle 2FA Requirement
      if (response.twoFactorRequired) {
        setTwoFAUserId(response.userId ?? null);
        setShow2FAModal(true);
        showSuccess(t("twoFACodeSent"));
        setLoading(false);
        return;
      }

      showSuccess(t("successfullyLoggedIn"));

      await loadUserPreferences();
      await refreshUnreadCount();

      const redirectTo = resolveRedirectTarget(response.redirectTo || "/home");
      setTimeout(() => {
        navigate(redirectTo);
      }, 1000);
    } catch (error: any) {
      const errorData = error.response?.data;
      const serverMessage = errorData?.message || "";
      const errorField = errorData?.field;
      let errorMessage = t("serverError");

      // Handle Ban Enforcement
      if (
        error.response?.status === 403 &&
        serverMessage.toLowerCase().includes("banned") &&
        errorData?.reason
      ) {
        const reason = errorData.reason;
        const template = t("accountBannedMessage");
        errorMessage = template.replace(/{reason}/g, reason);
        showError(errorMessage);
        setLoading(false);
        return;
      }

      // Specialized Error Mapping
      if (errorField === "username") {
        if (
          serverMessage.toLowerCase().includes("not found") ||
          serverMessage.toLowerCase().includes("does not exist") ||
          serverMessage.toLowerCase().includes("no account")
        ) {
          errorMessage = t("userNotFound");
        } else {
          errorMessage = serverMessage || errorMessage;
        }
        setErrors({ username: errorMessage });
      } else if (errorField === "password") {
        if (serverMessage.toLowerCase().includes("incorrect")) {
          errorMessage = t("incorrectPassword");
        } else if (
          serverMessage.toLowerCase().includes("must contain") ||
          serverMessage.toLowerCase().includes("requirements")
        ) {
          errorMessage = t("invalidPassword");
        } else {
          errorMessage = t("incorrectPassword");
        }
        setErrors({ password: errorMessage });
      } else {
        if (error.response?.status === 401) {
          showError(t("incorrectPassword"));
        } else {
          showError(serverMessage || errorMessage);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logic: Handle Forgot Password flow.
   * Sends recovery email and manages UI state transitions.
   */
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingEmail(true);
    setErrors({ ...errors, forgotEmail: undefined });

    // Use Centralized Email Validator
    const emailError = validateEmail(forgotEmail);
    if (emailError) {
      setErrors({ ...errors, forgotEmail: t(emailError) });
      setSendingEmail(false);
      return;
    }

    try {
      await authAPI.forgotPassword(forgotEmail.trim());
      showSuccess(t("emailSent"));
      setShowForgotModal(false);
      setForgotEmail("");
      setErrors({ ...errors, forgotEmail: undefined });
    } catch (error: any) {
      const errorData = error.response?.data;
      const serverMessage = errorData?.message || "";
      if (
        serverMessage.toLowerCase().includes("not found") ||
        serverMessage.toLowerCase().includes("no account") ||
        serverMessage.toLowerCase().includes("email does not exist")
      ) {
        setErrors({ ...errors, forgotEmail: t("emailNotFound") });
      } else {
        setErrors({
          ...errors,
          forgotEmail: serverMessage || t("serverError"),
        });
      }
    } finally {
      setSendingEmail(false);
    }
  };

  /**
   * Logic: Finalize 2FA Verification.
   * Validates the security code and finishes the authentication handshake.
   */
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFAUserId) return;

    // Use Centralized 2FA Validator
    const codeError = validateTwoFactorCode(twoFACode);
    if (codeError) {
      showError(t(codeError));
      return;
    }

    setVerifying2FA(true);
    try {
      const response = await authAPI.verify2FA(twoFAUserId, twoFACode);
      showSuccess(t("twoFACodeVerified"));

      await loadUserPreferences();
      await refreshUnreadCount();

      setShow2FAModal(false);
      setTwoFAUserId(null);
      setTwoFACode("");

      const redirectTo = resolveRedirectTarget(response.redirectTo || "/home");
      setTimeout(() => {
        navigate(redirectTo);
      }, 1000);
    } catch (error: any) {
      showError(t("serverError"));
      setTwoFACode("");
    } finally {
      setVerifying2FA(false);
    }
  };

  /**
   * Logic: Handle Account Registration.
   * Manages data sanitization and backend registration lifecycle.
   */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setErrors({});

    // Use Centralized Validators
    const usernameError = validateUsername(username);
    if (usernameError) {
      setErrors({ username: t(usernameError) });
      setSigningIn(false);
      return;
    }

    const emailError = validateEmail(signinEmail);
    if (emailError) {
      setErrors({ signinEmail: t(emailError) });
      setSigningIn(false);
      return;
    }

    const passwordError = validatePassword(signinPassword);
    if (passwordError) {
      setErrors({ signinPassword: t(passwordError) });
      setSigningIn(false);
      return;
    }

    try {
      await authAPI.register(
        username.trim(),
        signinEmail.trim(),
        signinPassword,
      );
      showSuccess(t("successfullyCreatedAccount"));

      await loadUserPreferences();
      await refreshUnreadCount();

      setUsername("");
      setSigninEmail("");
      setSigninPassword("");

      const redirectTo = resolveRedirectTarget("/home");
      setTimeout(() => {
        navigate(redirectTo);
      }, 1000);
    } catch (error: any) {
      const errorData = error.response?.data;
      const serverMessage = errorData?.message || "";
      const errorField = errorData?.field;
      let errorMessage = t("couldntCreateAccount");

      // Handle duplicate credential conflicts
      if (errorField === "username") {
        if (
          serverMessage.toLowerCase().includes("exists") ||
          serverMessage.toLowerCase().includes("already in use")
        ) {
          errorMessage = t("usernameExists");
        }
        setErrors({ username: errorMessage });
      } else if (errorField === "email") {
        if (
          serverMessage.toLowerCase().includes("exists") ||
          serverMessage.toLowerCase().includes("already in use")
        ) {
          errorMessage = t("emailExists");
        }
        setErrors({ signinEmail: errorMessage });
      } else if (errorField === "password") {
        setErrors({ signinPassword: serverMessage || t("invalidPassword") });
      } else {
        showError(serverMessage || errorMessage);
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleSuspensionOK = () => {
    setShowSuspensionModal(false);
    setSuspensionReason("");
    window.location.href = "/login";
  };

  const handleTabChange = (tab: "login" | "signin") => {
    setActiveTab(tab);
    setErrors({});
  };

  return (
    <div className="login-container">
      <LanguageSwitcher language={language} onLanguageChange={setLanguage} />

      <div className="login-box">
        <LoginHeader onNavigate={navigate} />
        <LoginTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          navigate={navigate}
          t={t}
        />

        {activeTab === "login" && (
          <LoginForm
            username={loginUsername}
            password={password}
            showPassword={showPassword}
            rememberMe={rememberMe}
            loading={loading}
            errors={errors}
            onFieldChange={(field, value) => {
              if (field === "username") setLoginUsername(value);
              if (field === "password") setPassword(value);
            }}
            onTogglePassword={() => setShowPassword(!showPassword)}
            onRememberMeChange={setRememberMe}
            onSubmit={handleLogin}
            onForgotPassword={() => setShowForgotModal(true)}
            t={t}
          />
        )}

        {activeTab === "signin" && (
          <SignupForm
            username={username}
            email={signinEmail}
            password={signinPassword}
            showPassword={showSigninPassword}
            signingIn={signingIn}
            errors={{
              username: errors.username,
              signinEmail: errors.signinEmail,
              signinPassword: errors.signinPassword,
            }}
            onFieldChange={(field, value) => {
              if (field === "username") setUsername(value);
              if (field === "signinEmail") setSigninEmail(value);
              if (field === "signinPassword") setSigninPassword(value);
            }}
            onTogglePassword={() => setShowSigninPassword(!showSigninPassword)}
            onSubmit={handleSignIn}
            t={t}
          />
        )}
      </div>

      <ForgotPasswordModal
        open={showForgotModal}
        email={forgotEmail}
        sending={sendingEmail}
        error={errors.forgotEmail}
        onEmailChange={setForgotEmail}
        onSubmit={handleForgotPassword}
        onCancel={() => setShowForgotModal(false)}
        t={t}
      />

      <TwoFactorModal
        open={show2FAModal}
        code={twoFACode}
        verifying={verifying2FA}
        error={errors.twofaCode}
        onCodeChange={setTwoFACode}
        onSubmit={handleVerify2FA}
        onCancel={() => {
          setShow2FAModal(false);
          setTwoFAUserId(null);
          setTwoFACode("");
        }}
        t={t}
      />

      <SuspensionModal
        open={showSuspensionModal}
        reason={suspensionReason}
        onOK={handleSuspensionOK}
        t={t}
      />

      <Footer />
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