/**
 * @file LoginForm.tsx
 * @description Login form component for username/password authentication.
 * Handles form validation, loading states, and submission.
 *
 * @component
 * @param {Object} props
 * @param {string} props.username - Current username value
 * @param {string} props.password - Current password value
 * @param {boolean} props.showPassword - Whether password is visible
 * @param {boolean} props.loading - Whether login is in progress
 * @param {{ username?: string; password?: string }} props.errors - Validation errors
 * @param {(field: 'username' | 'password', value: string) => void} props.onFieldChange - Input change handler
 * @param {() => void} props.onTogglePassword - Toggle password visibility
 * @param {(e: React.FormEvent) => void} props.onSubmit - Login submission handler
 * @param {() => void} props.onForgotPassword - Open forgot password modal
 * @param {(key: string) => string} props.t - Translation function
 * @returns {JSX.Element}
 */
import React from 'react';

interface LoginFormProps {
  username: string;
  password: string;
  showPassword: boolean;
  rememberMe: boolean;
  loading: boolean;
  errors: { username?: string; password?: string };
  onFieldChange: (field: 'username' | 'password', value: string) => void;
  onTogglePassword: () => void;
  onRememberMeChange: (checked: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onForgotPassword: () => void;
  t: (key: string) => string;
}

const LoginForm: React.FC<LoginFormProps> = ({
  username,
  password,
  showPassword,
  rememberMe,
  loading,
  errors,
  onFieldChange,
  onTogglePassword,
  onRememberMeChange,
  onSubmit,
  onForgotPassword,
  t
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
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
          onChange={(e) => onFieldChange('username', e.target.value)}
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
            onChange={(e) => onFieldChange('password', e.target.value)}
            placeholder={t("enterYourPassword")}
          />
          <button
            type="button"
            onClick={onTogglePassword}
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
          onChange={(e) => onRememberMeChange(e.target.checked)}
        />
      </div>

      <div className="login-form-actions">
        <button
          type="button"
          className="btn-text"
          onClick={onForgotPassword}
        >
          {t("forgotPassword")}
        </button>
        <button
          type="submit"
          className="btn-solid"
          disabled={loading}
        >
          {loading ? t("loggingIn") : t("login")}
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
