/**
 * @file ProtectedRoute.tsx
 * @description Route wrapper that restricts access to authenticated users only.
 * Validates server session (via /users/me) and redirects unauthenticated users to login.
 * Handles expired/invalid cookie sessions by redirecting to the login page.
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../utils/useAuth";

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
 * 1. Use useAuth hook to check authentication status via API call
 * 2. If loading, show nothing (or loading spinner)
 * 3. If not authenticated, redirect to /login
 * 4. If authenticated, render protected child components
 *
 * @requires useAuth - Hook that fetches user data from /users/me endpoint
 * @requires Navigate - React Router navigation component for redirects
 * @returns {JSX.Element} The rendered child components or a navigation redirect
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  /**
   * Show loading state while checking authentication
   */
  if (loading) {
    return null; // Or return a loading spinner
  }

  /**
   * Redirect to login if not authenticated
   */
  if (!isAuthenticated) {
    const redirectTo = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirectTo)}`}
        state={{ from: location }}
        replace
      />
    );
  }

  /**
   * Render protected content if authenticated
   */
  return <>{children}</>;
};

export default ProtectedRoute;
