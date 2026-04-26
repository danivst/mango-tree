/**
 * @file SuspensionModal.tsx
 * @description Account suspension notice modal component.
 * Displays a critical notification to users whose accounts have been banned or suspended,
 * explaining the enforcement reason and providing guidance on how to contact support.
 */

import React from 'react';

/**
 * @interface SuspensionModalProps
 * @description Props for the SuspensionModal component.
 * @property {boolean} open - Controls the visibility of the modal overlay and content
 * @property {string} reason - The specific administrative reason for the account suspension
 * @property {() => void} onOK - Callback function to handle acknowledgement and closure
 * @property {(key: string) => string} t - Localization function for translating UI text
 */
interface SuspensionModalProps {
  open: boolean;
  reason: string;
  onOK: () => void;
  t: (key: string) => string;
}

/**
 * @component SuspensionModal
 * @description Renders a centered modal dialog for account suspension alerts.
 * This component is typically triggered during the login flow if the authentication 
 * process detects a banned status.
 */
const SuspensionModal: React.FC<SuspensionModalProps> = ({
  open,
  reason,
  onOK,
  t
}) => {
  /**
   * Guard clause to prevent rendering the modal into the DOM when not active.
   */
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
