/**
 * @file SuspensionModal.tsx
 * @description Account suspension notice modal.
 * Displays when a suspended user attempts to log in.
 * Shows the reason for suspension and contact support information.
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.open - Whether modal is visible
 * @param {string} props.reason - The suspension reason text
 * @param {() => void} props.onOK - Acknowledge and close handler
 * @param {(key: string) => string} props.t - Translation function
 * @returns {JSX.Element}
 */
import React from 'react';

interface SuspensionModalProps {
  open: boolean;
  reason: string;
  onOK: () => void;
  t: (key: string) => string;
}

const SuspensionModal: React.FC<SuspensionModalProps> = ({
  open,
  reason,
  onOK,
  t
}) => {
  if (!open) return null;

  return (
    <div className="login-modal-overlay">
      <div className="login-modal-content">
        <h2 className="login-modal-title">{t("accountSuspended")}</h2>
        <p className="login-modal-subtitle mb-6 text-left">
          {t("suspensionMessage")} <strong>{reason}</strong>
        </p>
        <p className="login-modal-subtitle mb-6 text-left">
          {t("contactSupport")}
        </p>
        <div className="login-form-actions modal-actions-center">
          <button className="btn-solid" onClick={onOK}>
            {t("ok")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuspensionModal;
