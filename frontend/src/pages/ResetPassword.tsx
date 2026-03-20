import { useState, useEffect } from "react";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { getTranslation } from "../utils/translations";
import { useNavigate, useSearchParams } from "react-router-dom";
import Snackbar from "../components/Snackbar";
import "./Login.css";
import logo from "../assets/mangotree-logo.png";

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
    console.log("🔄 ResetPassword component mounted");
    console.log(
      "🔑 Token from URL:",
      token ? `${token.substring(0, 10)}...` : "No token",
    );

    // Require reset token for all access
    if (!token) {
      console.log("❌ No token found in URL, redirecting to login");
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
      console.log("📧 Fetching email for reset token...");
      try {
        const response = await fetch(`/api/auth/reset-token/${token}`);
        console.log("📬 Response status:", response.status);
        const data = await response.json();
        console.log("📬 Response data:", data);

        if (!response.ok) {
          throw new Error(data.message || "Invalid token");
        }

        if (!data.email) {
          throw new Error("Email not found for this token");
        }

        console.log("✅ Email fetched successfully:", data.email);
        setEmail(data.email);
        setFetchingEmail(false);
      } catch (error: any) {
        console.error("❌ Error fetching email:", error);
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

    // Password complexity validation
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
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              minHeight: "200px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div>
              <p style={{ fontSize: "16px", color: "#333" }}>Loading...</p>
              <p style={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>
                Verifying reset token...
              </p>
            </div>
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
                className="form-input"
                value={email}
                readOnly
                disabled
                title="Email for resetting password cannot be edited"
                style={{
                  cursor: "not-allowed",
                  backgroundColor: "rgba(0, 0, 0, 0.05)",
                  opacity: 0.7,
                }}
              />
            </div>

            <div className="form-group">
              <label
                htmlFor="password"
                className={`form-label ${errors.password ? "label-error" : ""}`}
              >
                {t("password")}
              </label>
              <div style={{ position: "relative" }}>
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
                  style={{ paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#333",
                    opacity: 0.6,
                    transition: "opacity 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
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
                {t("confirmPassword") || "Confirm Password"}
              </label>
              <div style={{ position: "relative" }}>
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
                  placeholder={t("confirmPassword") || "Confirm new password"}
                  style={{ paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#333",
                    opacity: 0.6,
                    transition: "opacity 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
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
              <button type="button" style={{ visibility: "hidden" }}>
                Placeholder
              </button>
              <button type="submit" className="btn-solid" disabled={loading}>
                {loading
                  ? t("sending")
                  : t("resetPassword") || "Reset Password"}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <p style={{ color: "#A50104" }}>{t("unableToLoadResetForm")}</p>
          </div>
        )}
      </div>

      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={closeSnackbar}
      />
    </div>
  );
};

export default ResetPassword;
