import { useState, useEffect } from "react";
import api from "../services/api";
import { getUserRole } from "../utils/auth";
import "../styles/shared.css";

/**
 * @interface User
 * @description Minimal user data structure for profile management form.
 * Contains only fields needed for account settings editing.
 *
 * @property {string} _id - User's unique identifier (MongoDB ObjectId)
 * @property {string} username - Current username (editable for non-admins)
 * @property {string} email - User's email address (read-only)
 * @property {string} role - User's role (determines edit permissions)
 */

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
}

/**
 * @interface UserProfileFormProps
 * @description Props for the UserProfileForm component.
 * This is a controlled form component that works with parent state.
 *
 * @property {User | null} user - Complete user data object, null if not loaded
 * @property {React.Dispatch<React.SetStateAction<User | null>>} setUser - State updater function for parent component to receive updated user data
 * @property {(key: string) => string} t - Translation function (key => localized string)
 * @property {React.Dispatch<React.SetStateAction<{open: boolean; message: string; type: "success" | "error"}>>} setSnackbar - Snackbar state updater from parent
 */

interface UserProfileFormProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  t: (key: string) => string;
  setSnackbar: React.Dispatch<
    React.SetStateAction<{
      open: boolean;
      message: string;
      type: "success" | "error";
    }>
  >;
}

/**
 * @file UserProfileForm.tsx
 * @description Form component for managing user account settings.
 * Allows username editing (non-admins only), password reset via email, and displays non-editable email.
 * Integrates with parent component state for user data and snackbar notifications.
 *
 * Business Rules:
 * - Email field is always read-only (cannot be changed)
 * - Username is editable only for non-admin users (admins have restricted profiles)
 * - Username availability is checked with backend before update to prevent duplicates
 * - Password changes trigger a password reset email via forgotPassword endpoint (no direct password change)
 *
 * Form Sections:
 * 1. Username: Editable field with "Change Username" button (non-admins only)
 * 2. Email: Read-only display showing current email
 * 3. Password: "Change Password" button that triggers forgot password email flow
 *
 * @component
 * @requires useState - Local form state for editable username and loading states
 * @requires useEffect - Sync local username with prop changes
 * @requires api - Axios instance for HTTP requests
 * @requires getUserRole - Utility to determine if current user is admin
 */

const UserProfileForm: React.FC<UserProfileFormProps> = ({
  user,
  setUser,
  t,
  setSnackbar,
}) => {
  /**
   * Local state: editable copy of the username.
   * Synced with user prop via useEffect. Allows user to make changes without affecting parent state until they click save.
   */
  const [editableUsername, setEditableUsername] = useState(user?.username || "");
  const [sendingEmail, setSendingEmail] = useState(false);

  /**
   * Get current user's role from token to determine edit permissions.
   * Admins cannot edit their username through this form (business rule).
   */
  const currentUserRole = getUserRole();

  /**
   * Effect: Keep local editableUsername in sync when parent user prop changes.
   * This ensures the form reflects the latest user data (e.g., after a successful update).
   */
  useEffect(() => {
    if (user) {
      setEditableUsername(user.username);
    }
  }, [user]);

  /**
   * Handles password reset request.
   * Sends a forgot password email to the user's registered email address.
   * Uses lazy import of authAPI to avoid circular dependencies between services.
   *
   * Process:
   * 1. Check if user exists (guard clause)
   * 2. Dynamically import authAPI
   * 3. Call forgotPassword with user's email
   * 4. Show success or error snackbar
   *
   * Side effects: Sets sendingEmail loading state during API call.
   */
  const handleChangePassword = async () => {
    if (!user) return;
    setSendingEmail(true);
    try {
      const { authAPI } = await import("../services/api"); // Lazy import avoids circular dependency
      await authAPI.forgotPassword(user.email);
      setSnackbar({
        open: true,
        message: t("emailSent"),
        type: "success",
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t("serverError"),
        type: "error",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  /**
   * Handles username update submission.
   * Validates username availability before submitting update.
   *
   * Flow:
   * 1. Check if desired username already exists (backend endpoint excludes current user)
   * 2. If exists → show error snackbar and abort
   * 3. If available → send PUT request to update user
   * 4. Update both local form state and parent user state
   * 5. Show success snackbar or error on failure
   *
   * API endpoints used:
   * - GET /users/check-username?username=... → { exists: boolean }
   * - PUT /users/:id → updates username
   */
  const handleUpdateUsername = async () => {
    if (!user) return;
    try {
      // Step 1: Check if username is already taken by another user
      const check = await api.get(
        `/users/check-username?username=${encodeURIComponent(editableUsername)}`,
      );
      if (check.data.exists) {
        setSnackbar({
          open: true,
          message: t("usernameExists"),
          type: "error",
        });
        return;
      }

      // Step 2: Username is available, proceed with update
      await api.put(`/users/${user._id}`, {
        username: editableUsername,
      });

      // Update parent state so other components see the new username
      setUser((prevUser) =>
        prevUser ? { ...prevUser, username: editableUsername } : null
      );

      setSnackbar({
        open: true,
        message: t("usernameUpdated"),
        type: "success",
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t("serverError"),
        type: "error",
      });
    }
  };

  /**
   * Don't render form if user data not loaded yet.
   * Parent component (Settings) should handle loading state or provide fallback.
   */
  if (!user) {
    return null;
  }

  /**
   * Determine if username field should be editable.
   * Admins have restricted profile editing per application business rules.
   */
  const isUsernameEditable = currentUserRole !== "admin";

  return (
    <div className="settings-section">
      <h2 className="settings-section-title">{t("account")}</h2>
      <div className="settings-form">
        <div className="form-group">
          <label className="form-label">{t("username")}</label>
          <div className="form-row">
            <input
              type="text"
              className="form-input"
              value={editableUsername}
              onChange={(e) => setEditableUsername(e.target.value)}
              disabled={!isUsernameEditable}
              title={isUsernameEditable ? "" : t("unableToEditUsername")}
            />
            <button
              className="btn-primary"
              onClick={handleUpdateUsername}
              disabled={!isUsernameEditable}
            >
              {t("changeUsername")}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{t("email")}</label>
          <div className="relative">
            <input
              type="email"
              className="form-input"
              value={user.email}
              disabled
              title={t("emailCannotBeEdited")}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{t("password")}</label>
          <div className="form-row">
            <input
              type="password"
              className="form-input"
              value="••••••••"
              readOnly
              disabled
              title={t("passwordCannotBeEdited")}
            />
            <button
              className="btn-primary text-nowrap"
              onClick={handleChangePassword}
              disabled={sendingEmail}
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
