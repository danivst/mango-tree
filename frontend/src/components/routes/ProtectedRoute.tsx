/**
 * @file ProtectedRoute.tsx
 * @description Route wrapper that restricts access to authenticated users only.
 * Validates JWT token and redirects unauthenticated users to login.
 * Also handles token expiration by clearing auth state and showing session expired message on login page.
 */

import { Navigate, useLocation } from "react-router-dom";
import { isTokenValid, clearAuth } from "../../utils/auth";
import { useEffect } from "react";

/**
 * @interface ProtectedRouteProps
 * @description Props for the ProtectedRoute wrapper component.
 *
 * @property {React.ReactNode} children - Child components to render if user is authenticated
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * @component ProtectedRoute
 * @description Route wrapper component for members-only pages.
 *
 * Access Control Flow:
 * 1. On mount: Check if token exists but is expired → clear auth and set sessionExpired flag.
 * 2. During render: If token not valid → redirect to /login.
 * 3. If token valid → render protected child components.
 *
 * @requires isTokenValid - Utility to validate JWT token (checks expiration)
 * @requires clearAuth - Utility to clear all auth-related localStorage items
 * @requires Navigate - React Router navigation component for redirects
 * @returns {JSX.Element} The rendered child components or a navigation redirect
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();

  /**
   * Effect hook that runs on component mount.
   * Checks for tokens that exist but have expired, clears them,
   * and sets a session flag to inform the login page of the expiration.
   */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !isTokenValid()) {
      // Token exists but is expired - force re-login
      clearAuth();
      // Store flag so Login page can show appropriate snackbar message
      sessionStorage.setItem("sessionExpired", "true");
    }
  }, []);

  /**
   * Main render logic:
   * - If no valid token → redirect to login page with the current path as redirect parameter
   * - If valid token exists → render child components (protected content)
   */
  if (!isTokenValid()) {
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectPath}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;