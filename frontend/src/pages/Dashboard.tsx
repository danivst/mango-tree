import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { useAdminData } from '../context/AdminDataContext';
import './Dashboard.css';

const Dashboard = () => {
  const { initialize } = useAdminData();

  useEffect(() => {
    // Initialize all admin data when dashboard loads
    const init = async () => {
      try {
        await initialize();
      } catch (err) {
        console.error('Failed to initialize admin data:', err);
      }
    };
    init();
  }, [initialize]);

  return (
    <div className="dashboard-container">
      <AdminSidebar />
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
};

export default Dashboard
