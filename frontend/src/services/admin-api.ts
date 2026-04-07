import api from "./api";
import type {
  User,
  BannedUser,
  Tag,
  Category,
  Report,
  FlaggedContent,
} from "../utils/types";

/**
 * @file adminAPI.ts
 * @description API service for administrative functions.
 * Provides methods for user management (ban/unban, delete), content moderation
 * (reports, flagged content), and taxonomy management (tags and categories).
 * All methods require admin privileges; unauthorized requests will be rejected
 * by the backend with 403.
 *
 * @namespace adminAPI
 */
export const adminAPI = {
  // ============================================================================
  // User Management
  // ============================================================================

  /**
   * Get all registered users.
   *
   * @async
   * @returns {Promise<User[]>} Array of user objects
   */
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>("/users");
    return response.data;
  },

  /**
   * Delete a user account permanently.
   *
   * @async
   * @param {string} userId - The user's unique identifier
   * @param {string} reason - Justification for deletion (logged for audit)
   * @returns {Promise<{ message: string }>} Response with confirmation message
   */
  deleteUser: async (
    userId: string,
    reason: string,
  ): Promise<{ message: string }> => {
    const response = await api.delete(`/users/${userId}`, {
      data: { reason },
    });
    return response.data;
  },

  /**
   * Ban a user, preventing them from logging in and deleting their content.
   *
   * @async
   * @param {string} userId - The user's unique identifier
   * @param {string} reason - Reason for the ban (will be shown to the user via email)
   * @returns {Promise<{ message: string }>} Response with confirmation message
   */
  banUser: async (
    userId: string,
    reason: string,
  ): Promise<{ message: string }> => {
    const response = await api.post(`/admin/users/${userId}/ban`, {
      ban_reason: reason,
    });
    return response.data;
  },

  /**
   * Unban a previously banned user, restoring their access.
   *
   * @async
   * @param {string} bannedUserId - The banned user record ID (from BannedUser._id)
   * @returns {Promise<{ message: string }>} Response with confirmation message
   */
  unbanUser: async (bannedUserId: string): Promise<{ message: string }> => {
    const response = await api.post(
      `/admin/banned-users/${bannedUserId}/unban`,
    );
    return response.data;
  },

  /**
   * Get all banned users (historical ban records).
   *
   * @async
   * @returns {Promise<BannedUser[]>} Array of banned user records
   */
  getBannedUsers: async (): Promise<BannedUser[]> => {
    const response = await api.get<BannedUser[]>("/admin/banned-users");
    return response.data;
  },

  /**
   * Create a new admin account by email.
   * The invited admin will receive a password setup email.
   *
   * @async
   * @param {string} email - Email address of the new admin
   * @returns {Promise<{ message: string }>} Response with confirmation message
   */
  createAdmin: async (email: string): Promise<{ message: string }> => {
    const response = await api.post("/auth/register-admin", { email });
    return response.data;
  },

  // ============================================================================
  // Tag Management
  // ============================================================================

  /**
   * Get all tags.
   *
   * @async
   * @returns {Promise<Tag[]>} Array of tag objects
   */
  getTags: async (): Promise<Tag[]> => {
    const response = await api.get<Tag[]>("/tags");
    return response.data;
  },

  /**
   * Create a new tag.
   *
   * @async
   * @param {string} name - Tag name (1-20 characters)
   * @returns {Promise<{ message: string; tag: Tag }>} Response with created tag
   */
  createTag: async (name: string): Promise<{ message: string; tag: Tag }> => {
    const response = await api.post("/tags", { name });
    return response.data;
  },

  /**
   * Update an existing tag's name.
   *
   * @async
   * @param {string} tagId - The tag's unique identifier
   * @param {string} name - New tag name (1-20 characters)
   * @returns {Promise<{ message: string; tag: Tag }>} Response with updated tag
   */
  updateTag: async (
    tagId: string,
    name: string,
  ): Promise<{ message: string; tag: Tag }> => {
    const response = await api.put(`/tags/${tagId}`, { name });
    return response.data;
  },

  /**
   * Delete a tag.
   *
   * @async
   * @param {string} tagId - The tag's unique identifier
   * @returns {Promise<{ message: string }>} Response with confirmation message
   */
  deleteTag: async (tagId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/tags/${tagId}`);
    return response.data;
  },

  // ============================================================================
  // Category Management
  // ============================================================================

  /**
   * Get all categories.
   *
   * @async
   * @returns {Promise<Category[]>} Array of category objects
   */
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get<Category[]>("/categories");
    return response.data;
  },

  /**
   * Create a new category.
   *
   * @async
   * @param {string} name - Category name (1-50 characters)
   * @returns {Promise<{ message: string; category: Category }>} Response with created category
   */
  createCategory: async (
    name: string,
  ): Promise<{ message: string; category: Category }> => {
    const response = await api.post("/categories", { name });
    return response.data;
  },

  /**
   * Update an existing category's name.
   *
   * @async
   * @param {string} categoryId - The category's unique identifier
   * @param {string} name - New category name (1-50 characters)
   * @returns {Promise<{ message: string; category: Category }>} Response with updated category
   */
  updateCategory: async (
    categoryId: string,
    name: string,
  ): Promise<{ message: string; category: Category }> => {
    const response = await api.put(`/categories/${categoryId}`, { name });
    return response.data;
  },

  /**
   * Delete a category.
   *
   * @async
   * @param {string} categoryId - The category's unique identifier
   * @returns {Promise<{ message: string }>} Response with confirmation message
   */
  deleteCategory: async (categoryId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/categories/${categoryId}`);
    return response.data;
  },

  // ============================================================================
  // Report Moderation
  // ============================================================================

  /**
   * Get all submitted reports.
   *
   * @async
   * @returns {Promise<Report[]>} Array of report objects
   */
  getReports: async (): Promise<Report[]> => {
    const response = await api.get<Report[]>("/reports");
    return response.data;
  },

  /**
   * Reject a report, keeping the reported content.
   *
   * @async
   * @param {string} reportId - The report's unique identifier
   * @param {string} reason - Justification for rejection (logged for audit)
   * @returns {Promise<{ message: string }>} Response with confirmation message
   */
  rejectReport: async (
    reportId: string,
    reason: string,
  ): Promise<{ message: string }> => {
    const response = await api.put(`/reports/${reportId}`, {
      status: "rejected",
      reason,
    });
    return response.data;
  },

  /**
   * Delete the reported item (post or comment) and resolve the report.
   *
   * @async
   * @param {string} reportId - The report's unique identifier
   * @param {string} reason - Justification for deletion (logged for audit)
   * @returns {Promise<{ message: string }>} Response with confirmation message
   */
  deleteReportedItem: async (
    reportId: string,
    reason: string,
  ): Promise<{ message: string }> => {
    const response = await api.put(`/reports/${reportId}/delete`, {
      reason,
    });
    return response.data;
  },

  // ============================================================================
  // Flagged Content (AI Moderation Queue)
  // ============================================================================

  /**
   * Get all content flagged by AI for admin review.
   *
   * @async
   * @returns {Promise<FlaggedContent[]>} Array of flagged content items
   */
  getFlaggedContent: async (): Promise<FlaggedContent[]> => {
    const response = await api.get<FlaggedContent[]>("/admin/flagged");
    return response.data;
  },

  /**
   * Approve flagged content, making it publicly visible (for posts) or published (for comments).
   *
   * @async
   * @param {string} contentId - The post or comment ID
   * @param {'post' | 'comment'} type - The type of content being approved
   * @returns {Promise<{ message: string }>} Response with confirmation message
   */
  approveContent: async (
    contentId: string,
    type: "post" | "comment",
  ): Promise<{ message: string }> => {
    const response = await api.put(`/admin/approve/${type}/${contentId}`);
    return response.data;
  },

  /**
   * Disapprove flagged content, preventing it from being shown.
   *
   * @async
   * @param {string} contentId - The post or comment ID
   * @param {'post' | 'comment'} type - The type of content being disapproved
   * @param {string} reason - Justification for disapproval (logged for audit)
   * @returns {Promise<{ message: string }>} Response with confirmation message
   */
  disapproveContent: async (
    contentId: string,
    type: "post" | "comment",
    reason: string,
  ): Promise<{ message: string }> => {
    const response = await api.put(`/admin/disapprove/${type}/${contentId}`, {
      reason,
    });
    return response.data;
  },

  // ============================================================================
  // Activity Logs
  // ============================================================================

  /**
   * Get activity logs with optional filters.
   *
   * @async
   * @param params - Optional filters (page, limit, userId, actionType, startDate, endDate, search)
   * @returns {Promise<{ logs: any[], total: number, page: number, totalPages: number }>} Paginated logs
   */
  getActivityLogs: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    actionType?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => {
    const response = await api.get("/admin/logs", { params });
    return response.data;
  },
};

// Re-export types for other modules to import consistently
export type {
  User,
  BannedUser,
  Tag,
  Category,
  Report,
  FlaggedContent,
  RoleType,
} from "../utils/types";
