/**
 * @file LoginTabs.tsx
 * @description Tab buttons for switching between Login and Signup forms.
 *
 * @component
 * @param {'login' | 'signin'} props.activeTab - Currently active tab
 * @param {(tab: 'login' | 'signin') => void} props.onTabChange - Handler for tab switching
 * @param {(path: string, options?: { replace?: boolean }) => void} props.navigate - Navigation function
 * @param {(key: string) => string} props.t - Translation function
 * @returns {JSX.Element}
 */
import React from 'react';

interface LoginTabsProps {
  activeTab: 'login' | 'signin';
  onTabChange: (tab: 'login' | 'signin') => void;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  t: (key: string) => string;
}

const LoginTabs: React.FC<LoginTabsProps> = ({
  activeTab,
  onTabChange,
  navigate,
  t
}) => {
  const handleTabClick = (tab: 'login' | 'signin') => {
    onTabChange(tab);
    const path = tab === 'login' ? '/login' : '/signin';
    navigate(path, { replace: true });
  };

  return (
    <div className="tabs-container">
      <button
        type="button"
        className={`login-tab-button ${activeTab === "login" ? "login-tab-active" : ""}`}
        onClick={() => handleTabClick("login")}
      >
        {t("login")}
      </button>
      <button
        type="button"
        className={`login-tab-button ${activeTab === "signin" ? "login-tab-active" : ""}`}
        onClick={() => handleTabClick("signin")}
      >
        {t("signin")}
      </button>
    </div>
  );
};

export default LoginTabs;
