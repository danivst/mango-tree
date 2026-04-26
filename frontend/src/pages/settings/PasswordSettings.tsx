/**
 * @file PasswordSettings.tsx
 * @description Component for updating the user's password with integrated complexity validation.
 * Features visibility toggles for improved user experience during input.
 */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../../services/api";
import { validatePassword, validatePasswordMatch } from "../../utils/validators";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

/**
 * @component PasswordSettings
 * @description Renders the password change form and handles the submission logic.
 */
const PasswordSettings: React.FC<any> = ({ t, showError, showSuccess }) => {
  const navigate = useNavigate();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /**
   * @function handleChangePassword
   * @description Validates password matching and complexity requirements before updating via API.
   */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const matchError = validatePasswordMatch(newPassword, confirmPassword);
    if (matchError) return showError(t(matchError));

    const passwordError = validatePassword(newPassword);
    if (passwordError) return showError(t(passwordError));

    setChangingPassword(true);
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      showSuccess(t("passwordChangedSuccess"));
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate("/home"), 1500);
    } catch (error: any) {
      showError(t("incorrectPassword"));
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="form-group">
      <label className="form-label">{t("password")}</label>
      <div className="form-row">
        <input type="password" className="form-input" value={"•".repeat(8)} readOnly disabled />
        <button className="btn-primary text-nowrap" onClick={() => setShowPasswordForm(!showPasswordForm)}>
          {t("changePassword")}
        </button>
      </div>
      {showPasswordForm && (
        <form className="password-change-form" onSubmit={handleChangePassword}>
          <div className="form-group">
            <label className="form-label">{t("currentPassword")}</label>
            <div className="password-input-wrapper">
              <input 
                type={showCurrentPassword ? "text" : "password"} 
                className="form-input" 
                value={currentPassword} 
                onChange={(e) => setCurrentPassword(e.target.value)} 
                required 
              />
              <button type="button" className="password-toggle" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                {showCurrentPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t("newPassword")}</label>
            <div className="password-input-wrapper">
              <input 
                type={showNewPassword ? "text" : "password"} 
                className="form-input" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
              />
              <button type="button" className="password-toggle" onClick={() => setShowNewPassword(!showNewPassword)}>
                {showNewPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t("confirmPassword")}</label>
            <div className="password-input-wrapper">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                className="form-input" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
              />
              <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
              </button>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => {
                setShowPasswordForm(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
            >
              {t("cancel")}
            </button>
            <button type="submit" className="btn-primary" disabled={changingPassword}>
              {changingPassword ? t("sending") : t("changePassword")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PasswordSettings;