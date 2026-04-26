/**
 * @file Notifications.tsx
 * @description Notifications center where users view and manage all system notifications.
 * Displays a scrollable list of notifications with color-coded icons based on type,
 * providing real-time updates for user interactions, reports and system alerts.
 */

import { useState, useEffect } from "react";
import UserSidebar from "../../../components/user/sidebar/UserSidebar";
import { useThemeLanguage } from "../../../context/ThemeLanguageContext";
import { useNotifications } from "../../../context/NotificationContext";
import { getTranslation } from "../../../utils/translations";
import { notificationsAPI, Notification } from "../../../services/api";
import Snackbar from "../../../components/snackbar/Snackbar";
import { useSnackbar } from "../../../utils/snackbar";
import "../../../styles/shared.css";
import "./Notifications.css";
import Footer from "../../../components/global/Footer";

import FavoriteIcon from '@mui/icons-material/Favorite';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CommentIcon from '@mui/icons-material/Comment';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import CloseIcon from '@mui/icons-material/Close';

/**
 * @component Notifications
 * @description Renders the notifications management page.
 * Orchestrates fetching, marking as read, and deleting notifications while
 * updating the global unread count badge in the application context.
 *
 * @requires useThemeLanguage - Current UI language for localization
 * @requires useNotifications - Global notification context for badge management
 * @requires notificationsAPI - Backend interaction for notification lifecycle
 * @returns {JSX.Element} The rendered notifications dashboard
 */
const Notifications = () => {
  const { language } = useThemeLanguage();
  const {
    markAllAsRead: markAllAsReadContext,
    decrementUnreadCount,
    clearUnreadCount,
  } = useNotifications();
  const t = (key: string) => getTranslation(language, key);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  /**
   * Fetches the complete list of notifications from the API.
   */
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

  /**
   * Logic: Determine which MUI icon to display based on notification type and message.
   */
  const getNotificationIcon = (notification: Notification) => {
    const { type, message } = notification;
    const lowerMessage = message.toLowerCase();

    switch (type) {
      case "like":
        return <FavoriteIcon />;
      case "follow":
        return <PersonAddIcon />;
      case "comment":
        return <CommentIcon />;
      case "report_feedback":
        if (lowerMessage.includes("deleted")) return <CloseIcon />;
        return <CheckCircleIcon />;
      case "fail":
        return <CloseIcon />;
      case "success":
        return <CheckCircleIcon />;
      case "system":
        if (lowerMessage.includes("warning") || lowerMessage.includes("alert")) return <WarningIcon />;
        return <InfoIcon />;
      case "new_login":
        return <WarningIcon />;
      default:
        return <NotificationsIcon />;
    }
  };

  /**
   * Logic: Returns the hexadecimal color string associated with a notification type.
   */
  const getIconColor = (notification: Notification) => {
    const { type, message } = notification;
    const lowerMessage = message.toLowerCase();

    if (type === "like") return "#E91E63";
    if (type === "follow" || type === "comment") return "#2196F3";
    if (type === "report_feedback") {
      if (lowerMessage.includes("deleted") ||
          lowerMessage.includes("administrator")) return "#F44336";
      return "#4CAF50";
    }
    if (type === "success") return "#4CAF50";
    if (type === "fail") return "#F44336";
    if (type === "system" || type === "new_login") return "#FF9800";
    return "#757575";
  };

  /**
   * Utility: Formats date strings into relative time or localized absolute dates.
   */
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return t("justNow");
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      const minuteKey = minutes === 1 ? "minute" : "minutes";
      return language === "bg" ? `${t("ago")} ${minutes} ${t(minuteKey)}` : `${minutes} ${t(minuteKey)} ${t("ago")}`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      const hourKey = hours === 1 ? "hour" : "hours";
      return language === "bg" ? `${t("ago")} ${hours} ${t(hourKey)}` : `${hours} ${t(hourKey)} ${t("ago")}`;
    }
    return date.toLocaleDateString(language === "bg" ? "bg-BG" : "en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  /**
   * Action: Marks a single notification as read.
   */
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await notificationsAPI.markAsRead(notification._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
        );
        decrementUnreadCount();
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Failed to mark read:", error);
        }
      }
    }
  };

  /**
   * Action: Bulk update to mark all notifications as read.
   */
  const markAllAsRead = async () => {
    try {
      await markAllAsReadContext();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      showError(t("somethingWentWrong"));
    }
  };

  /**
   * Action: Removes a single notification record.
   */
  const deleteNotification = async (notificationId: string) => {
    try {
      const notificationToDelete = notifications.find((n) => n._id === notificationId);
      const wasUnread = notificationToDelete && !notificationToDelete.read;

      await notificationsAPI.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      showSuccess(t("notificationDeleted"));

      if (wasUnread) decrementUnreadCount();
    } catch (error) {
      showError(t("failedToDeleteNotification"));
    }
  };

  /**
   * Action: Triggers the deletion logic for all user notifications.
   */
  const handleConfirmClearAll = async () => {
    try {
      await notificationsAPI.deleteAllNotifications();
      setNotifications([]);
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
                <RefreshIcon sx={{ fontSize: 20 }} />
                {t("refresh")}
              </button>
              {notifications.length > 0 && (
                <button className="btn-danger icon-btn" onClick={() => setShowConfirmModal(true)}>
                  <DeleteIcon sx={{ fontSize: 20 }} />
                  {t("clearAll")}
                </button>
              )}
            </div>
          </div>
          {loading ? (
            <div className="loading">{t("loading")}</div>
          ) : notifications.length === 0 ? (
            <div className="empty-state">
              <NotificationsOffIcon sx={{ fontSize: 48, opacity: 0.5 }} />
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
                    <div className="notification-icon-wrapper" style={{ color: iconColor }}>
                      {getNotificationIcon(notification)}
                    </div>
                    <div className="notification-content">
                      <p className="notification-message">
                        {notification.translations?.message?.[language] || notification.message}
                      </p>
                      <span className="notification-time">
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                    <button
                      className="notification-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification._id);
                      }}
                      title={t("deleteNotification")}
                    >
                      <DeleteIcon sx={{ fontSize: 20 }} />
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
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal confirm-dialog" onClick={(e) => e.stopPropagation()}>
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