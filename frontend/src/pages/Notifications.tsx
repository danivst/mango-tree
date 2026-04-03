import { useState, useEffect } from "react";
import UserSidebar from "../components/UserSidebar";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { useNotifications } from "../context/NotificationContext";
import { getTranslation } from "../utils/translations";
import { notificationsAPI, Notification } from "../services/api";
import Snackbar from "../components/Snackbar";
import "../styles/shared.css";
import "./Notifications.css";

/**
 * @file Notifications.tsx
 * @description Notifications center where users view and manage all system notifications.
 * Displays a scrollable list of notifications with color-coded icons based on type.
 *
 * Features:
 * - Real-time notification list with read/unread status
 * - Color-coded icons: likes (pink), follows/comments (blue), report feedback (green/red/amber), system (amber)
 * - Click to mark as read and navigate to linked content
 * - Mark all as read (button visible only when unread notifications exist)
 * - Delete individual notifications
 * - Clear all notifications with confirmation modal
 * - Refresh button to manually reload
 * - Time formatting: relative times (e.g., "5 minutes ago") for recent, absolute dates for older
 * - Translation support for notification messages (uses translations.message if available)
 *
 * Notification Types & Icon Logic:
 * - like: favorite (pink)
 * - follow: person_add (blue)
 * - comment: comment (blue)
 * - report_feedback: Depends on message content:
 *   - AI service warnings/pending admin review → warning (amber)
 *   - Post rejections/removals → close (red)
 *   - Resolved reports → check_circle (green)
 * - system: warning for alerts, info for general (amber/gray)
 *
 * Integration:
 * - Uses NotificationContext for unread count management (decrement, clear, markAllAsRead)
 * - Clicking a read/unread notification marks it read via API and updates both local state and context badge
 * - Deleting a notification updates badge if it was unread
 *
 * @page
 * @requires useState - Notifications list, loading, snackbar, modal state
 * @requires useEffect - Fetch notifications on mount
 * @requires useThemeLanguage - Language for time formatting and translations
 * @requires useNotifications - Context for badge management (decrementUnreadCount, clearUnreadCount, markAllAsRead)
 * @requires notificationsAPI - Fetch, mark read, delete individual, delete all
 * @requires Snackbar - Success/error feedback (delete, clear all)
 * @requires UserSidebar - Navigation
 */

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
        message: t("somethingWentWrong"),
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
        // Check for AI service warnings (pending admin review due to service issues)
        if (
          lowerMessage.includes("service limitations") ||
          lowerMessage.includes("ai service") ||
          lowerMessage.includes("pending admin review") ||
          lowerMessage.includes("pending for preview by admin")
        ) {
          return "warning";
        }
        // Check for post rejection - any message starting with "Post rejected" or Bulgarian equivalent
        if (
          message.startsWith("Post rejected.") ||
          message.startsWith("Публикацията е отхвърлена.")
        ) {
          return "close";
        }
        // Also check for keywords indicating rejection
        if (
          lowerMessage.includes("removed") ||
          lowerMessage.includes("inappropriate") ||
          lowerMessage.includes("violated") ||
          lowerMessage.includes("deleted") ||
          lowerMessage.includes("not cooking-related") ||
          lowerMessage.includes("отхвърлена") ||
          lowerMessage.includes("не е свързана с готвене") ||
          lowerMessage.includes("неуместно")
        ) {
          return "close";
        }
        // Success/Resolved notifications
        return "check_circle";
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
      // AI service warnings = warning (amber)
      if (
        lowerMessage.includes("service limitations") ||
        lowerMessage.includes("ai service") ||
        lowerMessage.includes("pending admin review") ||
        lowerMessage.includes("pending for preview by admin")
      ) {
        return "#FF9800";
      }
      // Post rejections = error (red)
      if (
        message.startsWith("Post rejected.") ||
        message.startsWith("Публикацията е отхвърлена.") ||
        lowerMessage.includes("removed") ||
        lowerMessage.includes("inappropriate") ||
        lowerMessage.includes("violated") ||
        lowerMessage.includes("deleted") ||
        lowerMessage.includes("not cooking-related") ||
        lowerMessage.includes("отхвърлена") ||
        lowerMessage.includes("не е свързана с готвене") ||
        lowerMessage.includes("неуместно")
      ) {
        return "#F44336";
      }
      // Success/resolved = green
      return "#4CAF50";
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
      return t("justNow");
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      const unit = minutes === 1 ? t("minute") : t("minutes");
      const ago = t("ago");
      return language === "bg" ? `${ago} ${minutes} ${unit}` : `${minutes} ${unit} ${ago}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      const unit = hours === 1 ? t("hour") : t("hours");
      const ago = t("ago");
      return language === "bg" ? `${ago} ${hours} ${unit}` : `${hours} ${unit} ${ago}`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      const unit = days === 1 ? t("day") : t("days");
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
        message: t("somethingWentWrong"),
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
        message: t("notificationDeleted"),
        type: "success",
      });

      // If it was unread, decrement the badge count
      if (wasUnread) {
        decrementUnreadCount();
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: t("failedToDeleteNotification"),
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
        message: t("allNotificationsCleared"),
        type: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: t("failedToClearNotifications"),
        type: "error",
      });
    } finally {
      setShowConfirmModal(false);
    }
  };

  return (
    <>
      <div className="notifications-container">
        <UserSidebar />
        <div className="page-container">
          <div className="page-header">
            <h1 className="page-title">{t("notifications")}</h1>
            <div className="page-actions">
              {notifications.some((n) => !n.read) && (
                <button className="btn-secondary" onClick={markAllAsRead}>
                  {t("markAllAsRead")}
                </button>
              )}
              <button
                className="btn-secondary icon-btn"
                onClick={fetchNotifications}
                title={t("refreshNotifications")}
              >
                <span className="material-icons text-lg">refresh</span>
                {t("refresh")}
              </button>
              {notifications.length > 0 && (
                <button
                  className="btn-danger icon-btn"
                  onClick={clearAll}
                >
                  <span className="material-icons text-lg">delete</span>
                  {t("clearAll")}
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="loading">{t("loading")}</div>
          ) : notifications.length === 0 ? (
            <div className="loading">{t("noNotifications")}</div>
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
                      className="notification-delete-btn ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification._id);
                      }}
                      title={t("deleteNotification")}
                    >
                      <span className="material-icons text-lg">delete</span>
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
          <footer className="page-footer">
            <p>{t("copyright")}</p>
          </footer>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowConfirmModal(false);
        }}>
          <div className="modal confirm-dialog">
            <h3 className="modal-title">{t("confirmAction")}</h3>
            <p className="modal-text">{t("clearAllConfirm")}</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowConfirmModal(false)}>
                {t("cancel")}
              </button>
              <button className="btn-primary" onClick={handleConfirmClearAll}>
                {t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Notifications;
