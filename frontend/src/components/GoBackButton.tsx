import { useNavigate, useNavigationType } from "react-router-dom";
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
 * Special behavior for "share pages" (posts, profiles, account):
 * - If user arrived via direct navigation or external link (navigation type = POP), redirects to /home
 * - If user arrived via in-app navigation (PUSH or REPLACE), uses normal browser back
 *
 * @component
 * @requires useNavigate - React Router hook for programmatic navigation
 * @requires useNavigationType - React Router hook to detect how user arrived (PUSH, POP, REPLACE)
 * @requires useThemeLanguage - Context for accessing current language setting
 * @requires getTranslation - Utility function for getting translated strings
 */

const GoBackButton = ({ className = "", onClick: customOnClick }: GoBackButtonProps) => {
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);

  /**
   * Handles button click with smart navigation:
   * - If custom onClick provided, use it
   * - If current page is a "share page" (post, profile, account) AND the navigation type is POP
   *   (direct/ external), redirect to /home instead of going back.
   * - Otherwise, use browser back (navigate(-1))
   *
   * Share pages: /posts/:id, /users/:id, /account, /account/followers, /account/following
   *
   * Navigation types:
   * - PUSH: Arrived via in-app navigation (Link click, navigate())
   * - REPLACE: Arrived via redirect (still considered in-app)
   * - POP: Arrived via browser back/forward, direct URL entry, bookmark, or external link
   *
   * This ensures that when users click a shared link to a post/profile, the "Go Back"
   * button takes them to /home rather than back to the external site or blank page.
   */
  const handleGoBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (customOnClick) {
      customOnClick(e);
      return;
    }

    const path = window.location.pathname;
    const isSharePage =
      /^\/posts\/[^\/]+$/.test(path) ||
      /^\/users\/[^\/]+$/.test(path) ||
      /^\/account(\/|$)/.test(path);

    if (isSharePage) {
      // If navigation type is POP, it means direct/external navigation
      if (navigationType === "POP") {
        navigate("/home");
        return;
      }
    }

    // Default: go back in history
    navigate(-1);
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
