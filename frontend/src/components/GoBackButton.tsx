import { useNavigate } from "react-router-dom";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { getTranslation } from "../utils/translations";

/**
 * @interface GoBackButtonProps
 * @description Props for the GoBackButton component.
 *
 * @property {string} [className] - Optional additional CSS classes to apply to the button
 * @property {React.MouseEventHandler<HTMLButtonElement>} [onClick] - Optional custom click handler.
 *   If provided, this will be called instead of the default navigate(-1) behavior.
 */

interface GoBackButtonProps {
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

/**
 * @file GoBackButton.tsx
 * @description Reusable button component that navigates to the previous page in browser history.
 * Displays an arrow back icon followed by a localized "Go Back" text.
 * Commonly used in detail pages and modals to provide easy navigation back.
 *
 * @component
 * @requires useNavigate - React Router hook for programmatic navigation
 * @requires useThemeLanguage - Context for accessing current language setting
 * @requires getTranslation - Utility function for getting translated strings
 */

const GoBackButton = ({ className = "", onClick: customOnClick }: GoBackButtonProps) => {
  const navigate = useNavigate();
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);

  /**
   * Handles button click by navigating one step back in browser history.
   * Uses navigate(-1) which is equivalent to history.back().
   * Falls back to home page if no history entry exists.
   * If a custom onClick prop is provided, it will be called instead.
   */
  const handleGoBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (customOnClick) {
      customOnClick(e);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleGoBack}
      className={`btn-back ${className}`}
      aria-label={t("goBack")}
    >
      <span className="material-icons">arrow_back</span>
      {t("goBack")}
    </button>
  );
};

export default GoBackButton;
