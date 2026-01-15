import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import SetupPassword from './pages/SetupPassword'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import AdminRoute from './components/AdminRoute'
import Dashboard from './pages/Dashboard'
import Users from './pages/admin/Users'
import Tags from './pages/admin/Tags'
import Categories from './pages/admin/Categories'
import ToReview from './pages/admin/ToReview'
import Reports from './pages/admin/Reports'
import Settings from './pages/admin/Settings'

// Placeholder Home component - will be replaced later
const Home = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Welcome to MangoTree!</h1>
      <p>Home page - to be implemented</p>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/signin" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/reset-password" 
          element={<ResetPassword />} 
        />
        <Route 
          path="/setup-password" 
          element={<SetupPassword />} 
        />
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        >
          <Route path="users" element={<Users />} />
          <Route path="tags" element={<Tags />} />
          <Route path="categories" element={<Categories />} />
          <Route path="review" element={<ToReview />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route index element={<Navigate to="/dashboard/users" replace />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
