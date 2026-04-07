import { useState, useEffect } from "react";
import UserSidebar from "../components/UserSidebar";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { useNotifications } from "../context/NotificationContext";
import { getTranslation } from "../utils/translations";
import { notificationsAPI, Notification } from "../services/api";
import Snackbar from "../components/Snackbar";
import { useSnackbar } from "../utils/snackbar";
import "../styles/shared.css";
import "./Notifications.css";
import Footer from "../components/Footer";

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
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationsAPI.getNotifications();
      setNotifications(data);
    } catch (error: any) {
      showError(t("somethingWentWrong"));
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
        // Check for rejection messages (post, comment, report)
        if (
          message.startsWith("Post rejected.") ||
          message.startsWith("Публикацията е отхвърлена.") ||
          message.startsWith("Your report was reviewed") ||
          message.startsWith("Вашият сигнал беше прегледан") ||
          message.startsWith("Comment rejected.") ||
          message.startsWith("Коментарът е отхвърлен.") ||
          lowerMessage.includes("rejected") ||
          lowerMessage.includes("отхвърлен") ||
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
      case "post_deleted":
        // Admin deletion: error (red X)
        if (
          lowerMessage.includes("removed by an administrator") ||
          lowerMessage.includes("премахната от администратор")
        ) {
          return "close";
        }
        // Self-deletion: neutral notification
        return "notifications";
      case "system":
        if (lowerMessage.includes("warning") || lowerMessage.includes("alert")) {
          return "warning";
        }
        return "info";
      case "new_login":
        return "warning";
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
      // Rejections = error (red)
      if (
        message.startsWith("Post rejected.") ||
        message.startsWith("Публикацията е отхвърлена.") ||
        message.startsWith("Your report was reviewed") ||
        message.startsWith("Вашият сигнал беше прегледан") ||
        message.startsWith("Comment rejected.") ||
        message.startsWith("Коментарът е отхвърлен.") ||
        lowerMessage.includes("rejected") ||
        lowerMessage.includes("отхвърлен") ||
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
    if (type === "post_deleted") {
      // Admin deletion: error red
      if (
        lowerMessage.includes("removed by an administrator") ||
        lowerMessage.includes("премахната от администратор")
      ) {
        return "#F44336";
      }
      // Self-deletion: neutral gray
      return "#757575";
    }
    if (type === "system") {
      return "#FF9800";
    }
    if (type === "new_login") {
      return "#FF9800"; // Orange warning color
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
    // No navigation: unread notifications just become read, read notifications do nothing
  };

  const markAllAsRead = async () => {
    try {
      // Use context to update badge immediately
      await markAllAsReadContext();
      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      showError(t("somethingWentWrong"));
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      // Check if the notification is unread before deleting
      const notificationToDelete = notifications.find((n) => n._id === notificationId);
      const wasUnread = notificationToDelete && !notificationToDelete.read;

      await notificationsAPI.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      showSuccess(t("notificationDeleted"));

      // If it was unread, decrement the badge count
      if (wasUnread) {
        decrementUnreadCount();
      }
    } catch (error) {
      showError(t("failedToDeleteNotification"));
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
      showSuccess(t("allNotificationsCleared"));
    } catch (error) {
      showError(t("failedToClearNotifications"));
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
            <div className="empty-state">
              <span className="material-icons">notifications_off</span>
              <h3 className="empty-state-title">{t("noNotifications")}</h3>
            </div>
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
            onClose={closeSnackbar}
          />
          <Footer />
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
