import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { clearAuth, isTokenValid } from '../utils/auth'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
})

// Request interceptor - add token to headers
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token && isTokenValid()) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle token expiry
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired or invalid
      clearAuth()
      // Store expiry message in sessionStorage to show on redirect
      sessionStorage.setItem('sessionExpired', 'true')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export interface LoginResponse {
  message?: string
  token: string
  refreshToken: string
  user: {
    id: string
    username: string
    role: string
  }
}

export interface ErrorResponse {
  message: string
}

export const authAPI = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    console.log('API: Making POST request to /api/auth/login')
    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        username,
        password,
      })
      console.log('API: Response received:', response.status, response.data)
      return response.data
    } catch (error: any) {
      console.error('API: Request failed:', error)
      console.error('API: Error response:', error.response)
      console.error('API: Error request:', error.request)
      throw error
    }
  },
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    console.log('API: Making POST request to /api/auth/forgot-password with email:', email)
    try {
      const response = await api.post<{ message: string }>('/auth/forgot-password', {
        email,
      })
      console.log('API: Response received:', response.status, response.data)
      return response.data
    } catch (error: any) {
      console.error('API: Request failed:', error)
      console.error('API: Error response:', error.response)
      console.error('API: Error request:', error.request)
      if (error.response) {
        console.error('API: Error status:', error.response.status)
        console.error('API: Error data:', error.response.data)
      } else if (error.request) {
        console.error('API: No response received - request made but no response')
      } else {
        console.error('API: Error setting up request:', error.message)
      }
      throw error
    }
  },
  register: async (username: string, email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/register', {
      username,
      email,
      password,
    })
    return response.data
  },
}

export default api
