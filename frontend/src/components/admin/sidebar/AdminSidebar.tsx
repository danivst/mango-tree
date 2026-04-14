/**
 * @file AdminSidebar.tsx
 * @description Main navigation sidebar for admin users.
 * Collapsible sidebar with responsive mobile support and theme awareness.
 * Provides navigation to all admin dashboard pages and logout functionality.
 */

import { useThemeLanguage } from "../../../context/ThemeLanguageContext";
import { getTranslation } from "../../../utils/translations";
import { useSnackbar } from "../../../utils/snackbar";
import { useRefresh } from "../../../context/RefreshContext";
import { authAPI } from "../../../services/api";
import { clearAuth } from "../../../utils/auth";

import "./AdminSidebar.css";
import logo from "../../../../public/mangotree-logo.png";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Snackbar from "../../snackbar/Snackbar";

// MUI Icon Imports
import SettingsIcon from "@mui/icons-material/Settings";
import HistoryIcon from "@mui/icons-material/History";
import AssignmentIcon from "@mui/icons-material/Assignment";
import FlagIcon from "@mui/icons-material/Flag";
import PeopleIcon from "@mui/icons-material/People";
import SecurityIcon from "@mui/icons-material/Security";
import BlockIcon from "@mui/icons-material/Block";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import CategoryIcon from "@mui/icons-material/Category";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

/**
 * @interface TokenPayload
 * @description Type definition for decoded JWT token payload.
 * Defines the expected structure of authentication tokens issued by the backend.
 *
 * @property {string} userId - Unique user identifier
 * @property {string} username - Username (may be optional depending on token version)
 * @property {string} role - User role (e.g., "admin", "user")
 * @property {number} exp - Token expiration timestamp (Unix epoch seconds)
 * @property {number} iat - Token issued-at timestamp (Unix epoch seconds)
 */
interface TokenPayload {
  userId: string;
  username?: string;
  role: string;
  exp: number;
  iat: number;
}

/**
 * @interface SidebarItem
 * @description Interface defining a navigation item in the admin sidebar menu.
 * Used to configure admin navigation routes with labels and icons.
 *
 * @property {string} id - Unique identifier for the menu item (used for active state tracking)
 * @property {string} label - Display text for the menu item (localized)
 * @property {JSX.Element} icon - React element (Material UI icon) to display
 * @property {string} path - Route path to navigate to when clicked
 */
interface SidebarItem {
  id: string;
  label: string;
  icon: JSX.Element;
  path: string;
}

/**
 * AdminSidebar component logic and structure.
 *
 * Features:
 * - Collapsible/expandable sidebar (desktop and mobile)
 * - Responsive design (auto-collapses on viewports < 768px)
 * - Active route detection with highlighting
 * - Username display from JWT token or API fallback
 * - Mango theme support with special gradient styling
 * - Mobile overlay and close button
 * - Logout with confirmation snackbar
 *
 * @component
 * @requires useState - React hook for sidebar state (collapsed, mobile, username, snackbar)
 * @requires useEffect - React hook for initializing username, resize listener
 * @requires useNavigate - React Router navigation hook
 * @requires useLocation - React Router location hook for active route detection
 * @requires useThemeLanguage - Context for language and theme settings
 * @requires jwtDecode - Library for decoding JWT tokens without verification
 * @requires Snackbar - Toast notification component for logout feedback
 * @requires SettingsIcon - Material UI icon for settings menu item
 */
const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, theme } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);
  const { triggerRefresh } = useRefresh();

  /**
   * State: controls sidebar collapsed/expanded state.
   * On mobile: defaults to collapsed (60px wide, side-by-side with content)
   * On desktop: defaults to expanded (280px wide)
   */
  const [isCollapsed, setIsCollapsed] = useState(() => window.innerWidth < 768);

  /**
   * State: tracks if current viewport is mobile size (< 768px width)
   * Initialized based on current window.innerWidth
   * Triggers auto-collapse when true
   */
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  /**
   * Ref: reference to the sidebar DOM element for measuring its width
   */
  const sidebarRef = useRef<HTMLDivElement>(null);

  /**
   * State: admin username displayed in sidebar header
   * Initially empty; populated from JWT token or fetched via API if token lacks username
   */
  const [username, setUsername] = useState<string>("");

  /**
   * Hook: manage snackbar notifications using centralized hook
   */
  const { snackbar, showSuccess, closeSnackbar } = useSnackbar();

  /**
   * Effect: On mount, extract username from JWT token.
   * If username is not in token, fetch user info from API.
   */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode<TokenPayload>(token);
        if (decoded.username) {
          setUsername(decoded.username);
        } else {
          // Username not in token, fetch from API
          fetchUserInfo();
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error decoding token:", error);
        }
      }
    }
  }, []);

  /**
   * Fetches current user's info from /users/me endpoint.
   * Used when username is not available in the JWT token.
   */
  const fetchUserInfo = async () => {
    try {
      const api = (await import("../../../services/api")).default;
      const response = await api.get("/users/me");
      if (response.data && response.data.username) {
        setUsername(response.data.username);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error decoding token:", error);
      }
    }
  };

  /**
   * Computes the target sidebar width for a given state and viewport width.
   * Uses the same breakpoints as CSS media queries.
   */
  const getSidebarTargetWidth = (
    collapsed: boolean,
    windowWidth: number,
  ): number => {
    // Mobile (handled separately, but return values for completeness)
    if (windowWidth < 768) {
      return collapsed ? 60 : 0; // expanded mobile not used for offset
    }
    // Tablet: 768px - 1023px
    if (windowWidth < 1024) {
      return collapsed ? 70 : 280;
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
   * Effect: Listen for window resize events to detect mobile viewport.
   * Auto-collapses sidebar on mobile screens (<768px).
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
   * Effect: Update CSS custom property for sidebar offset.
   * Computes offset based on sidebar position and width.
   * On mobile expanded: offset = 0 (full overlay)
   * On all other cases: offset = sidebarLeft + sidebarWidth + gap
   * Uses useLayoutEffect to set before paint.
   */
  useLayoutEffect(() => {
    const updateSidebarOffset = () => {
      if (!sidebarRef.current) {
        document.documentElement.style.removeProperty("--sidebar-offset");
        return;
      }

      // Mobile expanded: full overlay, offset 0
      if (isMobile && !isCollapsed) {
        document.documentElement.style.setProperty("--sidebar-offset", "0px");
        return;
      }

      const windowWidth = window.innerWidth;
      const sidebarLeft =
        parseInt(
          window
            .getComputedStyle(document.documentElement)
            .getPropertyValue("--sidebar-left"),
        ) || 0;
      const gap =
        parseInt(
          window
            .getComputedStyle(document.documentElement)
            .getPropertyValue("--sidebar-gap"),
        ) || 0;
      const targetWidth = getSidebarTargetWidth(isCollapsed, windowWidth);
      const offset = sidebarLeft + targetWidth + gap;
      document.documentElement.style.setProperty(
        "--sidebar-offset",
        `${offset}px`,
      );
    };

    const rafId = requestAnimationFrame(updateSidebarOffset);
    return () => {
      cancelAnimationFrame(rafId);
      document.documentElement.style.removeProperty("--sidebar-offset");
    };
  }, [isMobile, isCollapsed]);

  /**
   * Effect: Listen for window resize to update the offset.
   * Handles sidebar width changes due to CSS media queries.
   */
  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(() => {
        const mobile = window.innerWidth < 768;
        if (mobile && !isCollapsed) {
          document.documentElement.style.setProperty("--sidebar-offset", "0px");
        } else {
          const windowWidth = window.innerWidth;
          const sidebarLeft =
            parseInt(
              window
                .getComputedStyle(document.documentElement)
                .getPropertyValue("--sidebar-left"),
            ) || 0;
          const gap =
            parseInt(
              window
                .getComputedStyle(document.documentElement)
                .getPropertyValue("--sidebar-gap"),
            ) || 0;
          const targetWidth = getSidebarTargetWidth(isCollapsed, windowWidth);
          const offset = sidebarLeft + targetWidth + gap;
          document.documentElement.style.setProperty(
            "--sidebar-offset",
            `${offset}px`,
          );
        }
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isCollapsed]);

  /**
   * Admin navigation menu configuration.
   * Labels are translated using the translation function.
   * Icons are Material UI icons.
   */
  const menuItems: SidebarItem[] = [
    {
      id: "review",
      label: t("toReview"),
      icon: <AssignmentIcon fontSize="small" />,
      path: "/admin/dashboard/review",
    },
    {
      id: "reports",
      label: t("reports"),
      icon: <FlagIcon fontSize="small" />,
      path: "/admin/dashboard/reports",
    },
    {
      id: "logs",
      label: t("activityLog"),
      icon: <HistoryIcon fontSize="small" />,
      path: "/admin/dashboard/logs",
    },
    {
      id: "users",
      label: t("users"),
      icon: <PeopleIcon fontSize="small" />,
      path: "/admin/dashboard/users",
    },
    {
      id: "admins",
      label: t("admins"),
      icon: <SecurityIcon fontSize="small" />,
      path: "/admin/dashboard/admins",
    },
    {
      id: "banned-users",
      label: t("bannedUsers"),
      icon: <BlockIcon fontSize="small" />,
      path: "/admin/dashboard/banned-users",
    },
    {
      id: "tags",
      label: t("tags"),
      icon: <LocalOfferIcon fontSize="small" />,
      path: "/admin/dashboard/tags",
    },
    {
      id: "categories",
      label: t("categories"),
      icon: <CategoryIcon fontSize="small" />,
      path: "/admin/dashboard/categories",
    },
    {
      id: "settings",
      label: t("settings"),
      icon: <SettingsIcon fontSize="small" />,
      path: "/admin/dashboard/settings",
    },
  ];

  /**
   * Handles click on a navigation menu item.
   * Saves the item as last active (for state persistence), updates state, and navigates.
   * On mobile, collapses the sidebar after navigation.
   * If clicking the current page, triggers a content refresh via the refresh context.
   *
   * @param {SidebarItem} item - The clicked navigation item
   */
  const handleItemClick = (item: SidebarItem) => {
    localStorage.setItem("lastActiveMenuItem", item.id);
    // Always trigger refresh before navigation to ensure fresh content
    triggerRefresh();
    navigate(item.path);
    if (isMobile) {
      setIsCollapsed(true);
    }
  };

  /**
   * Handles admin logout.
   * Calls backend logout endpoint to record activity, clears auth data,
   * shows success snackbar, then redirects to login after a short delay.
   */
  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Logout API call failed:", error);
      }
    } finally {
      clearAuth();
      showSuccess(t("successfullyLoggedOut"));
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    }
  };

  // Determine which menu item is currently active based on route
  const activeItem = menuItems.find((item) =>
    location.pathname.startsWith(item.path),
  );

  return (
    <>
      {isMobile && !isCollapsed && (
        <div className="sidebar-overlay" onClick={() => setIsCollapsed(true)} />
      )}
      <div
        ref={sidebarRef}
        className={`sidebar ${isCollapsed ? "collapsed" : ""} ${isMobile ? "mobile" : ""} ${theme === "mango" ? "mango-theme" : ""}`}
      >
        <div className="sidebar-header">
          {!isCollapsed && (
            <>
              <div className="sidebar-logo">
                <img src={logo} alt="MangoTree" className="logo-placeholder" />
                <h2 className="sidebar-title">MangoTree</h2>
              </div>
              {username && (
                <div className="sidebar-greeting">
                  {t("hi")}, {username}
                </div>
              )}
              <div className="sidebar-divider"></div>
            </>
          )}
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
              title={isCollapsed ? item.label : undefined}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {!isCollapsed && (
                <span className="sidebar-label">{item.label}</span>
              )}
            </button>
          ))}
        </nav>
        <button
          className="sidebar-logout"
          onClick={handleLogout}
          title={isCollapsed ? t("logout") : undefined}
        >
          <span className="sidebar-icon">
            <LogoutIcon fontSize="small" />
          </span>
          {!isCollapsed && <span>{t("logout")}</span>}
        </button>
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
      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={closeSnackbar}
      />
    </>
  );
};

export default AdminSidebar;