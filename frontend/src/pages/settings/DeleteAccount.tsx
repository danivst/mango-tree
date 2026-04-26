/**
 * @file DeleteAccount.tsx
 * @description Provides logic for permanent account deletion.
 * Simplified flow for users with an added mandatory reason requirement for administrators.
 */
import React, { useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

/**
 * @component DeleteAccount
 * @description Handles the irreversible deletion of the user account and associated cleanup.
 */
const DeleteAccount: React.FC<any> = ({ user, isAdmin, t, showError }) => {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);

  /**
   * @function handleDelete
   * @description Executes the account deletion via API and performs logout.
   */
  const handleDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const url = isAdmin
        ? `/users/${user._id}?reason=${encodeURIComponent(deleteReason)}`
        : `/users/${user._id}`;
      await api.delete(url);
      sessionStorage.setItem("accountDeleted", "true");
      navigate("/login");
    } catch {
      showError(t("failedToDeleteUser"));
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="form-group">
        {!isAdmin && (
          <button
            className="btn-danger"
            onClick={() => setShowDeleteModal(true)}
          >
            {t("deleteAccount")}
          </button>
        )}
      </div>
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal modal-danger">
            <h2 className="modal-title">
              {isAdmin ? t("reasonForDeletion") : t("deleteAccount")}
            </h2>
            <p className="modal-text">{t("deleteAccountWarning")}</p>
            {isAdmin && (
              <textarea
                className="form-textarea"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                required
                placeholder={t("reasonForDeletionPlaceholder")}
              />
            )}
            <div className="modal-actions mt-5">
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                {t("cancel")}
              </button>
              <button
                className="btn-danger"
                onClick={handleDelete}
                disabled={deleting || (isAdmin && !deleteReason)}
              >
                {deleting ? t("loading") : t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteAccount;
