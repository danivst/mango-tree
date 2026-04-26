/**
 * @file LoginForm.tsx
 * @description Login form component for username/password authentication.
 * Handles form validation display, loading states and user interaction for login credentials.
 */

import React from 'react';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

/**
 * @interface LoginFormProps
 * @description Props for the LoginForm component.
 * 
 * @property {string} username - Current username input value
 * @property {string} password - Current password input value
 * @property {boolean} showPassword - Flag to toggle password text visibility
 * @property {boolean} rememberMe - Flag for persistent session storage
 * @property {boolean} loading - State to disable buttons during API calls
 * @property {{ username?: string; password?: string }} errors - Validation error messages from the parent hook
 * @property {(field: 'username' | 'password', value: string) => void} onFieldChange - Updates parent state on input
 * @property {() => void} onTogglePassword - Flips the showPassword boolean
 * @property {(checked: boolean) => void} onRememberMeChange - Updates the rememberMe boolean
 * @property {(e: React.FormEvent) => void} onSubmit - Triggers the login authentication logic
 * @property {() => void} onForgotPassword - Triggers the password recovery workflow/modal
 * @property {(key: string) => string} t - Translation function for localization
 */
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

/**
 * @component LoginForm
 * @description Presentational component for the login credentials form.
 * It strictly renders the UI based on props and propagates events back to the parent container.
 */
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
  /**
   * Internal wrapper for form submission.
   * Prevents default browser reload before calling the provided onSubmit handler.
   */
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
              <VisibilityOff sx={{ fontSize: 20 }} />
            ) : (
              <Visibility sx={{ fontSize: 20 }} />
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