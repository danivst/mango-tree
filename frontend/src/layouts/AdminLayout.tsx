import { Outlet } from 'react-router-dom';

const AdminLayout = () => {
  return (
    <div>
      <header style={{ padding: 16, background: '#111', color: '#fff' }}>
        <h3>Admin Panel</h3>
      </header>

      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;