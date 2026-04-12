/**
 * @file UserRoute.tsx
 * @description Route wrapper that ensures only non-admin users can access content.
 * Redirects admin users to appropriate admin pages or 404 for share pages.
 * Used to protect regular user routes (like /settings) from admin users.
 *
 * Routing Logic:
 * - If user role is "admin":
 * - If path is a "share page" (post, profile, account, followers, following) → redirect to 404
 * - If path is /settings → redirect to /admin/dashboard/admin-settings
 * - Otherwise → redirect to /admin/dashboard
 * - If user is not admin → render child components normally
 */

import { Navigate, useLocation } from "react-router-dom";
import { getUserRole } from "../../../utils/auth";

/**
 * @interface UserRouteProps
 * @description Props for the UserRoute wrapper component.
 *
 * @property {React.ReactNode} children - Child components to render for non-admin users
 */
interface UserRouteProps {
  children: React.ReactNode;
}

/**
 * @component UserRoute
 * @description Protects user-specific routes from admin access.
 * Share pages are public-facing pages that users might share links to. Admins should
 * not access these directly; they should use the admin interface for moderation tasks.
 *
 * @requires getUserRole - Utility to get current user's role from decoded JWT token
 * @requires Navigate - React Router navigation component for redirects
 * @requires useLocation - React Router hook to determine current pathname
 */
const UserRoute = ({ children }: UserRouteProps) => {
  const location = useLocation();
  const role = getUserRole();

  /**
   * Paths that are considered "share pages" - public-facing content that should
   * not be accessible to admins through the regular user interface.
   * Admins should use the admin pages (e.g., /admin/dashboard) for management.
   */
  const sharePagePatterns = [
    /^\/posts\/[^\/]+$/,           // /posts/:id
    /^\/users\/[^\/]+$/,           // /users/:id (profiles)
    /^\/account$/,                 // /account
    /^\/account\/followers/,       // /account/followers
    /^\/account\/following/,       // /account/following
  ];

  /**
   * Check if current path matches any share page pattern
   */
  const isSharePage = sharePagePatterns.some(pattern => pattern.test(location.pathname));

  /**
   * Admins have separate management interface. They should not access
   * regular user routes, especially share pages. Redirect them appropriately.
   */
  if (role === "admin") {
    // Share pages → 404
    if (isSharePage) {
      return <Navigate to="/404" replace />;
    }
    // Settings → admin-specific settings
    if (location.pathname === "/settings") {
      return <Navigate to="/admin/dashboard/admin-settings" replace />;
    }
    // Other user pages → admin dashboard
    return <Navigate to="/admin/dashboard" replace />;
  }

  /**
   * User is not an admin, render regular user content.
   */
  return <>{children}</>;
};

export default UserRoute;