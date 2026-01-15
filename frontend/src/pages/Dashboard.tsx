import { Outlet } from 'react-router-dom'
import AdminSidebar from '../components/AdminSidebar'
import './Dashboard.css'

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <AdminSidebar />
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  )
}

export default Dashboard
