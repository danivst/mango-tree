import { Navigate } from 'react-router-dom'
import { isTokenValid } from '../utils/auth'

interface PublicRouteProps {
  children: React.ReactNode
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  if (isTokenValid()) {
    return <Navigate to="/home" replace />
  }

  return <>{children}</>
}

export default PublicRoute
