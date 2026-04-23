/**
 * @file NotificationContext.tsx
 * @description React Context for managing user notification state across the application.
 * Handles fetching, caching, and updating unread notification counts in real-time.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Notification } from "../services/api";
import { notificationsAPI } from "../services/api";
import { useAuth } from "../utils/useAuth";

/**
 * @interface NotificationContextProps
 * @description Context API interface for notification management.
 * Provides unread count and utility functions for managing notification state.
 *
 * @property {number} unreadCount - Current count of unread notifications (number)
 * @property {() => Promise<void>} refreshUnreadCount - Manually refresh count from server
 * @property {() => Promise<void>} markAllAsRead - Mark all notifications as read on server (optimistic update)
 * @property {() => void} decrementUnreadCount - Decrement local count by 1 (for real-time updates without server call)
 * @property {() => void} clearUnreadCount - Reset count to 0 immediately (optimistic update)
 */

interface NotificationContextProps {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  decrementUnreadCount: () => void;
  clearUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

/**
 * @file NotificationContext.tsx
 * @description React Context for managing user notification state across the application.
 * Handles fetching, caching, and updating unread notification counts in real-time.
 *
 * Features:
 * - Auto-fetch unread count on mount for non-admin authenticated users
 * - Polling every 30 seconds to keep count current while app is open
 * - Window focus refresh listener (refetches when user returns to tab)
 * - Optimistic local updates: decrementUnreadCount and clearUnreadCount for immediate UI feedback
 * - Role-based gating: admins don't receive notifications (skip fetching)
 *
 * Performance:
 * - useCallback on fetchUnreadCount to prevent unnecessary re-renders
 * - Mounted flag prevents state updates after component unmounts
 * - All API calls are wrapped in try/catch for graceful degradation
 *
 * Integration:
 * - Used by UserSidebar to show unread badge
 * - Used by Notifications page to manage real-time state
 * - Other components can call decrementUnreadCount when a notification is actioned
 *
 * @component
 * @requires useCallback - Memoize fetchUnreadCount to prevent effect loops
 * @requires useEffect - Setup polling interval, window focus listener, and cleanup
 * @requires notificationsAPI - API service for fetching notifications and marking as read
 * @requires getToken / getUserRole - Auth utilities for determining if user should receive notifications
 */

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { isAuthenticated, user, loading } = useAuth();

  /**
   * Core fetch function for unread notification count.
   * Checks authentication and role before making API request.
   * Only non-admin users with valid authentication receive notifications.
   *
   * Flow:
   * 1. Check authentication status
   * 2. Check role (admin? skip)
   * 3. Fetch notifications from API
   * 4. Filter to unread and update state
   *
   * Errors are logged but do not throw to caller; fetchUnreadCount is also called by
   * refreshUnreadCount which handles its own error UI in parent components if needed.
   */
  const fetchUnreadCount = useCallback(async () => {
    // Only fetch if user is authenticated and is NOT an admin
    if (!isAuthenticated || loading || !user) {
      return;
    }
    if (user.role === 'admin') {
      // Admins don't need notifications, skip fetching entirely
      return;
    }
    try {
      const notifications = await notificationsAPI.getNotifications();
      const unread = notifications.filter((n: Notification) => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Failed to fetch unread notifications count:", error);
      // Keep previous count; don't set to zero on error
    }
  }, [isAuthenticated, loading, user]);

  /**
   * Public method to manually refresh the unread count.
   * Useful after actions that might affect notification count (e.g., marking a notification read, posting a comment that triggers a notification).
   */
  const refreshUnreadCount = async () => {
    await fetchUnreadCount();
  };

  /**
   * Marks all notifications as read on the server.
   * Uses optimistic update: immediately sets count to 0 for responsive UI.
   * If API call fails, refetches count to ensure consistency.
   */
  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setUnreadCount(0); // Immediately set to zero for instant feedback
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      // On error, refetch to get accurate count
      await fetchUnreadCount();
    }
  };

  /**
   * Decrements unread count by 1 without server roundtrip.
   * Used when a single notification is read/actioned (optimistic UI).
   * Guards against negative values using Math.max(0, ...).
   * Caller should ensure this accurately reflects server state eventually.
   *
   * Example: User clicks a notification in Notifications page → decrement count immediately.
   */
  const decrementUnreadCount = () => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  /**
   * Immediately clears unread count to zero.
   * Used when user views notifications page (clears badge) or dismisses all.
   * Optimistic update; may need a subsequent refetch to sync with actual server state.
   */
  const clearUnreadCount = () => {
    setUnreadCount(0);
  };

  /**
   * Effect: Setup polling and window focus listeners for automatic count updates.
   *
   * Behavior:
   * - Skip entirely for admin users (no notifications needed)
   * - Initial fetch on mount
   * - Set up 30-second polling interval
   * - Refetch when window regains focus (user returns to app)
   * - Cleanup: clear interval and remove event listener on unmount
   * - mounted flag prevents state updates after component has unmounted
   */
  useEffect(() => {
    // Skip polling entirely for admin users
    if (user?.role === 'admin') {
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

    // Polling every 10 seconds for faster updates
    const intervalId = setInterval(fetch, 10000);

    // Refresh on window focus (user switches back to app)
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

/**
 * Custom hook for consuming NotificationContext.
 * Ensures hook is used within NotificationProvider, throws error otherwise.
 *
 * @returns {NotificationContextProps} Context value with unreadCount and utility functions
 */
export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
};
