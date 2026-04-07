/**
 * @file ForgotPasswordModal.tsx
 * @description Forgot password modal component.
 * Allows users to request a password reset email by entering their email.
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.open - Whether modal is visible
 * @param {string} props.email - Current email value
 * @param {boolean} props.sending - Whether email is being sent
 * @param {string} [props.error] - Optional error message
 * @param {(email: string) => void} props.onEmailChange - Email input change handler
 * @param {(e: React.FormEvent) => void} props.onSubmit - Send reset email handler
 * @param {() => void} props.onCancel - Cancel/close handler
 * @param {(key: string) => string} props.t - Translation function
 * @returns {JSX.Element}
 */
import React from 'react';

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
  if (!open) return null;

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
