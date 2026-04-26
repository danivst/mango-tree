/**
 * @file SecuritySettings.tsx
 * @description Handles Two-Factor Authentication (2FA) management.
 * Allows users to enable/disable 2FA via secure 6-digit code verification.
 */
import React, { useState } from "react";
import { authAPI } from "../../services/api";
import { validateTwoFactorCode } from "../../utils/validators";
import "./Settings.css";
import "../../styles/shared.css";

interface SecuritySettingsProps {
  user: any;
  setUser: (user: any) => void;
  t: (key: string) => string;
  showError: (msg: string) => void;
  showSuccess: (msg: string) => void;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  user,
  setUser,
  t,
  showError,
  showSuccess,
}) => {
  const [showEnable2FAModal, setShowEnable2FAModal] = useState(false);
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  
  const [settingsTwoFACode, setSettingsTwoFACode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Initiates Enablement: Requests code and opens modal
   */
  const handleEnableRequest = async () => {
    try {
      await authAPI.enable2FA();
      setShowEnable2FAModal(true);
      setSettingsTwoFACode("");
    } catch {
      showError(t("failedToSendVerificationCode"));
    }
  };

  /**
   * Initiates Deactivation: Requests code and opens modal
   */
  const handleDisableRequest = async () => {
    try {
      // Backend sends code to email because we pass no code in body
      await authAPI.disable2FA();
      setShowDisable2FAModal(true);
      setSettingsTwoFACode("");
    } catch {
      showError(t("failedToSendVerificationCode"));
    }
  };

  /**
   * Finalizes Enablement
   */
  const handleVerifyEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    const tfaError = validateTwoFactorCode(settingsTwoFACode);
    if (tfaError) return showError(t(tfaError));

    setIsProcessing(true);
    try {
      await authAPI.verify2FA(user._id, settingsTwoFACode);
      setUser({ ...user, twoFactorEnabled: true });
      setShowEnable2FAModal(false);
      showSuccess(t("twoFAEnabledSuccess"));
    } catch {
      showError(t("actionFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Finalizes Deactivation
   */
  const handleVerifyDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    const tfaError = validateTwoFactorCode(settingsTwoFACode);
    if (tfaError) return showError(t(tfaError));

    setIsProcessing(true);
    try {
      // Pass the code to the same endpoint to confirm deactivation
      await authAPI.disable2FA(settingsTwoFACode);
      setUser({ ...user, twoFactorEnabled: false });
      setShowDisable2FAModal(false);
      showSuccess(t("twoFADisabledSuccess"));
    } catch {
      showError(t("invalidVerificationCode"));
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Reusable UI for the 6-digit input
   */
  const renderCodeInput = (onSubmit: (e: React.FormEvent) => void, onCancel: () => void, title: string, description: string) => (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title">{title}</h2>
        <p className="modal-text">{description}</p>
        <form onSubmit={onSubmit} className="mt-5">
          <div className="form-group">
            <label className="form-label">{t("twoFACodeLabel")}</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="form-input twofa-code-input"
              value={settingsTwoFACode}
              onChange={(e) => setSettingsTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder={t("twoFACodePlaceholder")}
              autoFocus
              disabled={isProcessing}
            />
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
              disabled={isProcessing}
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isProcessing || settingsTwoFACode.length !== 6}
            >
              {isProcessing ? t("verifying") : t("verify")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="form-group twofa-section">
      <label className="form-label">{t("twoFactorAuth")}</label>
      <div className="form-row items-center">
        <p className="twofa-description">{t("twoFactorDescription")}</p>
        {user?.twoFactorEnabled ? (
          <>
            <span className="twofa-status-enabled text-nowrap">
              {t("twoFAEnabled")}
            </span>
            <button
              className="btn-secondary btn-sm text-nowrap"
              onClick={handleDisableRequest}
            >
              {t("disable2FA")}
            </button>
          </>
        ) : (
          <button
            className="btn-primary btn-sm text-nowrap"
            onClick={handleEnableRequest}
          >
            {t("enable2FA")}
          </button>
        )}
      </div>
      {showEnable2FAModal && renderCodeInput(
        handleVerifyEnable, 
        () => setShowEnable2FAModal(false), 
        t("enable2FA"), 
        t("twoFactorEnableInstruction")
      )}
      {showDisable2FAModal && renderCodeInput(
        handleVerifyDisable, 
        () => setShowDisable2FAModal(false), 
        t("disable2FA"), 
        t("twoFactorDisableInstruction")
      )}
    </div>
  );
};

export default SecuritySettings;