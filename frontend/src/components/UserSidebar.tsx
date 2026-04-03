import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { useNotifications } from "../context/NotificationContext";
import { getTranslation } from "../utils/translations";
import "./UserSidebar.css";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Snackbar from "./Snackbar";
import logo from "../assets/mangotree-logo.png";
import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import UploadIcon from "@mui/icons-material/Upload";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

/**
 * @interface SidebarItem
 * @description Interface defining a navigation item in the user sidebar menu.
 * Used to configure navigation routes with labels, icons, and paths.
 *
 * @property {string} id - Unique identifier for the menu item (used for active state tracking and localStorage persistence)
 * @property {string} label - Display text for the menu item (localized via translation function)
 * @property {JSX.Element} icon - Material UI icon component to display next to label
 * @property {string} path - Route path to navigate to when clicked (react-router-dom compatible)
 */

interface SidebarItem {
  id: string;
  label: string;
  icon: JSX.Element;
  path: string;
}

/**
 * @file UserSidebar.tsx
 * @description Main navigation sidebar for regular (non-admin) authenticated users.
 * Collapsible sidebar with responsive mobile support, providing access to all core user features.
 *
 * Features:
 * - Collapsible/expandable sidebar (desktop toggle, mobile auto-collapse)
 * - Responsive design (auto-collapses on viewport < 768px)
 * - Active route detection with visual highlighting
 * - localStorage persistence for collapsed state and last manually clicked menu item
 * - Theme-aware styling (includes mango theme variant with special gradient)
 * - Unread notifications badge (integrated with NotificationContext)
 * - Logout button with success snackbar feedback
 *
 * Navigation Items (in order):
 * - Home: Main feed (followed + suggested posts)
 * - Search: Search posts and users
 * - Upload: Create new post with image upload
 * - Notifications: View and manage notifications (with unread count badge)
 * - Account: User profile and personal posts
 * - Settings: Account and app settings
 *
 * UX Details:
 * - When collapsed (desktop), icons only; tooltip shows label
 * - On mobile, sidebar is drawer-style with overlay
 * - "Last active item" fallback: if no route matches (e.g., viewing another user's profile), highlights the last clicked menu item
 *
 * @component
 * @requires useState - Multiple: isCollapsed, isMobile, lastActiveItemId, snackbar
 * @requires useEffect - Resize listener, mobile state sync
 * @requires useNavigate - React Router navigation hook for programmatic routing
 * @requires useLocation - React Router location hook for active route matching
 * @requires useThemeLanguage - Context for current language and theme (affects styling)
 * @requires useNotifications - Context for unreadCount (badge on notifications icon)
 * @requires getTranslation - Localization utility for menu labels and button text
 * @requires Snackbar - Toast component for logout success feedback
 */

const UserSidebar = () => {
  /**
   * Handles user logout process.
   * Clears all authentication tokens from localStorage, shows success snackbar,
   * then redirects to login page after a short delay.
   */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("tokenExpiration");
    localStorage.removeItem("lastActiveMenuItem");
    setSnackbar({
      open: true,
      message: t("successfullyLoggedOut"),
      type: "success",
    });
    setTimeout(() => {
      navigate("/login");
    }, 1500);
  };

  const navigate = useNavigate();
  const location = useLocation();
  const { language, theme } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);

  /**
   * State: sidebar collapsed/expanded.
   * On mobile: defaults to collapsed (60px wide, side-by-side with content)
   * On desktop: defaults to expanded (full width)
   */
  const [isCollapsed, setIsCollapsed] = useState(() => window.innerWidth < 768);

  /**
   * State: whether current viewport is considered mobile (< 768px width).
   * Initialized from window.innerWidth on first render.
   * Triggers auto-collapse when true.
   */
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  /**
   * Ref: reference to the sidebar DOM element for measuring its width
   */
  const sidebarRef = useRef<HTMLDivElement>(null);

  /**
   * State: the last menu item the user manually clicked.
   * Persisted to localStorage so that after page reload, the active state can be restored
   * even if the current route doesn't match any menu item (e.g., viewing another user's profile).
   */
  const [lastActiveItemId, setLastActiveItemId] = useState<string | null>(() => {
    // Lazy initializer reads from localStorage only once on mount
    return localStorage.getItem("lastActiveMenuItem");
  });

  /**
   * State: controls snackbar notifications.
   * Used primarily for logout confirmation; could be extended for other user feedback.
   */
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: "success" | "error";
  }>({ open: false, message: "", type: "success" });

  /**
   * Get unread notification count from NotificationContext.
   * Used to display a numeric badge on the notifications icon when > 0.
   */
  const { unreadCount } = useNotifications();

  /**
   * User navigation menu configuration.
   * Icons are Material UI components; labels are translated using the `t` function.
   * Notifications item includes a badge overlay showing unreadCount.
   */
  const menuItems: SidebarItem[] = [
    {
      id: "home",
      label: t("home"),
      icon: <HomeIcon />,
      path: "/home",
    },
    {
      id: "search",
      label: t("search"),
      icon: <SearchIcon />,
      path: "/search",
    },
    {
      id: "upload",
      label: t("upload"),
      icon: <UploadIcon />,
      path: "/upload",
    },
    {
      id: "notifications",
      label: t("notifications"),
      icon: (
        <span className="notifications-icon-wrapper">
          <NotificationsIcon />
          {unreadCount > 0 && (
            <span className="notification-badge">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </span>
      ),
      path: "/notifications",
    },
    {
      id: "account",
      label: t("account"),
      icon: <AccountCircleIcon />,
      path: "/account",
    },
    {
      id: "settings",
      label: t("settings"),
      icon: <SettingsIcon />,
      path: "/settings",
    },
  ];

  /**
   * Effect: Listen for window resize events to detect mobile breakpoint.
   * When viewport becomes < 768px, sets isMobile true and auto-collapses sidebar.
   */
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /**
   * Effect: Ensure sidebar is collapsed on mobile and expanded on desktop.
   */
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [isMobile]);

  /* ==========================================
     SIDEBAR OFFSET CALCULATION
     ========================================== */

  /**
   * Computes the target sidebar width for a given state and viewport width.
   * Uses the same breakpoints as CSS media queries.
   */
  const getSidebarTargetWidth = (collapsed: boolean, windowWidth: number): number => {
    // Mobile (handled separately, but return values for completeness)
    if (windowWidth < 768) {
      return collapsed ? 60 : 0; // expanded mobile not used for offset
    }
    // Tablet: 768px - 1023px
    if (windowWidth < 1024) {
      return collapsed ? 70 : 260;
    }
    // Laptop: 1024px - 1279px
    if (windowWidth < 1280) {
      return collapsed ? 80 : 240;
    }
    // Large Desktop: 1280px - 1439px
    if (windowWidth < 1440) {
      return collapsed ? 80 : 300;
    }
    // X-Large Desktop: >= 1440px
    return collapsed ? 80 : 280;
  };

  /**
   * Effect: Update CSS custom property for sidebar offset.
   * On mobile expanded: offset = 0 (overlay)
   * All other states: offset = left + targetWidth + gap
   * Uses target width (not current offsetWidth) to avoid transition timing bugs.
   */
  useLayoutEffect(() => {
    const updateSidebarOffset = () => {
      if (!sidebarRef.current) {
        document.documentElement.style.removeProperty('--sidebar-offset');
        return;
      }

      // Mobile expanded: full overlay, no offset
      if (isMobile && !isCollapsed) {
        document.documentElement.style.setProperty('--sidebar-offset', '0px');
        return;
      }

      const windowWidth = window.innerWidth;
      const sidebarLeft = parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('--sidebar-left')) || 0;
      const gap = parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('--sidebar-gap')) || 0;
      const targetWidth = getSidebarTargetWidth(isCollapsed, windowWidth);
      const offset = sidebarLeft + targetWidth + gap;
      document.documentElement.style.setProperty('--sidebar-offset', `${offset}px`);
    };

    const rafId = requestAnimationFrame(updateSidebarOffset);
    return () => {
      cancelAnimationFrame(rafId);
      document.documentElement.style.removeProperty('--sidebar-offset');
    };
  }, [isMobile, isCollapsed]);

  /**
   * Effect: Listen for window resize to update the offset.
   * Handles sidebar width changes from CSS media queries.
   */
  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(() => {
        const mobile = window.innerWidth < 768;
        if (mobile && !isCollapsed) {
          document.documentElement.style.setProperty('--sidebar-offset', '0px');
        } else {
          const windowWidth = window.innerWidth;
          const sidebarLeft = parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('--sidebar-left')) || 0;
          const gap = parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('--sidebar-gap')) || 0;
          const targetWidth = getSidebarTargetWidth(isCollapsed, windowWidth);
          const offset = sidebarLeft + targetWidth + gap;
          document.documentElement.style.setProperty('--sidebar-offset', `${offset}px`);
        }
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCollapsed]);

  /**
   * Handles click on a menu item.
   * Saves the item's ID to localStorage (for active state persistence across reloads),
   * updates the lastActiveItemId state, navigates to the item's path,
   * and collapses the sidebar if on mobile.
   *
   * @param {SidebarItem} item - The clicked navigation item containing id, path, etc.
   */
  const handleItemClick = (item: SidebarItem) => {
    localStorage.setItem("lastActiveMenuItem", item.id);
    setLastActiveItemId(item.id);
    navigate(item.path);
    if (isMobile) {
      setIsCollapsed(true);
    }
  };

  /**
   * Determines which menu item should be marked as active based on current route.
   * Active item drives visual highlighting (different background/color).
   *
   * Matching logic:
   * - Home route: active for "/home" and any "/home/*" subpaths (like /home/suggested)
   * - Other routes: exact match or prefix match (e.g., /upload matches upload)
   * - Fallback: if no route matches, use lastActiveItemId (e.g., when viewing a user profile outside sidebar routes)
   *
   * @returns {SidebarItem | undefined} The active menu item, if any
   */
  let activeItem: SidebarItem | undefined;

  // Special handling: home route should be active on both /home and /home/suggested
  if (location.pathname === "/home" || location.pathname.startsWith("/home/")) {
    activeItem = menuItems.find(item => item.id === "home");
  } else {
    // General matching for other routes
    activeItem = menuItems.find((item) => {
      if (location.pathname === item.path) return true;
      if (location.pathname.startsWith(item.path + '/')) return true;
      return false;
    });
  }

  // Fallback to last manually clicked item if no route match (e.g., /users/:id pages)
  if (!activeItem && lastActiveItemId) {
    activeItem = menuItems.find((item) => item.id === lastActiveItemId);
  }

  // Debug logging to help troubleshoot active item detection (can be removed in production)
  console.log("[UserSidebar] pathname:", location.pathname, "activeItem:", activeItem?.id, "lastActiveItemId:", lastActiveItemId);

  return (
    <>
      {/* Mobile overlay: when sidebar is open on mobile, clicking overlay closes it */}
      {isMobile && !isCollapsed && (
        <div className="sidebar-overlay" onClick={() => setIsCollapsed(true)} />
      )}
      <div
        ref={sidebarRef}
        className={`sidebar ${isCollapsed ? "collapsed" : ""} ${isMobile ? "mobile" : ""} ${theme === 'mango' ? 'mango-theme' : ''}`}
      >
        <div className="sidebar-header">
          {/* Collapsed state hides logo/title; expanded shows them */}
          {!isCollapsed && (
            <>
              <div className="sidebar-logo">
                <img src={logo} alt="MangoTree" className="logo-placeholder" />
                <h2 className="sidebar-title">MangoTree</h2>
              </div>
              <div className="sidebar-divider"></div>
            </>
          )}
          {/* Mobile close button appears when sidebar is expanded on mobile */}
          {isMobile && !isCollapsed && (
            <button
              className="sidebar-close"
              onClick={() => setIsCollapsed(true)}
              aria-label="Close sidebar"
            >
              <CloseIcon />
            </button>
          )}
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-item ${activeItem?.id === item.id ? "active" : ""}`}
              onClick={() => handleItemClick(item)}
              title={isCollapsed ? item.label : undefined} // Tooltip when collapsed
            >
              <span className="sidebar-icon">{item.icon}</span>
              {!isCollapsed && (
                <span className="sidebar-label">{item.label}</span>
              )}
            </button>
          ))}
        </nav>
        {/* Logout button at bottom of sidebar */}
        <button
          className="sidebar-logout"
          onClick={handleLogout}
          title={isCollapsed ? t("logout") : undefined}
        >
          <span className="sidebar-icon">
            <LogoutIcon />
          </span>
          {!isCollapsed && (
            <span className="sidebar-logout-text">{t("logout")}</span>
          )}
        </button>
        {/* Mobile expand button: visible when sidebar is collapsed on mobile */}
        {isMobile && isCollapsed && (
          <button
            className="sidebar-expand"
            onClick={() => setIsCollapsed(false)}
            aria-label="Expand sidebar"
          >
            <MenuIcon />
          </button>
        )}
      </div>
      {/* Snackbar for logout success feedback */}
      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </>
  );
};

export default UserSidebar;
