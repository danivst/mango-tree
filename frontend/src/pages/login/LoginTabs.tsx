/**
 * @file LoginTabs.tsx
 * @description Tab buttons for switching between Login and Signup forms.
 * Manages the visual state of tabs and synchronizes the active selection with the browser's URL path.
 */

import React from 'react';

/**
 * @interface LoginTabsProps
 * @description Props for the LoginTabs component.
 * * @property {'login' | 'signin'} activeTab - The currently selected authentication mode.
 * @property {(tab: 'login' | 'signin') => void} onTabChange - Callback to update the active tab state in the parent.
 * @property {(path: string, options?: { replace?: boolean }) => void} navigate - Navigation function to update the route.
 * @property {(key: string) => string} t - Translation function for localized button labels.
 */
interface LoginTabsProps {
  activeTab: 'login' | 'signin';
  onTabChange: (tab: 'login' | 'signin') => void;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  t: (key: string) => string;
}

/**
 * @component LoginTabs
 * @description Renders a tabbed interface to switch between login and registration views.
 * Each tab click updates the internal state and performs a route replacement to maintain a clean history.
 * * @param {LoginTabsProps} props - Component props.
 * @returns {JSX.Element} The rendered tab buttons container.
 */
const LoginTabs: React.FC<LoginTabsProps> = ({
  activeTab,
  onTabChange,
  navigate,
  t
}) => {
  /**
   * Internal handler for tab clicks.
   * Updates the parent state and synchronizes the browser URL path.
   * * @param {'login' | 'signin'} tab - The target tab to switch to.
   */
  const handleTabClick = (tab: 'login' | 'signin') => {
    onTabChange(tab);
    const path = tab === 'login' ? '/login' : '/signin';
    navigate(path, { replace: true });
  };

  return (
    <div className="tabs-container">
      {/* Login Tab Button */}
      <button
        type="button"
        className={`login-tab-button ${activeTab === "login" ? "login-tab-active" : ""}`}
        onClick={() => handleTabClick("login")}
        role="tab"
        aria-selected={activeTab === "login"}
      >
        {t("login")}
      </button>

      {/* Signin (Register) Tab Button */}
      <button
        type="button"
        className={`login-tab-button ${activeTab === "signin" ? "login-tab-active" : ""}`}
        onClick={() => handleTabClick("signin")}
        role="tab"
        aria-selected={activeTab === "signin"}
      >
        {t("signin")}
      </button>
    </div>
  );
};

export default LoginTabs;