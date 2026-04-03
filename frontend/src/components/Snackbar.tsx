import { useEffect } from 'react'
import './Snackbar.css'

/**
 * @interface SnackbarProps
 * @description Props for the Snackbar notification component.
 * Snackbars display brief, transient feedback messages to the user.
 *
 * @property {string} message - The message text to display
 * @property {'success' | 'error' | 'warning'} type - Type of notification, affects color and icon
 * @property {boolean} open - Controls visibility of the snackbar
 * @property {() => void} onClose - Callback function when snackbar is dismissed (by user or auto-dismiss)
 * @property {number} [duration] - Auto-dismiss timeout in milliseconds (default: 4000ms, or 4 seconds)
 */

interface SnackbarProps {
  message: string
  type: 'success' | 'error' | 'warning'
  open: boolean
  onClose: () => void
  duration?: number
}

/**
 * @file Snackbar.tsx
 * @description Toast notification component that displays temporary feedback messages at the bottom of the screen.
 * Shows success, error, or warning states with corresponding Material Design icons.
 * Automatically dismisses after a configurable duration and can also be manually dismissed.
 *
 * Behavior:
 * - When open prop becomes true, starts an auto-dismiss timer
 * - Timer clears if snackbar closes before duration expires
 * - Calls onClose callback when dismissed (either automatically or manually)
 *
 * Visual States:
 * - success: Green background with checkmark icon
 * - error: Red background with X/circle icon
 * - warning: Amber/orange background with exclamation icon
 *
 * @component
 * @requires useEffect - React hook for managing auto-dismiss timer lifecycle
 */

const Snackbar = ({ message, type, open, onClose, duration = 4000 }: SnackbarProps) => {
  /**
   * Effect hook that sets up an auto-dismiss timer when the snackbar becomes open.
   * Timer expires after `duration` milliseconds and calls onClose.
   * Cleanup function clears the timer if component unmounts or snackbar closes early.
   */
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [open, duration, onClose])

  /**
   * If snackbar is not open, render nothing.
   * This keeps the component out of the DOM when hidden.
   */
  if (!open) return null

  /**
   * Determines which icon to display based on notification type.
   * Returns inline SVG for success (check), error (X in circle), or warning (exclamation).
   *
   * @returns {React.ReactElement | null} SVG icon element or null if type is invalid
   */
  const getIcon = (): React.ReactElement | null => {
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

  /**
   * Renders the snackbar container with appropriate CSS classes.
   * CSS classes control background color, text color, slide-in/out animations.
   *
   * @returns {React.ReactElement} Snackbar container element
   */
  return (
    <div className={`snackbar snackbar-${type} ${open ? 'snackbar-open' : ''}`}>
      {getIcon()}
      <span className="snackbar-message">{message}</span>
    </div>
  )
}

export default Snackbar
