/**
 * @file index.tsx
 * @description Login page container component.
 * Orchestrates authentication flows for login, registration, 2FA, and password reset.
 * Manages all state and business logic, delegating UI to child components.
 *
 * @page
 * @requires useState, useEffect - React state management
 * @requires useNavigate, useLocation - React Router navigation
 * @requires useThemeLanguage - Theme and language context
 * @requires useNotifications - Notification context
 * @requires authAPI, usersAPI - API services
 * @requires all extracted child components
 */

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authAPI, usersAPI, UserProfile } from "../../services/api";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation } from "../../utils/translations";
import { useNotifications } from "../../context/NotificationContext";
import { Theme, Language } from "../../utils/types";
import { useSnackbar } from "../../utils/snackbar";
import { setAuthTokens } from "../../utils/auth";
import LanguageSwitcher from "./LanguageSwitcher";
import LoginHeader from "./LoginHeader";
import LoginTabs from "./LoginTabs";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import TwoFactorModal from "./TwoFactorModal";
import ForgotPasswordModal from "./ForgotPasswordModal";
import SuspensionModal from "./SuspensionModal";
import Footer from "../../components/Footer";
import Snackbar from "../../components/Snackbar";
import "../Login.css";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, setLanguageImmediate, setThemeImmediate } = useThemeLanguage();
  const { refreshUnreadCount } = useNotifications();
  const t = (key: string) => getTranslation(language, key);
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

  const [activeTab, setActiveTab] = useState<"login" | "signin">(() => {
    if (location.pathname === "/signin") return "signin";
    return "login";
  });

  // 2FA state
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFAUserId, setTwoFAUserId] = useState<string | null>(null);
  const [twoFACode, setTwoFACode] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);

  // Suspension state
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");

  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // Signup form state
  const [username, setUsername] = useState("");
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const [showSigninPassword, setShowSigninPassword] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Errors
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    signinEmail?: string;
    signinPassword?: string;
    forgotEmail?: string;
    twofaCode?: string;
  }>({});

  // Session flag check on mount
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
  }, [language, showSuccess, showError]);

  // Tab/path sync
  useEffect(() => {
    const path = activeTab === "login" ? "/login" : "/signin";
    if (location.pathname !== path) {
      navigate(path, { replace: true });
    }
  }, [activeTab, navigate, location.pathname]);

  useEffect(() => {
    if (location.pathname === "/signin" && activeTab !== "signin") {
      setActiveTab("signin");
    } else if (location.pathname === "/login" && activeTab !== "login") {
      setActiveTab("login");
    }
  }, [location.pathname]);

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
      console.log("No user preferences loaded (not logged in)");
    }
  };

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
        showSuccess(t("twoFACodeSent"));
        setLoading(false);
        return;
      }

      showSuccess(t("successfullyLoggedIn"));

      if (response.token && response.refreshToken) {
        setAuthTokens(response.token, response.refreshToken, rememberMe);
      }

      await loadUserPreferences();
      await refreshUnreadCount();

      const redirectTo = response.redirectTo || "/home";
      setTimeout(() => {
        navigate(redirectTo);
      }, 1000);
    } catch (error: any) {
      const errorData = error.response?.data;
      const serverMessage = errorData?.message || "";
      const errorField = errorData?.field;
      let errorMessage = t("serverError");

      if (error.response?.status === 403 && serverMessage.toLowerCase().includes("banned") && errorData?.reason) {
        const reason = errorData.reason;
        const template = t("accountBannedMessage");
        errorMessage = template.replace(/{reason}/g, reason);
        showError(errorMessage);
        setLoading(false);
        return;
      }

      if (errorField === "username") {
        if (serverMessage.toLowerCase().includes("not found") || serverMessage.toLowerCase().includes("does not exist") || serverMessage.toLowerCase().includes("no account")) {
          errorMessage = t("userNotFound");
        } else {
          errorMessage = serverMessage || errorMessage;
        }
        setErrors({ username: errorMessage });
      } else if (errorField === "password") {
        if (serverMessage.toLowerCase().includes("incorrect")) {
          errorMessage = t("incorrectPassword");
        } else if (serverMessage.toLowerCase().includes("must contain") || serverMessage.toLowerCase().includes("requirements")) {
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

    const trimmedEmail = forgotEmail.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setErrors({ ...errors, forgotEmail: t("emailMustContain") });
      setSendingEmail(false);
      return;
    }

    try {
      await authAPI.forgotPassword(trimmedEmail);
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

    if (!twoFACode || twoFACode.length !== 6 || !/^\d+$/.test(twoFACode)) {
      showError(t("invalid2FACode"));
      return;
    }

    setVerifying2FA(true);
    try {
      const response = await authAPI.verify2FA(twoFAUserId, twoFACode);
      showSuccess(t("twoFACodeVerified"));

      if (response.token && response.refreshToken) {
        setAuthTokens(response.token, response.refreshToken);
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
      showError(t("serverError"));
      setTwoFACode("");
    } finally {
      setVerifying2FA(false);
    }
  };

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
      showSuccess(t("successfullyCreatedAccount"));

      if (response.token && response.refreshToken) {
        setAuthTokens(response.token, response.refreshToken);
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
      const serverMessage = errorData?.message || "";
      const errorField = errorData?.field;
      let errorMessage = t("couldntCreateAccount");

      if (errorField === "username") {
        if (serverMessage.toLowerCase().includes("exists") || serverMessage.toLowerCase().includes("already in use") || serverMessage.toLowerCase().includes("already registered")) {
          errorMessage = t("usernameExists");
        } else {
          errorMessage = serverMessage || errorMessage;
        }
        setErrors({ username: errorMessage });
      } else if (errorField === "email") {
        if (serverMessage.toLowerCase().includes("exists") || serverMessage.toLowerCase().includes("already in use") || serverMessage.toLowerCase().includes("already registered")) {
          errorMessage = t("emailExists");
        } else {
          errorMessage = serverMessage || errorMessage;
        }
        setErrors({ signinEmail: errorMessage });
      } else if (errorField === "password") {
        if (serverMessage.toLowerCase().includes("incorrect")) {
          errorMessage = t("incorrectPassword");
        } else if (serverMessage.toLowerCase().includes("must contain") || serverMessage.toLowerCase().includes("requirements")) {
          errorMessage = t("invalidPassword");
        } else {
          errorMessage = serverMessage || errorMessage;
        }
        setErrors({ signinPassword: errorMessage });
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
      <LanguageSwitcher
        language={language}
        onLanguageChange={setLanguage}
      />

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
              if (field === 'username') setLoginUsername(value);
              if (field === 'password') setPassword(value);
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
              signinPassword: errors.signinPassword
            }}
            onFieldChange={(field, value) => {
              if (field === 'username') setUsername(value);
              if (field === 'signinEmail') setSigninEmail(value);
              if (field === 'signinPassword') setSigninPassword(value);
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
