import React, { useState, useEffect } from "react";
import api from "../services/api";
import { getUserRole } from "../utils/auth"; // Import getUserRole

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
}

interface UserProfileFormProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  t: (key: string) => string; // Translation function
  setSnackbar: React.Dispatch<
    React.SetStateAction<{
      open: boolean;
      message: string;
      type: "success" | "error";
    }>
  >;
}

const UserProfileForm: React.FC<UserProfileFormProps> = ({
  user,
  setUser,
  t,
  setSnackbar,
}) => {
  // Local state for username to allow editing
  const [editableUsername, setEditableUsername] = useState(user?.username || "");
  const [sendingEmail, setSendingEmail] = useState(false);
  const currentUserRole = getUserRole(); // Get current user's role

  useEffect(() => {
    if (user) {
      setEditableUsername(user.username);
    }
  }, [user]);

  const handleChangePassword = async () => {
    if (!user) return;
    setSendingEmail(true);
    try {
      const { authAPI } = await import("../services/api"); // Lazy import to avoid circular dependency if api.ts imports UserProfileForm
      await authAPI.forgotPassword(user.email);
      setSnackbar({
        open: true,
        message: t("emailSent"),
        type: "success",
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || t("serverError"),
        type: "error",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!user) return;
    try {
      // Check if username exists
      const check = await api.get(
        `/users/check-username?username=${encodeURIComponent(editableUsername)}`,
      );
      if (check.data.exists) {
        setSnackbar({
          open: true,
          message: t("usernameExists") || "Username already exists!",
          type: "error",
        });
        return;
      }
      await api.put(`/users/${user._id}`, {
        username: editableUsername,
      });
      setUser((prevUser) => (prevUser ? { ...prevUser, username: editableUsername } : null));
      setSnackbar({
        open: true,
        message: t("usernameUpdated") || "Username updated!",
        type: "success",
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || t("serverError"),
        type: "error",
      });
    }
  };

  if (!user) {
    return null; // Or a loading spinner, or error message
  }

  const isUsernameEditable = currentUserRole !== "admin";

  return (
    <div className="settings-section">
      <h2 className="settings-section-title">{t("account")}</h2>
      <div className="settings-form">
        <div className="admin-form-group">
          <label className="admin-form-label">{t("username")}</label>
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "flex-start",
            }}
          >
            <input
              type="text"
              className="admin-form-input"
              value={editableUsername}
              onChange={(e) => setEditableUsername(e.target.value)}
              style={{ flex: 1 }}
              disabled={!isUsernameEditable} // Disable if admin
            />
            <button
              className="admin-button-primary"
              onClick={handleUpdateUsername}
              disabled={!isUsernameEditable} // Disable if admin
            >
              {t("changeUsername")}
            </button>
          </div>
        </div>
        <div className="admin-form-group">
          <label className="admin-form-label">{t("email")}</label>
          <div style={{ position: "relative" }}>
            <input
              type="email"
              className="admin-form-input"
              value={user.email}
              disabled
              style={{
                background: "rgba(0, 0, 0, 0.1)",
                cursor: "not-allowed",
                opacity: 0.6,
              }}
              title={t("emailCannotBeEdited")}
            />
          </div>
        </div>
        <div className="admin-form-group">
          <label className="admin-form-label">{t("password")}</label>
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "flex-start",
            }}
          >
            <input
              type="password"
              className="admin-form-input"
              value="••••••••"
              disabled
              style={{
                background: "rgba(0, 0, 0, 0.1)",
                cursor: "not-allowed",
                opacity: 0.6,
                flex: 1,
              }}
            />
            <button
              className="admin-button-primary"
              onClick={handleChangePassword}
              disabled={sendingEmail}
              style={{ whiteSpace: "nowrap" }}
            >
              {sendingEmail ? t("sending") : t("changePassword")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileForm;

