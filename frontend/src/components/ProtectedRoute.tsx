import { Navigate, useLocation } from 'react-router-dom'
import { isTokenValid, clearAuth } from '../utils/auth'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token && !isTokenValid()) {
      // Token exists but is expired
      clearAuth()
      // Store in sessionStorage so Login page can show snackbar
      sessionStorage.setItem('sessionExpired', 'true')
    }
  }, [location])

  if (!isTokenValid()) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
