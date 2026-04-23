/**
 * @file AdminRoute.tsx
 * @description Route wrapper component that restricts access to admin users only.
 * It checks user authentication and role from the useAuth hook to ensure only
 * authorized personnel can access administrative views. Unauthenticated or
 * unauthorized users are redirected to the login or home page respectively.
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "../../../utils/useAuth";

/**
 * @interface AdminRouteProps
 * @description Props for the AdminRoute wrapper component.
 *
 * @property {React.ReactNode} children - Child components to render if user is admin
 */

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Route wrapper that restricts access to admin users only.
 * Uses useAuth hook to check authentication and admin role. Redirects non-admins to home
 * and unauthenticated users to login page.
 *
 * @component
 * @requires useAuth - Custom hook for authentication state
 * @requires Navigate - React Router navigation component
 */

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isAuthenticated, loading } = useAuth();

  /**
   * Show loading state while checking authentication
   */
  if (loading) {
    return <div>Loading...</div>; // You might want to use a proper loading component
  }

  /**
   * If user is not authenticated, redirect to login page
   */
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  /**
   * Check if user has admin role.
   * Non-admin users are redirected to regular user home page.
   */
  if (user.role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  /**
   * User is authenticated and has admin role.
   * Render the protected admin content.
   */
  return <>{children}</>;
};

export default AdminRoute;