/**
 * @file LoginHeader.tsx
 * @description Login page header with logo and title.
 * Clickable logo navigates back to home page.
 *
 * @component
 * @param {(path: string) => void} props.onNavigate - Navigation function
 * @returns {JSX.Element}
 */
import React from 'react';
import logo from '../../assets/mangotree-logo.png';

interface LoginHeaderProps {
  onNavigate: (path: string) => void;
}

const LoginHeader: React.FC<LoginHeaderProps> = ({ onNavigate }) => {
  return (
    <div className="login-header">
      <button
        onClick={() => onNavigate("/")}
        className="logo-button"
        type="button"
      >
        <img src={logo} alt="MangoTree" className="logo-placeholder" />
        <h1 className="login-title">MangoTree</h1>
      </button>
    </div>
  );
};

export default LoginHeader;
