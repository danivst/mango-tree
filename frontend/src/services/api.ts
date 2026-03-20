import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { clearAuth, isTokenValid } from '../utils/auth'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
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

// Response interceptor - handle token expiry and account suspension
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Get the request path to avoid redirecting for certain endpoints
    const requestPath = error.config?.url || '';

    // If this is a request to /users/me, don't redirect - let the caller handle it
    // This prevents infinite loops when checking auth status
    if (requestPath.includes('/users/me') || requestPath.includes('/me')) {
      return Promise.reject(error);
    }

    // Don't redirect for login/register endpoints - let them display errors directly
    if (requestPath.includes('/auth/login') || requestPath.includes('/auth/register') || requestPath.includes('/auth/forgot-password')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      // Check if it's an account suspension (account deleted, not banned)
      if (error.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
        const message = (error.response.data as any).message
        if (message && (message.includes('suspended') || message.includes('terminated'))) {
          // Account was deleted/suspended - show modal
          clearAuth()
          sessionStorage.setItem('accountSuspended', 'true')
          sessionStorage.setItem('suspensionReason', message)
          window.location.href = '/login'
          return Promise.reject(error)
        }
      }

      // For banned users and other 403 errors during login, don't redirect if it's a login request
      if (requestPath.includes('/auth/login')) {
        // Let the login page handle the error display
        return Promise.reject(error);
      }

      // Token expired or invalid (401 or other 403)
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
  redirectTo?: string
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
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/change-password', {
      currentPassword,
      newPassword,
    })
    return response.data
  },
}

export interface Notification {
  _id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'report_feedback' | 'system';
  message: string;
  translations: {
    message: {
      bg: string;
      en: string;
    };
  };
  link?: string | null;
  read: boolean;
  createdAt: string;
  updatedAt?: string;
}

export const notificationsAPI = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get<Notification[]>('/notifications')
    return response.data
  },

  markAsRead: async (notificationId: string): Promise<{ message: string }> => {
    const response = await api.put(`/notifications/${notificationId}/read`, {})
    return response.data
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    const response = await api.put('/notifications/read-all', {})
    return response.data
  },

  deleteNotification: async (notificationId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/notifications/${notificationId}`)
    return response.data
  },

  deleteAllNotifications: async (): Promise<{ message: string }> => {
    const response = await api.delete('/notifications')
    return response.data
  },
}

export interface Post {
  _id: string;
  title: string;
  content: string;
  translations: {
    title: {
      bg: string;
      en: string;
    };
    content: {
      bg: string;
      en: string;
    };
  };
  image: string[];
  authorId: {
    _id: string;
    username: string;
    profileImage?: string;
  };
  category: {
    _id: string;
    name: string;
    translations?: {
      name?: {
        bg?: string;
        en?: string;
      };
    };
  };
  tags: string[];
  likes: string[];
  commentCount?: number;
  createdAt: string;
  updatedAt?: string;
  isLiked?: boolean;
  isApproved?: boolean;
  isVisible?: boolean;
}

export interface Comment {
  _id: string;
  postId: string;
  userId: {
    _id: string;
    username: string;
    profileImage?: string;
  };
  text: string;
  translations: {
    bg: string;
    en: string;
  };
  createdAt: string;
  updatedAt?: string;
  likes: string[];
  isLiked?: boolean;
}

export const postsAPI = {
  getPost: async (postId: string): Promise<Post> => {
    const response = await api.get<Post>(`/posts/${postId}`)
    return response.data
  },

  getComments: async (postId: string): Promise<Comment[]> => {
    const response = await api.get<Comment[]>(`/comments/post/${postId}`)
    return response.data
  },

  getComment: async (commentId: string): Promise<Comment> => {
    const response = await api.get<Comment>(`/comments/${commentId}`)
    return response.data
  },

  likePost: async (postId: string): Promise<{ message: string; likes: string[] }> => {
    const response = await api.post(`/posts/${postId}/like`)
    return response.data
  },

  unlikePost: async (postId: string): Promise<{ message: string; likes: string[] }> => {
    const response = await api.delete(`/posts/${postId}/like`)
    return response.data
  },

  likeComment: async (commentId: string): Promise<{ message: string; likes: string[] }> => {
    const response = await api.post(`/comments/${commentId}/like`)
    return response.data
  },

  unlikeComment: async (commentId: string): Promise<{ message: string; likes: string[] }> => {
    const response = await api.delete(`/comments/${commentId}/like`)
    return response.data
  },

  getPostsByAuthor: async (authorId: string): Promise<Post[]> => {
    const response = await api.get<Post[]>(`/posts/author/${authorId}`)
    return response.data
  },

  translatePost: async (postId: string, targetLang: 'en' | 'bg'): Promise<{ title: string; content: string }> => {
    const response = await api.post<{ title: string; content: string }>(`/posts/${postId}/translate?targetLang=${targetLang}`)
    return response.data
  },

  translateComment: async (commentId: string, targetLang: 'en' | 'bg'): Promise<{ text: string }> => {
    const response = await api.post<{ text: string }>(`/comments/${commentId}/translate?targetLang=${targetLang}`)
    return response.data
  },

  searchPosts: async (query: string, limit?: number, skip?: number): Promise<{posts: Post[]; total: number; hasMore: boolean}> => {
    const response = await api.get<{posts: Post[]; total: number; hasMore: boolean}>('/posts/search', {
      params: { q: query, limit, skip, _t: Date.now() } // cache buster
    })
    return response.data
  },

  getFollowedPosts: async (limit?: number, skip?: number): Promise<{posts: Post[]; total: number; hasMore: boolean}> => {
    const response = await api.get<{posts: Post[]; total: number; hasMore: boolean}>('/posts/followed', {
      params: { limit, skip }
    })
    return response.data
  },

  getSuggestedPosts: async (limit?: number, skip?: number): Promise<{posts: Post[]; total: number; hasMore: boolean}> => {
    const response = await api.get<{posts: Post[]; total: number; hasMore: boolean}>('/posts/suggested', {
      params: { limit, skip }
    })
    return response.data
  },
}

export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  profileImage?: string;
  bio?: string;
  followers: string[];
  following: string[];
  theme?: string;
  language?: string;
}

export const usersAPI = {
  getCurrentUser: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/users/me')
    return response.data
  },

  getUser: async (userId: string): Promise<UserProfile> => {
    const response = await api.get<UserProfile>(`/users/${userId}`)
    return response.data
  },

  updateProfile: async (data: { bio?: string; username?: string; profileImage?: string; theme?: string; language?: string }): Promise<UserProfile> => {
    const response = await api.put<UserProfile>('/users/me', data)
    return response.data
  },

  getFollowers: async (userId: string): Promise<UserProfile[]> => {
    const response = await api.get<UserProfile[]>(`/users/${userId}/followers`)
    return response.data
  },

  getFollowing: async (userId: string): Promise<UserProfile[]> => {
    const response = await api.get<UserProfile[]>(`/users/${userId}/following`)
    return response.data
  },

  removeFollower: async (followerId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/users/followers/${followerId}`)
    return response.data
  },

  // Reuse toggleFollow for following/unfollowing (sends notification when following)
  toggleFollow: async (targetId: string): Promise<{ message: string }> => {
    const response = await api.post('/users/follow', { targetId })
    return response.data
  },
}

export const reportsAPI = {
  createReport: async (targetType: 'post' | 'comment' | 'user', targetId: string, reason: string): Promise<{ message: string }> => {
    const response = await api.post('/reports', { targetType, targetId, reason })
    return response.data
  },
}

export default api
