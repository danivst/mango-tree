/**
 * @file PublicRoute.tsx
 * @description Route wrapper that restricts access to unauthenticated users only.
 * If user is authenticated, redirects to the home page.
 * Used for login, register and password reset pages to prevent logged-in users from accessing them.
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../utils/useAuth";
import Loading from "../global/Loading";

/**
 * @interface PublicRouteProps
 * @description Props for the PublicRoute wrapper component.
 *
 * @property {React.ReactNode} children - Child components to render if user is not authenticated
 */
interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * @component PublicRoute
 * @description Route wrapper component for guest-only pages.
 * @requires useAuth - Custom hook for authentication state
 * @requires Navigate - React Router navigation component for redirects
 * @returns {JSX.Element} The rendered child components or a navigation redirect
 */
const PublicRoute = ({ children }: PublicRouteProps) => {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  const redirectParam = new URLSearchParams(location.search).get("redirect");
  const redirectTarget =
    redirectParam && redirectParam.startsWith("/") ? redirectParam : "/home";

  /**
   * Show loading state while checking authentication
   */
  if (loading) {
    return <Loading />; 
  }

  /**
   * If user is authenticated, they should not access public routes.
   * Redirect to home page where they can see their content.
   */
  if (isAuthenticated) {
    return <Navigate to={redirectTarget} replace />;
  }

  /**
   * User is not authenticated, allow access to public page content.
   */
  return <>{children}</>;
};

export default PublicRoute;
