/**
 * @file SetupPassword.tsx
 * @description Page for setting a new password after account creation or invitation.
 * Users arrive via email link with a temporary token. They must set a permanent password.
 *
 * Features:
 * - Token validation from URL query param
 * - Password complexity requirements (8+ chars, uppercase, lowercase, number, special)
 * - Password confirmation field
 * - Show/hide password toggles using MUI Icons
 * - Real-time validation with error messages
 * - Success redirects to login page
 *
 * Route: /setup-password?token=...
 * Access: Public (but requires valid token)
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../../services/api';
import { useSnackbar } from '../../../../utils/snackbar';
import Snackbar from '../../../../components/snackbar/Snackbar';
import { useThemeLanguage } from '../../../../context/ThemeLanguageContext';
import { getTranslation } from '../../../../utils/translations';
import { validatePassword, validatePasswordMatch } from '../../../../utils/validators';
import '../../Login.css';
import './SetupPassword.css';
import logo from  '../../../../assets/mangotree-logo.png';

// MUI Icon Imports
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

/**
 * @component SetupPassword
 * @description Renders the password setup interface. 
 * Validates the security token on mount and enforces strong password policies.
 * * @requires useSearchParams - Access token from URL
 * @requires useNavigate - Redirect after success
 * @requires useThemeLanguage - Translations
 * @requires api - POST /auth/setup-password
 * @returns {JSX.Element} The rendered password setup page
 */
const SetupPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  /**
   * Effect: Validate token presence on mount.
   * If token is missing, alerts the user and redirects to login.
   */
  useEffect(() => {
    if (!token) {
      showError(t('invalidOrMissingToken'));
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  }, [token, navigate, showError, t]);

  /**
   * Handles password setup form submission.
   * Validates password complexity and confirmation match.
   * Calls /auth/setup-password endpoint with token and new password.
   *
   * Validations:
   * - Minimum 8 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   * - At least one special character (!@#$%^&*(),.?":{}|<>)
   * - Password and confirmPassword must match
   *
   * @param {React.FormEvent} e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Use Centralized Password Validator
    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrors({ password: t(passwordError) });
      setLoading(false);
      return;
    }

    // Use Centralized Match Validator
    const matchError = validatePasswordMatch(password, confirmPassword);
    if (matchError) {
      setErrors({ confirmPassword: t(matchError) });
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/setup-password', { token, password });
      showSuccess(t('passwordSetSuccess'));
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || t('actionFailed');
      const errorField = errorData?.field;

      if (errorField === 'password') {
        setErrors({ password: errorMessage });
      } else {
        showError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <img src={logo} alt="MangoTree" className="logo-placeholder" />
          <h1 className="login-title">MangoTree</h1>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <h2 className="modal-title setup-password-title">Set Your Password</h2>
          
          {/* New Password Field */}
          <div className="form-group">
            <label htmlFor="password" className={`form-label ${errors.password ? 'label-error' : ''}`}>
              Password
            </label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${errors.password ? 'input-error' : ''} password-input`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    setErrors({ ...errors, password: undefined });
                  }
                }}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <VisibilityOff sx={{ fontSize: 20 }} />
                ) : (
                  <Visibility sx={{ fontSize: 20 }} />
                )}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirmPassword" className={`form-label ${errors.confirmPassword ? 'label-error' : ''}`}>
              Confirm Password
            </label>
            <div className="password-input-wrapper">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className={`form-input ${errors.confirmPassword ? 'input-error' : ''} password-input`}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) {
                    setErrors({ ...errors, confirmPassword: undefined });
                  }
                }}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="password-toggle-button"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <VisibilityOff sx={{ fontSize: 20 }} />
                ) : (
                  <Visibility sx={{ fontSize: 20 }} />
                )}
              </button>
            </div>
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="hidden-placeholder"
              aria-hidden="true"
            >
              Placeholder
            </button>
            <button
              type="submit"
              className="btn-solid"
              disabled={loading}
            >
              {loading ? 'Setting password...' : 'Set Password'}
            </button>
          </div>
        </form>
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

export default SetupPassword;