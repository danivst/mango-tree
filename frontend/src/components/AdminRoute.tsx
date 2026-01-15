import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import { isTokenValid, getToken } from '../utils/auth'

interface TokenPayload {
  userId: string
  role: string
  exp: number
  iat: number
}

interface AdminRouteProps {
  children: React.ReactNode
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const navigate = useNavigate()

  useEffect(() => {
    if (!isTokenValid()) {
      navigate('/login', { replace: true })
      return
    }

    const token = getToken()
    if (token) {
      try {
        const decoded = jwtDecode<TokenPayload>(token)
        if (decoded.role !== 'admin') {
          navigate('/home', { replace: true })
        }
      } catch (error) {
        navigate('/login', { replace: true })
      }
    }
  }, [navigate])

  const token = getToken()
  if (!token || !isTokenValid()) {
    return null
  }

  try {
    const decoded = jwtDecode<TokenPayload>(token)
    if (decoded.role !== 'admin') {
      return null
    }
    return <>{children}</>
  } catch (error) {
    return null
  }
}

export default AdminRoute
