import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import Snackbar from '../components/Snackbar'
import { useThemeLanguage } from '../context/ThemeLanguageContext'
import { getTranslation } from '../utils/translations'
import './Login.css'
import './SetupPassword.css'
import logo from '../assets/mangotree-logo.png'

/**
 * @file SetupPassword.tsx
 * @description Page for setting a new password after account creation or invitation.
 * Users arrive via email link with a temporary token. They must set a permanent password.
 *
 * Features:
 * - Token validation from URL query param
 * - Password complexity requirements (8+ chars, uppercase, lowercase, number, special)
 * - Password confirmation field
 * - Show/hide password toggles
 * - Real-time validation with error messages
 * - Success redirects to login page
 *
 * Route: /setup-password?token=...
 * Access: Public (but requires valid token)
 * Redirects to /login if token missing/invalid
 *
 * @page
 * @requires useSearchParams - Access token from URL
 * @requires useNavigate - Redirect after success
 * @requires useThemeLanguage - Translations
 * @requires api - POST /auth/setup-password
 */

const SetupPassword = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    type: 'success' | 'error'
  }>({ open: false, message: '', type: 'success' })

  useEffect(() => {
    if (!token) {
      setSnackbar({
        open: true,
        message: t('invalidOrMissingToken'),
        type: 'error',
      })
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    }
  }, [token, navigate])

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
   * On success: shows success snackbar, redirects to login after 2s
   * On error: field errors go to form, other errors to snackbar
   *
   * @param {React.FormEvent} e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    if (!password || password.length < 8) {
      setErrors({ password: t('passwordComplexityRequirement') })
      setLoading(false)
      return
    }

    // Password complexity validation
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      setErrors({ password: t('passwordComplexityRequirement') })
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: t('passwordsDoNotMatch') })
      setLoading(false)
      return
    }

    try {
      await api.post('/auth/setup-password', { token, password })
      setSnackbar({
        open: true,
        message: t('passwordSetSuccess'),
        type: 'success',
      })
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (error: any) {
      const errorData = error.response?.data
      const errorMessage = errorData?.message || t('actionFailed')
      const errorField = errorData?.field

      if (errorField === 'password') {
        setErrors({ password: errorMessage })
      } else {
        setSnackbar({
          open: true,
          message: errorMessage,
          type: 'error',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <img src={logo} alt="MangoTree" className="logo-placeholder" />
          <h1 className="login-title">MangoTree</h1>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <h2 className="modal-title setup-password-title">Set Your Password</h2>
          
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
                  setPassword(e.target.value)
                  if (errors.password) {
                    setErrors({ ...errors, password: undefined })
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

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
                  setConfirmPassword(e.target.value)
                  if (errors.confirmPassword) {
                    setErrors({ ...errors, confirmPassword: undefined })
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="hidden-placeholder"
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
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </div>
  )
}

export default SetupPassword
