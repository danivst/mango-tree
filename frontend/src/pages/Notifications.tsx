import { useState, useEffect } from "react";
import UserSidebar from "../components/UserSidebar";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { useNotifications } from "../context/NotificationContext";
import { getTranslation } from "../utils/translations";
import { notificationsAPI, Notification } from "../services/api";
import Snackbar from "../components/Snackbar";
import "./admin/AdminPages.css";
import "./Notifications.css";

const Notifications = () => {
  const { language } = useThemeLanguage();
  const { markAllAsRead: markAllAsReadContext, decrementUnreadCount, clearUnreadCount } = useNotifications();
  const t = (key: string) => getTranslation(language, key);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: "success" | "error";
  }>({ open: false, message: "", type: "success" });
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationsAPI.getNotifications();
      setNotifications(data);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || t("somethingWentWrong"),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getNotificationIcon = (notification: Notification) => {
    const { type, message } = notification;
    const lowerMessage = message.toLowerCase();

    switch (type) {
      case "like":
        return "favorite";
      case "follow":
        return "person_add";
      case "comment":
        return "comment";
      case "report_feedback":
        if (
          lowerMessage.includes("removed") ||
          lowerMessage.includes("inappropriate") ||
          lowerMessage.includes("violated") ||
          lowerMessage.includes("deleted") ||
          lowerMessage.includes("service limitations") ||
          lowerMessage.includes("ai service") ||
          lowerMessage.includes("not cooking-related")
        ) {
          return "close";
        } else {
          return "check_circle";
        }
      case "system":
        if (lowerMessage.includes("warning") || lowerMessage.includes("alert")) {
          return "warning";
        }
        return "info";
      default:
        return "notifications";
    }
  };

  const getIconColor = (notification: Notification) => {
    const { type, message } = notification;
    const lowerMessage = message.toLowerCase();

    if (type === "like") {
      return "#E91E63";
    }
    if (type === "follow" || type === "comment") {
      return "#2196F3";
    }
    if (type === "report_feedback") {
      if (
        lowerMessage.includes("removed") ||
        lowerMessage.includes("inappropriate") ||
        lowerMessage.includes("violated") ||
        lowerMessage.includes("deleted") ||
        lowerMessage.includes("service limitations") ||
        lowerMessage.includes("ai service") ||
        lowerMessage.includes("not cooking-related")
      ) {
        return "#F44336";
      } else {
        return "#4CAF50";
      }
    }
    if (type === "system") {
      return "#FF9800";
    }
    return "#757575";
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return t("justNow") || "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      const unit = minutes === 1 ? (t("minute") || "minute") : (t("minutes") || "minutes");
      const ago = t("ago");
      return language === "bg" ? `${ago} ${minutes} ${unit}` : `${minutes} ${unit} ${ago}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      const unit = hours === 1 ? (t("hour") || "hour") : (t("hours") || "hours");
      const ago = t("ago");
      return language === "bg" ? `${ago} ${hours} ${unit}` : `${hours} ${unit} ${ago}`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      const unit = days === 1 ? (t("day") || "day") : (t("days") || "days");
      const ago = t("ago");
      return language === "bg" ? `${ago} ${days} ${unit}` : `${days} ${unit} ${ago}`;
    } else {
      return date.toLocaleDateString(language === "bg" ? "bg-BG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await notificationsAPI.markAsRead(notification._id);
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, read: true } : n
          )
        );
        // Immediately decrement the badge count
        decrementUnreadCount();
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }

    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  const markAllAsRead = async () => {
    try {
      // Use context to update badge immediately
      await markAllAsReadContext();
      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      setSnackbar({
        open: true,
        message: t("somethingWentWrong") || "Failed to mark all as read",
        type: "error",
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      // Check if the notification is unread before deleting
      const notificationToDelete = notifications.find((n) => n._id === notificationId);
      const wasUnread = notificationToDelete && !notificationToDelete.read;

      await notificationsAPI.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      setSnackbar({
        open: true,
        message: t("notificationDeleted") || "Notification deleted",
        type: "success",
      });

      // If it was unread, decrement the badge count
      if (wasUnread) {
        decrementUnreadCount();
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: t("failedToDeleteNotification") || "Failed to delete notification",
        type: "error",
      });
    }
  };

  const clearAll = async () => {
    setShowConfirmModal(true);
  };

  const handleConfirmClearAll = async () => {
    try {
      await notificationsAPI.deleteAllNotifications();
      setNotifications([]);
      // All notifications deleted, clear the badge count immediately
      clearUnreadCount();
      setSnackbar({
        open: true,
        message: t("allNotificationsCleared") || "All notifications cleared",
        type: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: t("failedToClearNotifications") || "Failed to clear notifications",
        type: "error",
      });
    } finally {
      setShowConfirmModal(false);
    }
  };

  return (
    <>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <UserSidebar />
        <div className="admin-page" style={{ flex: 1 }}>
          <div className="admin-page-header">
            <h1 className="admin-page-title">{t("notifications")}</h1>
            <div className="admin-page-actions">
              {notifications.some((n) => !n.read) && (
                <button className="admin-button-secondary" onClick={markAllAsRead}>
                  {t("markAllAsRead")}
                </button>
              )}
              <button
                className="admin-button-secondary"
                onClick={fetchNotifications}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                title={t("refreshNotifications")}
              >
                <span className="material-icons" style={{ fontSize: "18px" }}>
                  refresh
                </span>
                {t("refresh")}
              </button>
              {notifications.length > 0 && (
                <button
                  className="admin-delete-button"
                  onClick={clearAll}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span className="material-icons" style={{ fontSize: "18px" }}>
                    delete
                  </span>
                  {t("clearAll")}
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="admin-loading">{t("loading")}</div>
          ) : notifications.length === 0 ? (
            <div className="admin-loading">{t("noNotifications")}</div>
          ) : (
            <div className="notifications-list">

              {notifications.map((notification) => {
                const iconColor = getIconColor(notification);
                return (
                  <div
                    key={notification._id}
                    className={`notification-item ${notification.read ? "read" : "unread"}`}
                    onClick={() => handleNotificationClick(notification)}
                    style={!notification.read ? { borderLeft: `4px solid ${iconColor}` } : {}}
                  >
                    <span
                      className="material-icons notification-icon"
                      style={{ color: iconColor }}
                    >
                      {getNotificationIcon(notification)}
                    </span>
                    <div className="notification-content">
                      <p className="notification-message">
                        {notification.translations?.message?.[language] || notification.message}
                      </p>
                      <span className="notification-time">
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                    <button
                      className="admin-button-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification._id);
                      }}
                      style={{
                        padding: "6px 12px",
                        minWidth: "auto",
                        marginLeft: "8px",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "transparent",
                        border: "1px solid var(--theme-text)",
                        opacity: 0.7,
                      }}
                      title={t("deleteNotification")}
                    >
                      <span className="material-icons" style={{ fontSize: "18px" }}>
                        delete
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <Snackbar
            message={snackbar.message}
            type={snackbar.type}
            open={snackbar.open}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          />
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowConfirmModal(false);
            }
          }}
        >
          <div
            style={{
              background: "var(--theme-bg)",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
              border: "1px solid var(--theme-text)",
              opacity: 0.8,
            }}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: "18px",
                fontWeight: 600,
                color: "var(--theme-text)",
              }}
            >
              {t("confirmAction") || "Confirm Action"}
            </h3>
            <p
              style={{
                margin: "0 0 24px 0",
                fontSize: "14px",
                color: "var(--theme-text)",
                lineHeight: 1.5,
              }}
            >
              {t("clearAllConfirm") || "Are you sure you want to delete all notifications?"}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: "8px 16px",
                  border: "2px solid var(--theme-text)",
                  background: "transparent",
                  color: "var(--theme-text)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                {t("cancel") || "Cancel"}
              </button>
              <button
                onClick={handleConfirmClearAll}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  background: "var(--theme-accent)",
                  color: "var(--theme-text)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {t("confirm") || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Notifications;
