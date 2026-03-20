import { Navigate, useLocation } from "react-router-dom";
import { getUserRole } from "../utils/auth";

interface UserRouteProps {
  children: React.ReactNode;
}

const UserRoute = ({ children }: UserRouteProps) => {
  const location = useLocation();
  const role = getUserRole();
  if (role === "admin") {
    // Redirect admins to their settings page if they try to access /settings
    if (location.pathname === "/settings") {
      return <Navigate to="/admin/dashboard/admin-settings" replace />;
    }
    // Otherwise, redirect to admin dashboard
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <>{children}</>;
};

export default UserRoute;
