/**
 * @file SignupForm.tsx
 * @description Registration (signup) form component.
 * Collects username, email, and password for new user accounts.
 * Provides real-time validation feedback and secure password visibility toggling.
 */

import React from 'react';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

/**
 * @interface SignupFormProps
 * @description Props for the SignupForm component.
 * 
 * @property {string} username - Current username input value
 * @property {string} email - Current email input value
 * @property {string} password - Current password input value
 * @property {boolean} showPassword - Flag to toggle password text visibility
 * @property {boolean} signingIn - State to disable buttons during registration API calls
 * @property {{ username?: string; signinEmail?: string; signinPassword?: string }} errors - Validation error messages
 * @property {(field: 'username' | 'signinEmail' | 'signinPassword', value: string) => void} onFieldChange - Input change handler
 * @property {() => void} onTogglePassword - Toggle password visibility visibility
 * @property {(e: React.FormEvent) => void} onSubmit - Registration submission handler
 * @property {(key: string) => string} t - Translation function for localization
 */
interface SignupFormProps {
  username: string;
  email: string;
  password: string;
  showPassword: boolean;
  signingIn: boolean;
  errors: { username?: string; signinEmail?: string; signinPassword?: string };
  onFieldChange: (field: 'username' | 'signinEmail' | 'signinPassword', value: string) => void;
  onTogglePassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
  t: (key: string) => string;
}

/**
 * @component SignupForm
 * @description Presentational component for the user registration form.
 * Encapsulates the fields for username, email, and password with integrated localized error handling.
 */
const SignupForm: React.FC<SignupFormProps> = ({
  username,
  email,
  password,
  showPassword,
  signingIn,
  errors,
  onFieldChange,
  onTogglePassword,
  onSubmit,
  t
}) => {
  /**
   * Internal wrapper for form submission.
   * Prevents default browser reload before calling the provided parent onSubmit handler.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      {/* Username Field Group */}
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

      {/* Email Field Group */}
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
          value={email}
          onChange={(e) => onFieldChange('signinEmail', e.target.value)}
          placeholder={t("enterYourEmail")}
        />
        {errors.signinEmail && (
          <span className="login-error-message">{errors.signinEmail}</span>
        )}
      </div>

      {/* Password Field Group */}
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
            type={showPassword ? "text" : "password"}
            className={`login-form-input password-input ${errors.signinPassword ? "login-input-error" : ""}`}
            value={password}
            onChange={(e) => onFieldChange('signinPassword', e.target.value)}
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
        {errors.signinPassword && (
          <span className="login-error-message">{errors.signinPassword}</span>
        )}
      </div>

      {/* Form Action Buttons */}
      <div className="login-form-actions">
        <button
          type="submit"
          className="btn-solid"
          disabled={signingIn}
        >
          {signingIn ? t("creatingAccount") : t("signin")}
        </button>
      </div>
    </form>
  );
};

export default SignupForm;