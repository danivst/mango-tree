/**
 * @file SecuritySettings.tsx
 * @description Handles Two-Factor Authentication (2FA) management.
 * Allows users to enable 2FA via code verification or disable it directly.
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

/**
 * @component SecuritySettings
 * @description UI section for managing 2FA security settings.
 */
const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  user,
  setUser,
  t,
  showError,
  showSuccess,
}) => {
  const [showEnable2FAModal, setShowEnable2FAModal] = useState(false);
  const [settingsTwoFACode, setSettingsTwoFACode] = useState("");
  const [settingsVerifying2FA, setSettingsVerifying2FA] = useState(false);

  /**
   * @function handleEnable2FA
   * @description Requests a 2FA enablement code from the server and opens the verification modal.
   */
  const handleEnable2FA = async () => {
    try {
      await authAPI.enable2FA();
      setShowEnable2FAModal(true);
    } catch {
      showError(t("failedToSendVerificationCode"));
    }
  };

  /**
   * @function handleVerifySettings2FA
   * @description Verifies the 6-digit code to finalize 2FA activation.
   * @param {React.FormEvent} e - The form submission event.
   */
  const handleVerifySettings2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    const tfaError = validateTwoFactorCode(settingsTwoFACode);
    if (tfaError) return showError(t(tfaError));

    setSettingsVerifying2FA(true);
    try {
      await authAPI.verify2FA(user._id, settingsTwoFACode);
      // With HttpOnly cookies, tokens are set server-side automatically
      setUser({ ...user, twoFactorEnabled: true });
      setShowEnable2FAModal(false);
      setSettingsTwoFACode("");
      showSuccess(t("twoFAEnabledSuccess"));
    } catch {
      showError(t("actionFailed"));
    } finally {
      setSettingsVerifying2FA(false);
    }
  };

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
              onClick={() =>
                authAPI
                  .disable2FA()
                  .then(() => setUser({ ...user, twoFactorEnabled: false }))
              }
            >
              {t("disable2FA")}
            </button>
          </>
        ) : (
          <button
            className="btn-primary btn-sm text-nowrap"
            onClick={handleEnable2FA}
          >
            {t("enable2FA")}
          </button>
        )}
      </div>

      {showEnable2FAModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">{t("twoFactorAuth")}</h2>
            <p className="modal-text">{t("twoFactorDescription")}</p>
            <form onSubmit={handleVerifySettings2FA} className="mt-5">
              <div className="form-group">
                <label className="form-label">{t("twoFACodeLabel")}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="form-input twofa-code-input"
                  value={settingsTwoFACode}
                  onChange={(e) =>
                    setSettingsTwoFACode(
                      e.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  placeholder={t("twoFACodePlaceholder")}
                  autoFocus
                  disabled={settingsVerifying2FA}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowEnable2FAModal(false)}
                  disabled={settingsVerifying2FA}
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={
                    settingsVerifying2FA || settingsTwoFACode.length !== 6
                  }
                >
                  {settingsVerifying2FA ? t("verifying2FA") : t("verify")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecuritySettings;
