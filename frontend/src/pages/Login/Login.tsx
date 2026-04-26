/**
 * @file Login.tsx
 * @description Login page container component.
 * Orchestrates high-level authentication flows including login, registration, 
 * Two-Factor Authentication (2FA) and password recovery.
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
 * 
 * @requires useThemeLanguage - Handles real-time localization and theme application.
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

      if (decoded.startsWith("/")) {
        return decoded;
      }

      try {
        const parsed = new URL(decoded);
        if (parsed.origin === window.location.origin) {
          return `${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
      } catch {
      }
    }

    return fallback;
  };

  const [activeTab, setActiveTab] = useState<"login" | "signup">(() => {
    if (location.pathname === "/signup") return "signup";
    return "login";
  });

  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFAUserId, setTwoFAUserId] = useState<string | null>(null);
  const [twoFACode, setTwoFACode] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);

  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");

  const [loginUsername, setLoginUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signingUp, setSigningUp] = useState(false);

  const [forgotEmail, setForgotEmail] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    signupEmail?: string;
    signupPassword?: string;
    forgotEmail?: string;
    twofaCode?: string;
  }>({});

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

  useEffect(() => {
    const path = activeTab === "login" ? "/login" : "/signup";
    if (location.pathname !== path) {
      navigate(path, { replace: true });
    }
  }, [activeTab, navigate, location.pathname]);

  useEffect(() => {
    if (location.pathname === "/signup" && activeTab !== "signup") {
      setActiveTab("signup");
    } else if (location.pathname === "/login" && activeTab !== "login") {
      setActiveTab("login");
    }
  }, [location.pathname, activeTab]);

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

  const persistLoginLanguagePreference = async () => {
    try {
      await usersAPI.updateProfile({ language });
      setLanguageImmediate(language);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Failed to persist language preference", error);
      }
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const usernameError = validateUsername(loginUsername);
    if (usernameError) {
      setErrors({ username: t(usernameError) });
      setLoading(false);
      return;
    }

    if (!password) {
      setErrors({ password: t("passwordRequired") });
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.login(loginUsername.trim(), password, rememberMe);

      if (response.twoFactorRequired) {
        setTwoFAUserId(response.userId ?? null);
        setShow2FAModal(true);
        showSuccess(t("twoFACodeSent"));
        setLoading(false);
        return;
      }

      showSuccess(t("successfullyLoggedIn"));

      await persistLoginLanguagePreference();
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingEmail(true);
    setErrors({ ...errors, forgotEmail: undefined });

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

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFAUserId) return;

    const codeError = validateTwoFactorCode(twoFACode);
    if (codeError) {
      showError(t(codeError));
      return;
    }

    setVerifying2FA(true);
    try {
      const response = await authAPI.verify2FA(twoFAUserId, twoFACode, rememberMe);
      showSuccess(t("twoFACodeVerified"));

      await persistLoginLanguagePreference();
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningUp(true);
    setErrors({});

    const usernameError = validateUsername(username);
    if (usernameError) {
      setErrors({ username: t(usernameError) });
      setSigningUp(false);
      return;
    }

    const emailError = validateEmail(signupEmail);
    if (emailError) {
      setErrors({ signupEmail: t(emailError) });
      setSigningUp(false);
      return;
    }

    const passwordError = validatePassword(signupPassword);
    if (passwordError) {
      setErrors({ signupPassword: t(passwordError) });
      setSigningUp(false);
      return;
    }

    try {
      await authAPI.register(
        username.trim(),
        signupEmail.trim(),
        signupPassword,
      );
      showSuccess(t("successfullyCreatedAccount"));

      await loadUserPreferences();
      await refreshUnreadCount();

      setUsername("");
      setSignupEmail("");
      setSignupPassword("");

      const redirectTo = resolveRedirectTarget("/home");
      setTimeout(() => {
        navigate(redirectTo);
      }, 1000);
    } catch (error: any) {
      const errorData = error.response?.data;
      const serverMessage = errorData?.message || "";
      const errorField = errorData?.field;
      let errorMessage = t("couldntCreateAccount");

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
        setErrors({ signupEmail: errorMessage });
      } else if (errorField === "password") {
        setErrors({ signupPassword: t("invalidPassword") });
      } else {
        showError(serverMessage || errorMessage);
      }
    } finally {
      setSigningUp(false);
    }
  };

  const handleSuspensionOK = () => {
    setShowSuspensionModal(false);
    setSuspensionReason("");
    window.location.href = "/login";
  };

  const handleTabChange = (tab: "login" | "signup") => {
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
        {activeTab === "signup" && (
          <SignupForm
            username={username}
            email={signupEmail}
            password={signupPassword}
            showPassword={showSignupPassword}
            signingUp={signingUp}
            errors={{
              username: errors.username,
              signupEmail: errors.signupEmail,
              signupPassword: errors.signupPassword,
            }}
            onFieldChange={(field, value) => {
              if (field === "username") setUsername(value);
              if (field === "signupEmail") setSignupEmail(value);
              if (field === "signupPassword") setSignupPassword(value);
            }}
            onTogglePassword={() => setShowSignupPassword(!showSignupPassword)}
            onSubmit={handleSignUp}
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
