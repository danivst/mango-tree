import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';

import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

import Home from './pages/user/Home';
import Upload from './pages/user/Upload';
import Profile from './pages/user/Profile';
import Settings from './pages/user/Settings';
import Notifications from './pages/user/Notifications';

import AdminDashboard from './pages/admin/Dashboard';
import Reports from './pages/admin/Reports';
import Users from './pages/admin/Users';

function App() {
  return (
    <AuthProvider>
        <Routes>

          {/* ---------- AUTH ---------- */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Route>

          {/* ---------- USER ---------- */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>

          {/* ---------- ADMIN ---------- */}
          <Route
            element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/users" element={<Users />} />
          </Route>

        </Routes>
    </AuthProvider>
  );
}

export default App;