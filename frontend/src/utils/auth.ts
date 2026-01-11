import { jwtDecode } from 'jwt-decode'

interface TokenPayload {
  userId: string
  role: string
  exp: number
  iat: number
}

export const isTokenValid = (): boolean => {
  const token = localStorage.getItem('token')
  if (!token) return false

  try {
    const decoded = jwtDecode<TokenPayload>(token)
    const currentTime = Date.now() / 1000
    
    // Check if token is expired
    if (decoded.exp < currentTime) {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      return false
    }
    
    return true
  } catch (error) {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    return false
  }
}

export const getToken = (): string | null => {
  return localStorage.getItem('token')
}

export const clearAuth = (): void => {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
}
