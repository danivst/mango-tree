import api from './api'

export interface User {
  _id: string
  username: string
  email: string
  role: string
  createdAt: string
}

export interface Tag {
  _id: string
  name: string
  createdAt: string
  createdBy?: string
}

export interface Category {
  _id: string
  name: string
  createdAt: string
  createdBy?: string
}

export interface Report {
  _id: string
  reportedBy: {
    _id: string
    username: string
    profileImage?: string
  }
  targetType: 'post' | 'comment' | 'image'
  targetId: string
  reason: string
  status: 'pending' | 'rejected' | 'action_taken' | 'reviewed'
  createdAt: string
}

export interface FlaggedContent {
  _id: string
  type: 'post' | 'comment' | 'image'
  content: any
  authorId: {
    _id: string
    username: string
  }
  createdAt: string
}

export const adminAPI = {
  // Users
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users')
    return response.data
  },

  deleteUser: async (userId: string, reason: string): Promise<{ message: string }> => {
    const response = await api.delete(`/users/${userId}`, {
      data: { reason }
    })
    return response.data
  },

  createAdmin: async (email: string): Promise<{ message: string; user: User }> => {
    const response = await api.post('/auth/register-admin', {
      email
    })
    return response.data
  },

  // Tags
  getTags: async (): Promise<Tag[]> => {
    const response = await api.get<Tag[]>('/tags')
    return response.data
  },

  createTag: async (name: string): Promise<{ message: string; tag: Tag }> => {
    const response = await api.post('/tags', { name })
    return response.data
  },

  deleteTag: async (tagId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/tags/${tagId}`)
    return response.data
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get<Category[]>('/categories')
    return response.data
  },

  createCategory: async (name: string): Promise<{ message: string; category: Category }> => {
    const response = await api.post('/categories', { name })
    return response.data
  },

  deleteCategory: async (categoryId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/categories/${categoryId}`)
    return response.data
  },

  // Reports
  getReports: async (): Promise<Report[]> => {
    const response = await api.get<Report[]>('/reports')
    return response.data
  },

  rejectReport: async (reportId: string, reason: string): Promise<{ message: string }> => {
    const response = await api.put(`/reports/${reportId}`, {
      status: 'rejected',
      reason
    })
    return response.data
  },

  deleteReportedItem: async (reportId: string, reason: string): Promise<{ message: string }> => {
    const response = await api.put(`/reports/${reportId}/delete`, {
      reason
    })
    return response.data
  },

  // Flagged Content (To Review)
  getFlaggedContent: async (): Promise<FlaggedContent[]> => {
    const response = await api.get<FlaggedContent[]>('/admin/flagged')
    return response.data
  },

  approveContent: async (contentId: string, type: 'post' | 'comment'): Promise<{ message: string }> => {
    const response = await api.put(`/admin/approve/${type}/${contentId}`)
    return response.data
  },

  disapproveContent: async (contentId: string, type: 'post' | 'comment', reason: string): Promise<{ message: string }> => {
    const response = await api.put(`/admin/disapprove/${type}/${contentId}`, {
      reason
    })
    return response.data
  }
}
