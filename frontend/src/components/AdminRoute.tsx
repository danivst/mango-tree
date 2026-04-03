import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { getToken } from "../utils/auth";

/**
 * @interface TokenPayload
 * @description Type definition for decoded JWT token payload.
 * Defines the expected structure of authentication tokens.
 *
 * @property {string} userId - Unique user identifier
 * @property {string} role - User role (e.g., "admin", "user")
 * @property {number} exp - Token expiration timestamp
 * @property {number} iat - Token issued-at timestamp
 */

interface TokenPayload {
  userId: string;
  role: string;
  exp: number;
  iat: number;
}

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
 * @file AdminRoute.tsx
 * @description Route wrapper that restricts access to admin users only.
 * Validates JWT token and checks for admin role. Redirects non-admins to home
 * and unauthenticated users to login page.
 *
 * @component
 * @requires jwtDecode - Library for decoding JWT tokens without verification
 * @requires getToken - Utility to retrieve token from localStorage
 * @requires Navigate - React Router navigation component
 */

const AdminRoute = ({ children }: AdminRouteProps) => {
  const token = getToken();

  /**
   * If no token exists, redirect to login page
   * This handles cases where user is not authenticated at all
   */
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    /**
     * Decode token to extract user role and other claims.
     * Note: Decoding only, not verifying signature (verification done by backend)
     */
    const decoded = jwtDecode<TokenPayload>(token);

    /**
     * Check if user has admin role.
     * Non-admin users are redirected to regular user home page.
     */
    if (decoded.role !== "admin") {
      return <Navigate to="/home" replace />;
    }

    /**
     * User is authenticated and has admin role.
     * Render the protected admin content.
     */
    return <>{children}</>;
  } catch (error) {
    /**
     * Token decoding failed (malformed, invalid, etc.)
     * Clear invalid token and redirect to login
     */
    return <Navigate to="/login" replace />;
  }
};

export default AdminRoute;
