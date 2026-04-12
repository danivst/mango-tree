/**
 * @file PublicRoute.tsx
 * @description Route wrapper that restricts access to unauthenticated users only.
 * If a valid token exists, redirects authenticated users to the home page.
 * Used for login, register, and password reset pages to prevent logged-in users from accessing them.
 */

import { Navigate } from 'react-router-dom';
import { isTokenValid } from '../../utils/auth';

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
 * @requires isTokenValid - Utility to check JWT token validity and expiration
 * @requires Navigate - React Router navigation component for redirects
 * @returns {JSX.Element} The rendered child components or a navigation redirect
 */
const PublicRoute = ({ children }: PublicRouteProps) => {
  /**
   * If user has a valid token, they should not access public routes.
   * Redirect to home page where they can see their content.
   */
  if (isTokenValid()) {
    return <Navigate to="/home" replace />;
  }

  /**
   * User is not authenticated, allow access to public page content.
   */
  return <>{children}</>;
};

export default PublicRoute;