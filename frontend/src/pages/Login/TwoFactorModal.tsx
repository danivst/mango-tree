/**
 * @file TwoFactorModal.tsx
 * @description Two-Factor Authentication verification modal.
 * Prompts user to enter 6-digit code sent to their email.
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.open - Whether modal is visible
 * @param {string} props.code - Current 2FA code value
 * @param {boolean} props.verifying - Whether verification is in progress
 * @param {string} [props.error] - Optional error message
 * @param {(code: string) => void} props.onCodeChange - Code input change handler
 * @param {(e: React.FormEvent) => void} props.onSubmit - Verify code submission handler
 * @param {() => void} props.onCancel - Cancel/close handler
 * @param {(key: string) => string} props.t - Translation function
 * @returns {JSX.Element}
 */
import React from 'react';

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
  if (!open) return null;

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    onCodeChange(value);
  };

  return (
    <div className="login-modal-overlay">
      <div className="login-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="login-modal-title">{t("twoFactorAuth")}</h2>
        <p className="login-modal-subtitle">
          {t("twoFactorDescription")}
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
