/**
 * @file ForgotPasswordModal.tsx
 * @description Forgot password modal component.
 * Allows users to request a password reset email by entering their registered email address.
 * Features an overlay that supports clicking outside to dismiss and localized error handling.
 */

import React from 'react';

/**
 * @interface ForgotPasswordModalProps
 * @description Props for the ForgotPasswordModal component.
 * * @property {boolean} open - Whether the modal is currently visible
 * @property {string} email - Current email input value managed by parent state
 * @property {boolean} sending - Loading state flag to disable buttons during API request
 * @property {string} [error] - Optional validation or server error message to display
 * @property {(email: string) => void} onEmailChange - Callback to update the email value in parent state
 * @property {(e: React.FormEvent) => void} onSubmit - Form submission handler to trigger reset email process
 * @property {() => void} onCancel - Callback to close the modal and reset local state
 * @property {(key: string) => string} t - Translation function for localized strings
 */
interface ForgotPasswordModalProps {
  open: boolean;
  email: string;
  sending: boolean;
  error?: string;
  onEmailChange: (email: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  t: (key: string) => string;
}

/**
 * @component ForgotPasswordModal
 * @description Renders a modal dialog for initiating the password recovery process.
 * Provides a clean interface for users to enter their email and receive a reset link.
 */
const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  open,
  email,
  sending,
  error,
  onEmailChange,
  onSubmit,
  onCancel,
  t
}) => {
  /**
   * Guard clause: Do not render anything if the modal is not open.
   */
  if (!open) return null;

  /**
   * Handles clicks on the modal overlay.
   * If the click occurs directly on the overlay (not the content box), it triggers onCancel.
   * * @param {React.MouseEvent} e - The mouse click event
   */
  const handleClickOutside = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="login-modal-overlay" onClick={handleClickOutside}>
      <div className="login-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="login-modal-title">{t("forgotPasswordTitle")}</h2>
        <p className="login-modal-subtitle">{t("forgotPasswordSubtitle")}</p>
        
        <form onSubmit={onSubmit} className="login-modal-form">
          <div className="login-form-group">
            <label
              htmlFor="forgot-email"
              className={`login-form-label ${error ? "login-label-error" : ""}`}
            >
              {t("email")}
            </label>
            <input
              id="forgot-email"
              type="email"
              className={`login-form-input ${error ? "login-input-error" : ""}`}
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder={t("enterYourEmail")}
            />
            {error && (
              <span className="login-error-message">{error}</span>
            )}
          </div>
          
          <div className="login-form-actions">
            <button
              type="button"
              className="btn-text"
              onClick={onCancel}
              disabled={sending}
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="btn-solid"
              disabled={sending}
            >
              {sending ? t("sending") : t("send")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;