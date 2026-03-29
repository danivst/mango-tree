import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { useNotifications } from "../context/NotificationContext";
import { getTranslation } from "../utils/translations";
import "./AdminSidebar.css";
import { useState, useEffect } from "react";
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

interface SidebarItem {
  id: string;
  label: string;
  icon: JSX.Element;
  path: string;
}

const UserSidebar = () => {
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

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [lastActiveItemId, setLastActiveItemId] = useState<string | null>(() => {
    // On initial load, check if there's a saved active item
    return localStorage.getItem("lastActiveMenuItem");
  });

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: "success" | "error";
  }>({ open: false, message: "", type: "success" });

  const { unreadCount } = useNotifications();

  const menuItems: SidebarItem[] = [
    {
      id: "home",
      label: t("home"),
      icon: <HomeIcon style={{ fontSize: 20 }} />,
      path: "/home",
    },
    {
      id: "search",
      label: t("search"),
      icon: <SearchIcon style={{ fontSize: 20 }} />,
      path: "/search",
    },
    {
      id: "upload",
      label: t("upload"),
      icon: <UploadIcon style={{ fontSize: 20 }} />,
      path: "/upload",
    },
    {
      id: "notifications",
      label: t("notifications"),
      icon: (
        <span style={{ position: "relative" }}>
          <NotificationsIcon style={{ fontSize: 20 }} />
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -6,
                right: -8,
                backgroundColor: "#f44336",
                color: "white",
                borderRadius: "50%",
                minWidth: "18px",
                height: "18px",
                fontSize: "11px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "2px",
                border: "2px solid var(--theme-bg, #ffffff)",
              }}
            >
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
      icon: <AccountCircleIcon style={{ fontSize: 20 }} />,
      path: "/account",
    },
    {
      id: "settings",
      label: t("settings"),
      icon: <SettingsIcon style={{ fontSize: 20 }} />,
      path: "/settings",
    },
  ];

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

  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
    }
  }, [isMobile]);

  const handleItemClick = (item: SidebarItem) => {
    // Save the clicked item as last active
    localStorage.setItem("lastActiveMenuItem", item.id);
    setLastActiveItemId(item.id);
    navigate(item.path);
    if (isMobile) {
      setIsCollapsed(true);
    }
  };

  // Determine active item: prioritize exact matches including home route
  let activeItem: SidebarItem | undefined;

  // Special handling for home route to ensure it's always active on /home and /home/suggested
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

  // If still no match, fall back to last active item (e.g., when viewing a user profile)
  if (!activeItem && lastActiveItemId) {
    activeItem = menuItems.find((item) => item.id === lastActiveItemId);
  }

  // Debug: log to help troubleshoot active item detection
  console.log("[UserSidebar] pathname:", location.pathname, "activeItem:", activeItem?.id, "lastActiveItemId:", lastActiveItemId);

  return (
    <>
      {isMobile && !isCollapsed && (
        <div className="sidebar-overlay" onClick={() => setIsCollapsed(true)} />
      )}
      <div
        className={`admin-sidebar ${isCollapsed ? "collapsed" : ""} ${isMobile ? "mobile" : ""} ${theme === 'mango' ? 'mango-theme' : ''}`}
      >
        <div className="sidebar-header">
          {!isCollapsed && (
            <>
              <div className="sidebar-logo">
                <img src={logo} alt="MangoTree" className="logo-placeholder" />
                <h2 className="sidebar-title">MangoTree</h2>
              </div>
              <div className="sidebar-divider"></div>
            </>
          )}
          {isMobile && !isCollapsed && (
            <button
              className="sidebar-close"
              onClick={() => setIsCollapsed(true)}
              aria-label="Close sidebar"
            >
              <CloseIcon style={{ fontSize: 24 }} />
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
            <LogoutIcon style={{ fontSize: 20 }} />
          </span>
          {!isCollapsed && (
            <span style={{ color: "#A50104" }}>{t("logout")}</span>
          )}
        </button>
        {isMobile && isCollapsed && (
          <button
            className="sidebar-expand"
            onClick={() => setIsCollapsed(false)}
            aria-label="Expand sidebar"
          >
            <MenuIcon style={{ fontSize: 24 }} />
          </button>
        )}
      </div>
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