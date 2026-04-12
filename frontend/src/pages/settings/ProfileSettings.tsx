/**
 * @file ProfileSettings.tsx
 * @description Section for managing user profile information.
 * Acts as the primary container for account-related settings including nested security and deletion modules.
 */
import React, { useState } from "react";
import api from "../../services/api";
import { validateUsername } from "../../utils/validators";
import PasswordSettings from "./PasswordSettings";
import SecuritySettings from "./SecuritySettings";
import DeleteAccount from "./DeleteAccount";

/**
 * @component ProfileSettings
 * @description Renders account identification fields and hosts nested security components.
 */
const ProfileSettings: React.FC<any> = ({
  user,
  setUser,
  isAdmin,
  t,
  showError,
  showSuccess,
}) => {
  const [updating, setUpdating] = useState(false);

  /**
   * @function handleUsernameChange
   * @description Validates the username input and performs the update request to the server.
   */
  const handleUsernameChange = async () => {
    const usernameError = validateUsername(user.username);
    if (usernameError) {
      showError(t(usernameError));
      return;
    }

    setUpdating(true);
    try {
      const check = await api.get(
        `/users/check-username?username=${encodeURIComponent(user.username)}`
      );
      if (check.data.exists) {
        showError(t("usernameExists"));
        return;
      }
      await api.put(`/users/me`, { username: user.username });
      showSuccess(t("usernameUpdated"));
    } catch (error: any) {
      showError(t("serverError"));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="settings-section">
      <h2 className="settings-section-title">{t("account")}</h2>
      <div className="settings-form">
        <div className="form-group">
          <label className="form-label">{t("username")}</label>
          <div className="form-row username-row">
            <input
              type="text"
              className="form-input"
              value={user.username}
              onChange={(e) => setUser({ ...user, username: e.target.value })}
              disabled={isAdmin}
              title={isAdmin ? t("unableToEditUsername") : ""}
            />
            {!isAdmin && (
              <button className="btn-primary" onClick={handleUsernameChange} disabled={updating}>
                {updating ? t("loading") : t("changeUsername")}
              </button>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">{t("email")}</label>
          <div className="relative">
            <input type="email" className="form-input" value={user.email} disabled />
          </div>
        </div>

        <PasswordSettings t={t} showError={showError} showSuccess={showSuccess} />
        <SecuritySettings user={user} setUser={setUser} t={t} showError={showError} showSuccess={showSuccess} />
        <DeleteAccount user={user} isAdmin={isAdmin} t={t} showError={showError} />
      </div>
    </div>
  );
};

export default ProfileSettings;