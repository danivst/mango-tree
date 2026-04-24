/**
 * @file LoginHeader.tsx
 * @description Login page header component featuring the application branding.
 * Provides a clickable logo and title that allows users to navigate back to the landing page.
 */

import React from 'react';

/**
 * @interface LoginHeaderProps
 * @description Props for the LoginHeader component.
 * * @property {(path: string) => void} onNavigate - Callback function to handle routing (typically via useNavigate from react-router-dom).
 */
interface LoginHeaderProps {
  onNavigate: (path: string) => void;
}

/**
 * @component LoginHeader
 * @description Renders the top branding section of the authentication pages.
 * The entire header acts as a navigation button for a seamless return to the root path.
 * * @param {LoginHeaderProps} props - Component props.
 * @returns {JSX.Element} The rendered login header section.
 */
const LoginHeader: React.FC<LoginHeaderProps> = ({ onNavigate }) => {
  return (
    <div className="login-header">
      <button
        onClick={() => onNavigate("/")}
        className="logo-button"
        type="button"
        aria-label="Navigate to landing page"
      >
        <img src="/mangotree-logo.png" alt="MangoTree Logo" className="logo-placeholder" />
        <h1 className="login-title">MangoTree</h1>
      </button>
    </div>
  );
};

export default LoginHeader;