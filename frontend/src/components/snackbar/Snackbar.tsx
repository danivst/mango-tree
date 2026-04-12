/**
 * @file Snackbar.tsx
 * @description Toast notification component that displays temporary feedback messages at the bottom of the screen.
 * Shows success, error, or warning states with corresponding Material Design icons.
 * Automatically dismisses after a configurable duration and can also be manually dismissed.
 */

import { useEffect } from 'react';
import './Snackbar.css';

interface SnackbarProps {
  message: string;
  type: 'success' | 'error' | 'warning';
  open: boolean;
  onClose: () => void;
  duration?: number;
}

const Snackbar = ({ message, type, open, onClose, duration = 4000 }: SnackbarProps) => {
  /**
   * Effect hook that sets up an auto-dismiss timer when the snackbar becomes open.
   * Timer expires after `duration` milliseconds and calls onClose.
   * Cleanup function clears the timer if component unmounts or snackbar closes early.
   */
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration, onClose]);

  /**
   * If snackbar is not open, render nothing.
   * This keeps the component out of the DOM when hidden.
   */
  if (!open) return null;

  /**
   * Determines which icon to display based on notification type.
   * Returns inline SVG for success (check), error (X in circle), or warning (exclamation).
   */
  const getIcon = (): React.ReactElement | null => {
    switch (type) {
      case 'success':
        return (
          <svg className="snackbar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'error':
        return (
          <svg className="snackbar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case 'warning':
        return (
          <svg className="snackbar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 22h20L12 2zm0 3.99L19.53 20H4.47L12 5.99z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none"/>
            <path d="M12 10v4M12 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      default:
        return null;
    }
  };

  /**
   * Renders the snackbar container with appropriate CSS classes.
   * CSS classes control background color, text color, slide-in/out animations.
   */
  return (
    <div className={`snackbar snackbar-${type} ${open ? 'snackbar-open' : ''}`}>
      {getIcon()}
      <span className="snackbar-message">{message}</span>
    </div>
  );
};

export default Snackbar;