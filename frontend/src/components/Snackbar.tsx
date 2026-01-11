import { useEffect } from 'react'
import './Snackbar.css'

interface SnackbarProps {
  message: string
  type: 'success' | 'error' | 'warning'
  open: boolean
  onClose: () => void
  duration?: number
}

const Snackbar = ({ message, type, open, onClose, duration = 4000 }: SnackbarProps) => {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [open, duration, onClose])

  if (!open) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="snackbar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      case 'error':
        return (
          <svg className="snackbar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )
      case 'warning':
        return (
          <svg className="snackbar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 22h20L12 2zm0 3.99L19.53 20H4.47L12 5.99z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none"/>
            <path d="M12 10v4M12 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className={`snackbar snackbar-${type} ${open ? 'snackbar-open' : ''}`}>
      {getIcon()}
      <span className="snackbar-message">{message}</span>
    </div>
  )
}

export default Snackbar
