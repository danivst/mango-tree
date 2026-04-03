import { Navigate } from "react-router-dom";
import { isTokenValid, clearAuth } from "../utils/auth";
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
 * @file ProtectedRoute.tsx
 * @description Route wrapper that restricts access to authenticated users only.
 * Validates JWT token and redirects unauthenticated users to login.
 * Also handles token expiration by clearing auth state and showing session expired message on login page.
 *
 * Access Control Flow:
 * 1. On mount: Check if token exists but is expired → clear auth and set sessionExpired flag
 * 2. During render: If token not valid → redirect to /login
 * 3. If token valid → render protected child components
 *
 * Security Notes:
 * - Token validation is client-side only; backend also validates on each request
 * - Expired tokens are automatically cleared to prevent stale sessions
 * - sessionStorage flag triggers expiration notice on login page
 *
 * @component
 * @requires isTokenValid - Utility to validate JWT token (checks expiration)
 * @requires clearAuth - Utility to clear all auth-related localStorage items
 * @requires Navigate - React Router navigation component for redirects
 * @requires useEffect - React hook for side effects (token expiration check on mount)
 */

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
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
   * - If no valid token → redirect to login page
   * - If valid token exists → render child components (protected content)
   */
  if (!isTokenValid()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
