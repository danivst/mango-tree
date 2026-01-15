import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { authAPI } from '../../services/api'
import { adminAPI } from '../../services/adminAPI'
import { clearAuth, getUserRole } from '../../utils/auth'
import Snackbar from '../../components/Snackbar'
import './AdminPages.css'

type DeleteStep = 'warning' | 'reason' | 'confirm' | null

const Settings = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<{
    _id: string
    username: string
    email: string
    role: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteStep, setDeleteStep] = useState<DeleteStep>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'purple' | 'cream' | 'light'>('cream')
  const [language, setLanguage] = useState<'en' | 'bg'>('en')
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    type: 'success' | 'error'
  }>({ open: false, message: '', type: 'success' })

  useEffect(() => {
    fetchUserInfo()
    loadTheme()
    loadLanguage()
  }, [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    applyLanguage(language)
  }, [language])

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/users/me')
      setUser(response.data)
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to load user info',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTheme = () => {
    const savedTheme = localStorage.getItem('appTheme') as 'dark' | 'purple' | 'cream' | 'light'
    if (savedTheme && ['dark', 'purple', 'cream', 'light'].includes(savedTheme)) {
      setTheme(savedTheme)
    }
  }

  const loadLanguage = () => {
    const savedLanguage = localStorage.getItem('appLanguage') as 'en' | 'bg'
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'bg')) {
      setLanguage(savedLanguage)
    }
  }

  const applyLanguage = (lang: 'en' | 'bg') => {
    localStorage.setItem('appLanguage', lang)
    document.documentElement.setAttribute('lang', lang)
  }

  const applyTheme = (selectedTheme: 'dark' | 'purple' | 'cream' | 'light') => {
    const root = document.documentElement
    localStorage.setItem('appTheme', selectedTheme)

    switch (selectedTheme) {
      case 'dark':
        root.style.setProperty('--theme-bg', '#000000')
        root.style.setProperty('--theme-accent', '#1a1a1a')
        root.style.setProperty('--theme-text', '#FFFFFF')
        break
      case 'purple':
        root.style.setProperty('--theme-bg', '#250B24')
        root.style.setProperty('--theme-accent', '#361134')
        root.style.setProperty('--theme-text', '#F1F0CC')
        break
      case 'cream':
        root.style.setProperty('--theme-bg', '#F1F0CC')
        root.style.setProperty('--theme-accent', '#FCFBE4')
        root.style.setProperty('--theme-text', '#250B24')
        break
      case 'light':
        root.style.setProperty('--theme-bg', '#FFFFFF')
        root.style.setProperty('--theme-accent', '#F5F5F5')
        root.style.setProperty('--theme-text', '#000000')
        break
    }
  }

  const handleChangePassword = async () => {
    if (!user) return

    setSendingEmail(true)
    try {
      await authAPI.forgotPassword(user.email)
      setSnackbar({
        open: true,
        message: 'Password reset email sent!',
        type: 'success',
      })
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to send email',
        type: 'error',
      })
    } finally {
      setSendingEmail(false)
    }
  }

  const handleDeleteContinue = () => {
    setDeleteStep('reason')
  }

  const handleDeleteBack = () => {
    setDeleteStep('warning')
    setDeleteReason('')
  }

  const handleDeleteTerminate = () => {
    setDeleteStep('confirm')
  }

  const handleDeleteConfirm = async () => {
    if (!user) return

    try {
      await adminAPI.deleteUser(user._id, deleteReason)
      setSnackbar({
        open: true,
        message: 'Account deleted successfully!',
        type: 'success',
      })
      clearAuth()
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to delete account',
        type: 'error',
      })
    }
  }

  if (loading || !user) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Loading...</div>
      </div>
    )
  }

  const isAdmin = user.role === 'admin'

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Settings</h1>

      {/* Account Section */}
      <div className="settings-section">
        <h2 className="settings-section-title">Account</h2>
        
        <div className="settings-form">
          <div className="admin-form-group">
            <label className="admin-form-label">Username</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="admin-form-input"
                value={user.username}
                disabled
                style={{
                  background: '#e0e0e0',
                  cursor: 'not-allowed',
                  color: '#666'
                }}
                title={isAdmin ? "Unable to edit username because of role admin, speak to a supervisor if you want to proceed with changes" : "Username cannot be edited"}
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Email</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="admin-form-input"
                value={user.email}
                disabled
                style={{
                  background: '#e0e0e0',
                  cursor: 'not-allowed',
                  color: '#666'
                }}
                title={isAdmin ? "Unable to edit email because of role admin, speak to a supervisor if you want to proceed with changes" : "Email cannot be edited"}
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Password</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <input
                type="password"
                className="admin-form-input"
                value="••••••••"
                disabled
                style={{
                  background: '#e0e0e0',
                  cursor: 'not-allowed',
                  color: '#666',
                  flex: 1
                }}
              />
              <button
                className="admin-button-primary"
                onClick={handleChangePassword}
                disabled={sendingEmail}
                style={{ whiteSpace: 'nowrap' }}
              >
                {sendingEmail ? 'Sending...' : 'Change Password'}
              </button>
            </div>
          </div>

          <div className="admin-form-group" style={{ marginTop: '32px' }}>
            <button
              className="admin-button-danger"
              onClick={() => setDeleteStep('warning')}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* App Theme Section */}
      <div className="settings-section" style={{ marginTop: '48px' }}>
        <h2 className="settings-section-title">App Theme</h2>
        
        <div className="theme-selector">
          <div
            className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            <div className="theme-preview" style={{ background: '#000000', borderColor: theme === 'dark' ? '#1a1a1a' : '#ddd' }}>
              <div style={{ background: '#1a1a1a', width: '60%', height: '60%', borderRadius: '4px' }}></div>
            </div>
            <span>Dark</span>
            {theme === 'dark' && <span className="theme-check">✓</span>}
          </div>

          <div
            className={`theme-option ${theme === 'purple' ? 'active' : ''}`}
            onClick={() => setTheme('purple')}
          >
            <div className="theme-preview" style={{ background: '#250B24', borderColor: theme === 'purple' ? '#361134' : '#ddd' }}>
              <div style={{ background: '#361134', width: '60%', height: '60%', borderRadius: '4px' }}></div>
            </div>
            <span>Purple</span>
            {theme === 'purple' && <span className="theme-check">✓</span>}
          </div>

          <div
            className={`theme-option ${theme === 'cream' ? 'active' : ''}`}
            onClick={() => setTheme('cream')}
          >
            <div className="theme-preview" style={{ background: '#F1F0CC', borderColor: theme === 'cream' ? '#FCFBE4' : '#ddd' }}>
              <div style={{ background: '#FCFBE4', width: '60%', height: '60%', borderRadius: '4px' }}></div>
            </div>
            <span>Cream</span>
            {theme === 'cream' && <span className="theme-check">✓</span>}
          </div>

          <div
            className={`theme-option ${theme === 'light' ? 'active' : ''}`}
            onClick={() => setTheme('light')}
          >
            <div className="theme-preview" style={{ background: '#FFFFFF', borderColor: theme === 'light' ? '#F5F5F5' : '#ddd' }}>
              <div style={{ background: '#F5F5F5', width: '60%', height: '60%', borderRadius: '4px' }}></div>
            </div>
            <span>Light</span>
            {theme === 'light' && <span className="theme-check">✓</span>}
          </div>
        </div>
      </div>

      {/* Language Section */}
      <div className="settings-section" style={{ marginTop: '48px' }}>
        <h2 className="settings-section-title">Language</h2>
        
        <div className="theme-selector" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div
            className={`theme-option ${language === 'en' ? 'active' : ''}`}
            onClick={() => setLanguage('en')}
          >
            <div className="theme-preview" style={{ background: '#F1F0CC', borderColor: language === 'en' ? '#E77728' : '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '32px' }}>🇬🇧</span>
            </div>
            <span>English</span>
            {language === 'en' && <span className="theme-check">✓</span>}
          </div>

          <div
            className={`theme-option ${language === 'bg' ? 'active' : ''}`}
            onClick={() => setLanguage('bg')}
          >
            <div className="theme-preview" style={{ background: '#F1F0CC', borderColor: language === 'bg' ? '#E77728' : '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '32px' }}>🇧🇬</span>
            </div>
            <span>Bulgarian</span>
            {language === 'bg' && <span className="theme-check">✓</span>}
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {deleteStep && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            {deleteStep === 'warning' && (
              <>
                <h2 className="admin-modal-title">Delete Account</h2>
                <p className="admin-modal-text">
                  This action cannot be undone and you will lose access to the account. All your posts and comments will also be deleted.
                </p>
                <div className="admin-modal-actions">
                  <button
                    className="admin-button-secondary"
                    onClick={() => {
                      setDeleteStep(null)
                      setDeleteReason('')
                    }}
                  >
                    Close
                  </button>
                  <button
                    className="admin-button-primary"
                    onClick={handleDeleteContinue}
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {deleteStep === 'reason' && (
              <>
                <h2 className="admin-modal-title">Reason for Deletion</h2>
                <form onSubmit={(e) => { e.preventDefault(); handleDeleteTerminate() }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Reason for deletion</label>
                    <textarea
                      className="admin-form-textarea"
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      required
                      rows={4}
                      placeholder="Enter the reason for account termination..."
                    />
                  </div>
                  <div className="admin-modal-actions">
                    <button
                      type="button"
                      className="admin-button-secondary"
                      onClick={handleDeleteBack}
                    >
                      Go Back
                    </button>
                    <button
                      type="submit"
                      className="admin-button-primary"
                    >
                      Terminate Account
                    </button>
                  </div>
                </form>
              </>
            )}

            {deleteStep === 'confirm' && (
              <>
                <h2 className="admin-modal-title">Confirm Deletion</h2>
                <p className="admin-modal-text">
                  Do you wish to proceed and permanently delete your account?
                </p>
                <div className="admin-modal-actions">
                  <button
                    className="admin-button-secondary"
                    onClick={() => {
                      setDeleteStep(null)
                      setDeleteReason('')
                    }}
                  >
                    No
                  </button>
                  <button
                    className="admin-button-danger"
                    onClick={handleDeleteConfirm}
                  >
                    Yes
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </div>
  )
}

export default Settings
