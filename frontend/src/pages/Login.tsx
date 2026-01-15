import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authAPI } from '../services/api'
import Snackbar from '../components/Snackbar'
import './Login.css'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<'login' | 'signin'>(() => {
    // Initialize tab based on path
    if (location.pathname === '/signin') return 'signin'
    return 'login'
  })
  
  // Check for session expiry message and account suspension
  useEffect(() => {
    const sessionExpired = sessionStorage.getItem('sessionExpired')
    if (sessionExpired === 'true') {
      setSnackbar({
        open: true,
        message: 'Session expired',
        type: 'error',
      })
      sessionStorage.removeItem('sessionExpired')
    }

    const accountSuspended = sessionStorage.getItem('accountSuspended')
    const suspensionReason = sessionStorage.getItem('suspensionReason')
    if (accountSuspended === 'true' && suspensionReason) {
      // Show suspension modal
      setShowSuspensionModal(true)
      setSuspensionReason(suspensionReason)
      sessionStorage.removeItem('accountSuspended')
      sessionStorage.removeItem('suspensionReason')
    }
  }, [])
  
  const [showSuspensionModal, setShowSuspensionModal] = useState(false)
  const [suspensionReason, setSuspensionReason] = useState('')
  
  const handleSuspensionOK = () => {
    setShowSuspensionModal(false)
    setSuspensionReason('')
    // Auth will be cleared by the interceptor
    window.location.href = '/login'
  }
  const [loginUsername, setLoginUsername] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [signinEmail, setSigninEmail] = useState('')
  const [signinPassword, setSigninPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showSigninPassword, setShowSigninPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    type: 'success' | 'error'
  }>({ open: false, message: '', type: 'success' })
  const [errors, setErrors] = useState<{
    username?: string
    password?: string
    signinUsername?: string
    signinEmail?: string
    signinPassword?: string
    forgotEmail?: string
  }>({})

  // Sync path with active tab
  useEffect(() => {
    const path = activeTab === 'login' ? '/login' : '/signin'
    if (location.pathname !== path) {
      navigate(path, { replace: true })
    }
  }, [activeTab, navigate, location.pathname])

  // Sync active tab with path
  useEffect(() => {
    if (location.pathname === '/signin' && activeTab !== 'signin') {
      setActiveTab('signin')
    } else if (location.pathname === '/login' && activeTab !== 'login') {
      setActiveTab('login')
    }
  }, [location.pathname])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    // Frontend validation
    const trimmedUsername = loginUsername.trim()
    if (!trimmedUsername || trimmedUsername.length < 3) {
      setErrors({ username: 'Username must be at least 3 characters long.' })
      setLoading(false)
      return
    }

    if (!password) {
      setErrors({ password: 'Password must be at least 8 characters long.' })
      setLoading(false)
      return
    }

    try {
      const response = await authAPI.login(trimmedUsername, password)
      setSnackbar({
        open: true,
        message: response.message || 'Successfully logged in!',
        type: 'success',
      })
      // Store tokens if needed
      if (response.token) {
        localStorage.setItem('token', response.token)
        localStorage.setItem('refreshToken', response.refreshToken)
      }
      // Redirect based on role
      const redirectTo = response.redirectTo || '/home'
      setTimeout(() => {
        navigate(redirectTo)
      }, 1000)
    } catch (error: any) {
      const errorData = error.response?.data
      const errorMessage = errorData?.message || 'Server error!'
      const errorField = errorData?.field

      // Map error to specific field
      if (errorField === 'username') {
        setErrors({ username: errorMessage })
      } else if (errorField === 'password') {
        setErrors({ password: errorMessage })
      } else {
        // Fallback to snackbar for general errors
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation() // Prevent triggering login form
    setSendingEmail(true)
    setErrors({ ...errors, forgotEmail: undefined })

    // Frontend validation
    const trimmedEmail = forgotEmail.trim()
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrors({ ...errors, forgotEmail: 'Email must contain @ symbol.' })
      setSendingEmail(false)
      return
    }

    try {
      const response = await authAPI.forgotPassword(trimmedEmail)
      setSnackbar({
        open: true,
        message: 'Email sent!',
        type: 'success',
      })
      setShowForgotModal(false)
      setForgotEmail('')
      setErrors({ ...errors, forgotEmail: undefined })
    } catch (error: any) {
      const errorData = error.response?.data
      const errorMessage = errorData?.message || 'Server error!'
      
      if (errorMessage.includes('email')) {
        setErrors({ ...errors, forgotEmail: errorMessage })
      } else {
        setSnackbar({
          open: true,
          message: errorMessage,
          type: 'error',
        })
      }
    } finally {
      setSendingEmail(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSigningIn(true)
    setErrors({})

    // Frontend validation
    const trimmedUsername = username.trim()
    if (!trimmedUsername || trimmedUsername.length < 3) {
      setErrors({ username: 'Username must be at least 3 characters long.' })
      setSigningIn(false)
      return
    }

    const trimmedEmail = signinEmail.trim()
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrors({ signinEmail: 'Email must contain @ symbol.' })
      setSigningIn(false)
      return
    }

    if (!signinPassword) {
      setErrors({ signinPassword: 'Password must be at least 8 characters long, and must contain at least one of each: capital letter, lower case letter, number and special character.' })
      setSigningIn(false)
      return
    }

    try {
      const response = await authAPI.register(trimmedUsername, trimmedEmail, signinPassword)
      
      setSnackbar({
        open: true,
        message: 'Successfully created account!',
        type: 'success',
      })
      
      // Store tokens and auto-login
      if (response.token) {
        localStorage.setItem('token', response.token)
        localStorage.setItem('refreshToken', response.refreshToken)
      }
      
      // Clear form
      setUsername('')
      setSigninEmail('')
      setSigninPassword('')
      
      // Redirect to home after a short delay to show success message
      setTimeout(() => {
        navigate('/home')
      }, 1000)
    } catch (error: any) {
      const errorData = error.response?.data
      const errorMessage = errorData?.message || 'Couldn\'t create account!'
      const errorField = errorData?.field

      // Map error to specific field
      if (errorField === 'username') {
        setErrors({ username: errorMessage })
      } else if (errorField === 'email') {
        setErrors({ signinEmail: errorMessage })
      } else if (errorField === 'password') {
        setErrors({ signinPassword: errorMessage })
      } else {
        // Fallback to snackbar for general errors
        setSnackbar({
          open: true,
          message: errorMessage,
          type: 'error',
        })
      }
    } finally {
      setSigningIn(false)
    }
  }

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="logo-placeholder"></div>
          <h1 className="login-title">MangoTree</h1>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <button
            type="button"
            className={`tab-button ${activeTab === 'login' ? 'tab-active' : ''}`}
            onClick={() => {
              setActiveTab('login')
              setErrors({})
              navigate('/login', { replace: true })
            }}
          >
            Log in
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === 'signin' ? 'tab-active' : ''}`}
            onClick={() => {
              setActiveTab('signin')
              setErrors({})
              navigate('/signin', { replace: true })
            }}
          >
            Sign in
          </button>
        </div>

        {/* Login Form */}
        {activeTab === 'login' && (
        <form 
          onSubmit={(e) => {
            console.log('Form onSubmit event fired!')
            handleLogin(e)
          }} 
          className="login-form"
        >
          <div className="form-group">
            <label htmlFor="username" className={`form-label ${errors.username ? 'label-error' : ''}`}>
              Username
            </label>
            <input
              id="username"
              type="text"
              className={`form-input ${errors.username ? 'input-error' : ''}`}
              value={loginUsername}
              onChange={(e) => {
                setLoginUsername(e.target.value)
                if (errors.username) {
                  setErrors({ ...errors, username: undefined })
                }
              }}
              placeholder="Enter your username"
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className={`form-label ${errors.password ? 'label-error' : ''}`}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${errors.password ? 'input-error' : ''}`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) {
                    setErrors({ ...errors, password: undefined })
                  }
                }}
                placeholder="Enter your password"
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#333',
                  opacity: 0.6,
                  transition: 'opacity 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
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

          <div className="form-actions">
            <button
              type="button"
              className="btn-text"
              onClick={() => setShowForgotModal(true)}
            >
              Forgotten password
            </button>
            <button
              type="button"
              className="btn-solid"
              disabled={loading}
              onClick={(e) => {
                console.log('Button clicked directly!')
                e.preventDefault()
                handleLogin(e as any)
              }}
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </div>
        </form>
        )}

        {/* Sign In Form */}
        {activeTab === 'signin' && (
        <form 
          onSubmit={handleSignIn} 
          className="login-form"
        >
          <div className="form-group">
            <label htmlFor="username" className={`form-label ${errors.username ? 'label-error' : ''}`}>
              Username
            </label>
            <input
              id="username"
              type="text"
              className={`form-input ${errors.username ? 'input-error' : ''}`}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                if (errors.username) {
                  setErrors({ ...errors, username: undefined })
                }
              }}
              placeholder="Enter your username"
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="signin-email" className={`form-label ${errors.signinEmail ? 'label-error' : ''}`}>
              Email
            </label>
            <input
              id="signin-email"
              type="email"
              className={`form-input ${errors.signinEmail ? 'input-error' : ''}`}
              value={signinEmail}
              onChange={(e) => {
                setSigninEmail(e.target.value)
                if (errors.signinEmail) {
                  setErrors({ ...errors, signinEmail: undefined })
                }
              }}
              placeholder="Enter your email"
            />
            {errors.signinEmail && <span className="error-message">{errors.signinEmail}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="signin-password" className={`form-label ${errors.signinPassword ? 'label-error' : ''}`}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="signin-password"
                type={showSigninPassword ? 'text' : 'password'}
                className={`form-input ${errors.signinPassword ? 'input-error' : ''}`}
                value={signinPassword}
                onChange={(e) => {
                  setSigninPassword(e.target.value)
                  if (errors.signinPassword) {
                    setErrors({ ...errors, signinPassword: undefined })
                  }
                }}
                placeholder="Enter your password"
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowSigninPassword(!showSigninPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#333',
                  opacity: 0.6,
                  transition: 'opacity 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                aria-label={showSigninPassword ? 'Hide password' : 'Show password'}
              >
                {showSigninPassword ? (
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
            {errors.signinPassword && <span className="error-message">{errors.signinPassword}</span>}
          </div>

          <div className="form-actions">
            <button
              type="button"
              style={{ visibility: 'hidden' }}
            >
              Placeholder
            </button>
            <button
              type="button"
              className="btn-solid"
              disabled={signingIn}
              onClick={(e) => {
                e.preventDefault()
                handleSignIn(e)
              }}
            >
              {signingIn ? 'Creating account...' : 'Sign in'}
            </button>
          </div>
        </form>
        )}
      </div>

      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Forgotten password</h2>
            <p className="modal-subtitle">Enter a valid email to receive instructions</p>
            <form onSubmit={handleForgotPassword} className="modal-form">
              <div className="form-group">
                <label htmlFor="forgot-email" className={`form-label ${errors.forgotEmail ? 'label-error' : ''}`}>
                  Email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  className={`form-input ${errors.forgotEmail ? 'input-error' : ''}`}
                  value={forgotEmail}
                  onChange={(e) => {
                    setForgotEmail(e.target.value)
                    if (errors.forgotEmail) {
                      setErrors({ ...errors, forgotEmail: undefined })
                    }
                  }}
                  placeholder="Enter your email"
                />
                {errors.forgotEmail && <span className="error-message">{errors.forgotEmail}</span>}
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-text"
                  onClick={() => setShowForgotModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-solid"
                  disabled={sendingEmail}
                >
                  {sendingEmail ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Suspension Modal */}
      {showSuspensionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">Account Suspended</h2>
            <p className="modal-subtitle" style={{ marginBottom: '24px', textAlign: 'left' }}>
              Your account has been permanently suspended due to this reason: <strong>{suspensionReason}</strong>
            </p>
            <p className="modal-subtitle" style={{ marginBottom: '24px', textAlign: 'left' }}>
              If you think this was a mistake, <strong>immediately reach out to mangotree@support.com</strong>, with subject: <strong>your username termination</strong> and include a screenshot of this message.
            </p>
            <div className="form-actions" style={{ justifyContent: 'center' }}>
              <button
                className="btn-solid"
                onClick={handleSuspensionOK}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={closeSnackbar}
      />
    </div>
  )
}

export default Login
