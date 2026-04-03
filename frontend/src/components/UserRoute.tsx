import { Navigate, useLocation } from "react-router-dom";
import { getUserRole } from "../utils/auth";

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
 * @file UserRoute.tsx
 * @description Route wrapper that ensures only non-admin users can access content.
 * Redirects admin users to appropriate admin dashboard or admin settings.
 * Used to protect regular user routes (like /settings) from admin users.
 *
 * Routing Logic:
 * - If user role is "admin":
 *   - If path is /settings → redirect to /admin/dashboard/admin-settings
 *   - Otherwise → redirect to /admin/dashboard
 * - If user is not admin → render child components normally
 *
 * @component
 * @requires getUserRole - Utility to get current user's role from decoded JWT token
 * @requires Navigate - React Router navigation component for redirects
 * @requires useLocation - React Router hook to determine current pathname
 */

const UserRoute = ({ children }: UserRouteProps) => {
  const location = useLocation();
  const role = getUserRole();

  /**
   * Admins have separate management interface. They should not access
   * regular user routes. Redirect them to appropriate admin pages.
   *
   * Special case: /settings for admin goes to admin-specific settings page.
   */
  if (role === "admin") {
    if (location.pathname === "/settings") {
      return <Navigate to="/admin/dashboard/admin-settings" replace />;
    }
    return <Navigate to="/admin/dashboard" replace />;
  }

  /**
   * User is not an admin, render regular user content.
   */
  return <>{children}</>;
};

export default UserRoute;
