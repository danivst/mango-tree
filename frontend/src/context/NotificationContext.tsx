import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Notification } from "../services/api";
import { notificationsAPI } from "../services/api";
import { getToken, getUserRole } from "../utils/auth";

interface NotificationContextProps {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  decrementUnreadCount: () => void;
  clearUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchUnreadCount = useCallback(async () => {
    // Only fetch if user is authenticated (has token) and is NOT an admin
    if (!getToken()) {
      return;
    }
    const role = getUserRole();
    if (role === 'admin') {
      // Admins don't need notifications, skip fetching
      return;
    }
    try {
      const notifications = await notificationsAPI.getNotifications();
      const unread = notifications.filter((n: Notification) => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Failed to fetch unread notifications count:", error);
    }
  }, []);

  const refreshUnreadCount = async () => {
    await fetchUnreadCount();
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setUnreadCount(0); // Immediately set to zero
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      // Still refresh to get accurate count even if API fails
      await fetchUnreadCount();
    }
  };

  const decrementUnreadCount = () => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const clearUnreadCount = () => {
    setUnreadCount(0);
  };

  useEffect(() => {
    // Skip polling entirely for admin users
    const role = getUserRole();
    if (role === 'admin') {
      return;
    }

    let mounted = true;

    const fetch = async () => {
      if (mounted) {
        await fetchUnreadCount();
      }
    };

    // Initial fetch
    fetch();

    // Polling every 30 seconds
    const intervalId = setInterval(fetch, 30000);

    // Refresh on window focus
    const handleFocus = () => {
      fetch();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      mounted = false;
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchUnreadCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount, markAllAsRead, decrementUnreadCount, clearUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
};
