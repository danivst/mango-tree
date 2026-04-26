/**
 * @file TwoFactorModal.tsx
 * @description Two-Factor Authentication verification modal.
 * Prompts user to enter the 6-digit numeric security code sent to their registered email address.
 * Handles numeric-only input validation, auto-focus and loading states during verification.
 */

import React from 'react';

/**
 * @interface TwoFactorModalProps
 * @description Props for the TwoFactorModal component.
 * @property {boolean} open - Controls the visibility of the modal overlay and content.
 * @property {string} code - The current 6-digit string value entered by the user.
 * @property {boolean} verifying - State to disable inputs and show loading text during API calls.
 * @property {string} [error] - Optional validation or server error message to display.
 * @property {(code: string) => void} onCodeChange - Handler to update the code state in the parent component.
 * @property {(e: React.FormEvent) => void} onSubmit - Handler for the verification form submission.
 * @property {() => void} onCancel - Handler to close the modal and abort the 2FA process.
 * @property {(key: string) => string} t - Translation function for localization.
 */
interface TwoFactorModalProps {
  open: boolean;
  code: string;
  verifying: boolean;
  error?: string;
  onCodeChange: (code: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  t: (key: string) => string;
}

/**
 * @component TwoFactorModal
 * @description Renders a security-focused modal for verifying 2FA codes.
 * Features include numeric-only enforcement and automatic input filtering to ensure
 * only the expected 6 digits are processed.
 */
const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  open,
  code,
  verifying,
  error,
  onCodeChange,
  onSubmit,
  onCancel,
  t
}) => {
  /**
   * Guard clause: Do not render the component if it is not flagged as open.
   */
  if (!open) return null;

  /**
   * Handles and sanitizes the input change.
   * Forces the input to be numeric only and limits the length to 6 characters.
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event.
   */
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    onCodeChange(value);
  };

  return (
    <div className="login-modal-overlay">
      <div className="login-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="login-modal-title">{t("twoFactorAuth")}</h2>
        <p className="login-modal-subtitle">
          {t("twoFACodePlaceholder")}
        </p>
        <form onSubmit={onSubmit} className="login-modal-form">
          <div className="login-form-group">
            <label
              htmlFor="twofa-code"
              className={`login-form-label ${error ? "login-label-error" : ""}`}
            >
              {t("twoFACodeLabel")}
            </label>
            <input
              id="twofa-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              className={`login-form-input login-twofa-code-input ${error ? "login-input-error" : ""}`}
              value={code}
              onChange={handleCodeChange}
              placeholder={t("twoFACodePlaceholder")}
              autoFocus
              disabled={verifying}
            />
            {error && <span className="login-error-message">{error}</span>}
          </div>
          <div className="login-form-actions">
            <button
              type="button"
              className="btn-text"
              onClick={onCancel}
              disabled={verifying}
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="btn-solid"
              disabled={verifying || code.length !== 6}
            >
              {verifying ? t("verifying2FA") : t("verify")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TwoFactorModal;
