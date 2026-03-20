import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { getToken } from "../utils/auth";

interface TokenPayload {
  userId: string;
  role: string;
  exp: number;
  iat: number;
}

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const token = getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    if (decoded.role !== "admin") {
      return <Navigate to="/home" replace />;
    }
    return <>{children}</>;
  } catch (error) {
    return <Navigate to="/login" replace />;
  }
};

export default AdminRoute;
