/**
 * @file Dashboard.tsx
 * @description Admin dashboard layout wrapper component.
 * Provides consistent admin UI shell with sidebar navigation and outlet for nested routes.
 * * Responsibilities:
 * - Renders AdminSidebar (left navigation)
 * - Fetches all admin data on mount via AdminDataContext.initialize()
 * - Displays child routes via Outlet (react-router nested routes)
 */

import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../../components/admin/sidebar/AdminSidebar";
import { useAdminData } from "../../context/AdminDataContext";
import "./Dashboard.css";
import "../../styles/shared.css";

/**
 * Admin dashboard layout logic.
 *
 * Route: /admin/dashboard/* (parent route for all admin pages)
 * Access: Admin users only (protected by AdminRoute)
 * Child routes: /admin/dashboard/admins, /admin/dashboard/users, etc.
 *
 * @layout
 * @requires useEffect - Data initialization on mount
 * @requires Outlet - React Router nested route rendering
 * @requires AdminSidebar - Admin navigation component
 * @requires useAdminData - Context with initialize() method
 * @returns {JSX.Element} The rendered dashboard layout
 */
const Dashboard = () => {
  const { initialize } = useAdminData();

  /**
   * Effect: Initialize all admin data when dashboard first loads.
   * Calls AdminDataContext.initialize() which fetches categories, tags, users,
   * banned users, reports, and flagged content in parallel.
   * Errors are logged but not shown to user (individual pages handle their own loading/error states).
   */
  useEffect(() => {
    // Initialize all admin data when dashboard loads
    const init = async () => {
      try {
        await initialize();
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("Failed to initialize admin data:", err);
        }
      }
    };
    init();
  }, [initialize]);

  return (
    <div className="dashboard-container with-sidebar">
      <AdminSidebar />
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
};

export default Dashboard;