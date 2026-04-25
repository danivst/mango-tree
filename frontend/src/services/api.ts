/**
 * @file api.ts
 * @description Central HTTP client and API service definitions for the MangoTree application.
 * Configures Axios with interceptors for cookie-based session handling,
 * and account status redirection.
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import type {
  LoginResponse,
  Notification,
  Post,
  Comment,
  UserProfile,
  Theme,
  Language,
} from "../utils/types";

/**
 * Axios HTTP client configured for MangoTree API.
 * Base URL: /api
 * Features:
 * - 10-second timeout
 * - Cookie-based auth via withCredentials (no client-side token injection)
 * - Token expiry handling and account suspension detection
 * - Special handling for auth endpoints to prevent redirect loops
 *
 * @type {axios.AxiosInstance}
 */
const api = axios.create({
  baseURL: "http://164.90.219.7:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  withCredentials: true,
});

// Request interceptor - no Authorization header needed for HttpOnly cookie auth
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - handle session expiry and account suspension
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Get the request path to avoid redirecting for certain endpoints
    const requestPath = error.config?.url || "";

    // If this is a request to /users/me, don't redirect - let the caller handle it
    // This prevents infinite loops when checking auth status
    if (requestPath.includes("/users/me") || requestPath.includes("/me")) {
      return Promise.reject(error);
    }

    // Don't redirect for login/register endpoints - let them display errors directly
    if (
      requestPath.includes("/auth/login") ||
      requestPath.includes("/auth/register") ||
      requestPath.includes("/auth/forgot-password")
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      // Check if it's an account suspension (account deleted, not banned)
      if (
        error.response?.data &&
        typeof error.response.data === "object" &&
        "message" in error.response.data
      ) {
        const message = (error.response.data as any).message;
        if (
          message &&
          (message.includes("suspended") || message.includes("terminated"))
        ) {
          // Account was deleted/suspended - show modal
          sessionStorage.setItem("accountSuspended", "true");
          sessionStorage.setItem("suspensionReason", message);
          window.location.href = "/login";
          return Promise.reject(error);
        }
      }

      // For banned users and other 403 errors during login, don't redirect if it's a login request
      if (requestPath.includes("/auth/login")) {
        // Let the login page handle the error display
        return Promise.reject(error);
      }

      // Normal 403s can be permission checks (e.g. non-admin hitting admin API).
      // Do NOT treat those as expired sessions.
      if (error.response?.status === 403) {
        return Promise.reject(error);
      }

      // 401 means the session is invalid/expired.
      sessionStorage.setItem("sessionExpired", "true");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

/**
 * Authentication API methods.
 * Handles login, registration, password reset, and 2FA operations.
 *
 * @namespace authAPI
 */
export const authAPI = {
  /**
   * Log in a user with username and password.
   *
   * @param {string} username - The user's username
   * @param {string} password - The user's password
   * @returns {Promise<LoginResponse>} The login response containing user data and optional 2FA flag
   * @throws {Error} Throws error if request fails (network error or invalid credentials)
   *
   * @example
   * ```ts
   * const response = await authAPI.login('alice', 'secret123');
   * if (response.twoFactorRequired) {
   *   // Redirect to 2FA verification page
   * }
   * ```
   */
  login: async (username: string, password: string): Promise<LoginResponse> => {
    console.log("API: Making POST request to /api/auth/login");
    try {
      const response = await api.post<LoginResponse>("/auth/login", {
        username,
        password,
      });
      console.log("API: Response received:", response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error("API: Request failed:", error);
      console.error("API: Error response:", error.response);
      console.error("API: Error request:", error.request);
      throw error;
    }
  },

  /**
   * Verify a 2FA code for a user during login.
   *
   * @async
   * @param {string} userId - The user's ID (provided after initial login attempt)
   * @param {string} code - The 6-digit verification code from email
   * @returns {Promise<LoginResponse>} The verified login response with user data
   */
  verify2FA: async (userId: string, code: string): Promise<LoginResponse> => {
    console.log("API: Making POST request to /api/auth/2fa/verify");
    try {
      const response = await api.post<LoginResponse>("/auth/2fa/verify", {
        userId,
        code,
      });
      console.log("API: Response received:", response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error("API: 2FA verify failed:", error);
      throw error;
    }
  },

  /**
   * Request a password reset email.
   *
   * @async
   * @param {string} email - The user's email address
   * @returns {Promise<{ message: string }>} Response with confirmation message
   */
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    console.log(
      "API: Making POST request to /api/auth/forgot-password with email:",
      email,
    );
    try {
      const response = await api.post<{ message: string }>(
        "/auth/forgot-password",
        {
          email,
        },
      );
      console.log("API: Response received:", response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error("API: Request failed:", error);
      console.error("API: Error response:", error.response);
      console.error("API: Error request:", error.request);
      if (error.response) {
        console.error("API: Error status:", error.response.status);
        console.error("API: Error data:", error.response.data);
      } else if (error.request) {
        console.error(
          "API: No response received - request made but no response",
        );
      } else {
        console.error("API: Error setting up request:", error.message);
      }
      throw error;
    }
  },

  /**
   * Register a new user account.
   *
   * @async
   * @param {string} username - Desired username (min 3 chars)
   * @param {string} email - User's email address
   * @param {string} password - User's password (must meet complexity requirements)
   * @returns {Promise<LoginResponse>} The login response for the newly created user
   */
  register: async (
    username: string,
    email: string,
    password: string,
  ): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/register", {
      username,
      email,
      password,
    });
    return response.data;
  },

  /**
   * Change the authenticated user's password.
   *
   * @async
   * @param {string} currentPassword - The user's current password
   * @param {string} newPassword - The new password (must meet complexity requirements)
   * @returns {Promise<{ message: string }>} Response with confirmation message
   */
  changePassword: async (
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(
      "/auth/change-password",
      {
        currentPassword,
        newPassword,
      },
    );
    return response.data;
  },

  /**
   * Log out the authenticated user and record activity on the server.
   * Server clears auth cookies; client only clears local UI/auth flags if needed.
   *
   * @async
   * @returns {Promise<{ message: string }>} Response with confirmation message
   */
  logout: async (): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>("/auth/logout");
    return response.data;
  },

  /**
   * Enable two-factor authentication for the current user.
   *
   * @async
   * @returns {Promise<{ message: string }>} Response with confirmation message
   */
  enable2FA: async (): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(
      "/users/me/2fa/enable",
    );
    return response.data;
  },

  /**
   * Disable two-factor authentication for the current user.
   *
   * @async
   * @returns {Promise<{ message: string }>} Response with confirmation message
   */
  disable2FA: async (): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(
      "/users/me/2fa/disable",
    );
    return response.data;
  },
};

/**
 * Notification API methods.
 * Fetch and manage in-app notifications.
 *
 * @namespace notificationsAPI
 */
export const notificationsAPI = {
  /**
   * Get all notifications for the current user.
   *
   * @async
   * @returns {Promise<Notification[]>} Array of notification objects
   */
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get<Notification[]>("/notifications");
    return response.data;
  },

  /**
   * Mark a single notification as read.
   *
   * @async
   * @param {string} notificationId - The ID of the notification to mark
   * @returns {Promise<{ message: string }>} Response with confirmation message
   */
  markAsRead: async (notificationId: string): Promise<{ message: string }> => {
    const response = await api.put(`/notifications/${notificationId}/read`, {});
    return response.data;
  },

  /**
   * Mark all notifications as read.
   *
   * @async
   * @returns {Promise<{ message: string }>} Response with confirmation message
   */
  markAllAsRead: async (): Promise<{ message: string }> => {
    const response = await api.put("/notifications/read-all", {});
    return response.data;
  },

  /**
   * Delete a specific notification.
   *
   * @async
   * @param {string} notificationId - The ID of the notification to delete
   * @returns {Promise<{ message: string }>} Response with confirmation message
   */
  deleteNotification: async (
    notificationId: string,
  ): Promise<{ message: string }> => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  /**
   * Delete all notifications for the current user.
   *
   * @async
   * @returns {Promise<{ message: string }>} Response with confirmation message
   */
  deleteAllNotifications: async (): Promise<{ message: string }> => {
    const response = await api.delete("/notifications");
    return response.data;
  },
};

/**
 * Posts API methods.
 * Operations for fetching, creating, liking, and translating posts.
 *
 * @namespace postsAPI
 */
export const postsAPI = {
  /**
   * Get a single post by ID.
   *
   * @async
   * @param {string} postId - The post's unique identifier
   * @returns {Promise<Post>} The post object with populated author and category
   */
  getPost: async (postId: string): Promise<Post> => {
    const response = await api.get<Post>(`/posts/${postId}`);
    return response.data;
  },

  /**
   * Get all comments for a post.
   *
   * @async
   * @param {string} postId - The post's unique identifier
   * @returns {Promise<Comment[]>} Array of comments (may include nested replies)
   */
  getComments: async (postId: string): Promise<Comment[]> => {
    const response = await api.get<Comment[]>(`/comments/post/${postId}`);
    return response.data;
  },

  /**
   * Get a single comment by ID.
   *
   * @async
   * @param {string} commentId - The comment's unique identifier
   * @returns {Promise<Comment>} The comment object
   */
  getComment: async (commentId: string): Promise<Comment> => {
    const response = await api.get<Comment>(`/comments/${commentId}`);
    return response.data;
  },

  /**
   * Like a post.
   *
   * @async
   * @param {string} postId - The post's unique identifier
   * @returns {Promise<{ message: string; likes: string[] }>} Response with updated likes array
   */
  likePost: async (
    postId: string,
  ): Promise<{ message: string; likes: string[] }> => {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  },

  /**
   * Unlike a post.
   *
   * @async
   * @param {string} postId - The post's unique identifier
   * @returns {Promise<{ message: string; likes: string[] }>} Response with updated likes array
   */
  unlikePost: async (
    postId: string,
  ): Promise<{ message: string; likes: string[] }> => {
    const response = await api.delete(`/posts/${postId}/like`);
    return response.data;
  },

  /**
   * Like a comment.
   *
   * @async
   * @param {string} commentId - The comment's unique identifier
   * @returns {Promise<{ message: string; likes: string[] }>} Response with updated likes array
   */
  likeComment: async (
    commentId: string,
  ): Promise<{ message: string; likes: string[] }> => {
    const response = await api.post(`/comments/${commentId}/like`);
    return response.data;
  },

  /**
   * Unlike a comment.
   *
   * @async
   * @param {string} commentId - The comment's unique identifier
   * @returns {Promise<{ message: string; likes: string[] }>} Response with updated likes array
   */
  unlikeComment: async (
    commentId: string,
  ): Promise<{ message: string; likes: string[] }> => {
    const response = await api.delete(`/comments/${commentId}/like`);
    return response.data;
  },

  /**
   * Get all posts by a specific author.
   *
   * @async
   * @param {string} authorId - The author's user ID
   * @returns {Promise<Post[]>} Array of posts by that user
   */
  getPostsByAuthor: async (authorId: string): Promise<Post[]> => {
    const response = await api.get<Post[]>(`/posts/author/${authorId}`);
    return response.data;
  },

  /**
   * Translate a post's content to a target language.
   *
   * @async
   * @param {string} postId - The post's unique identifier
   * @param {'en' | 'bg'} targetLang - Target language code
   * @returns {Promise<{ title: string; content: string; tags?: string[] }>} Translated content
   */
  translatePost: async (
    postId: string,
    targetLang: "en" | "bg",
  ): Promise<{ title: string; content: string; tags?: string[] }> => {
    const response = await api.post<{
      title: string;
      content: string;
      tags?: string[];
    }>(`/posts/${postId}/translate?targetLang=${targetLang}`);
    return response.data;
  },

  /**
   * Translate a comment's text to a target language.
   *
   * @async
   * @param {string} commentId - The comment's unique identifier
   * @param {'en' | 'bg'} targetLang - Target language code
   * @returns {Promise<{ text: string }>} Translated comment text
   */
  translateComment: async (
    commentId: string,
    targetLang: "en" | "bg",
  ): Promise<{ text: string }> => {
    const response = await api.post<{ text: string }>(
      `/comments/${commentId}/translate?targetLang=${targetLang}`,
    );
    return response.data;
  },

  /**
   * Search for posts by query string.
   *
   * @async
   * @param {string} query - Search query
   * @param {number} [limit] - Maximum number of results (default: server-defined)
   * @param {number} [skip] - Number of results to skip for pagination
   * @returns {Promise<{ posts: Post[]; total: number; hasMore: boolean }>} Search results with pagination info
   */
  searchPosts: async (
    query: string,
    limit?: number,
    skip?: number,
  ): Promise<{ posts: Post[]; total: number; hasMore: boolean }> => {
    const response = await api.get<{
      posts: Post[];
      total: number;
      hasMore: boolean;
    }>("/posts/search", {
      params: { q: query, limit, skip, _t: Date.now() }, // cache buster
    });
    return response.data;
  },

  /**
   * Get posts from users you follow.
   *
   * @async
   * @param {number} [limit] - Maximum number of results
   * @param {number} [skip] - Number of results to skip for pagination
   * @returns {Promise<{ posts: Post[]; total: number; hasMore: boolean }>} Paginated followed posts
   */
  getFollowedPosts: async (
    limit?: number,
    skip?: number,
  ): Promise<{ posts: Post[]; total: number; hasMore: boolean }> => {
    const response = await api.get<{
      posts: Post[];
      total: number;
      hasMore: boolean;
    }>("/posts/followed", {
      params: { limit, skip },
    });
    return response.data;
  },

  /**
   * Get suggested posts (discovery feed).
   *
   * @async
   * @param {number} [limit] - Maximum number of results
   * @param {number} [skip] - Number of results to skip for pagination
   * @returns {Promise<{ posts: Post[]; total: number; hasMore: boolean }>} Paginated suggested posts
   */
  getSuggestedPosts: async (
    limit?: number,
    skip?: number,
  ): Promise<{ posts: Post[]; total: number; hasMore: boolean }> => {
    const response = await api.get<{
      posts: Post[];
      total: number;
      hasMore: boolean;
    }>("/posts/suggested", {
      params: { limit, skip },
    });
    return response.data;
  },
};

/**
 * Users API methods.
 * User profile management and social connections.
 *
 * @namespace usersAPI
 */
export const usersAPI = {
  /**
   * Get the current authenticated user's profile.
   *
   * @async
   * @returns {Promise<UserProfile>} The current user's profile data
   */
  getCurrentUser: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>("/users/me");
    return response.data;
  },

  /**
   * Get a user's public profile by ID.
   *
   * @async
   * @param {string} userId - The user's unique identifier
   * @returns {Promise<UserProfile>} The requested user's profile data
   */
  getUser: async (userId: string): Promise<UserProfile> => {
    const response = await api.get<UserProfile>(`/users/${userId}`);
    return response.data;
  },

  /**
   * Update the current user's profile.
   *
   * @async
   * @param {{ bio?: string; username?: string; profileImage?: string; theme?: Theme; language?: Language }} data - Fields to update
   * @returns {Promise<UserProfile>} The updated user profile
   */
  updateProfile: async (data: {
    bio?: string;
    username?: string;
    profileImage?: string;
    theme?: Theme;
    language?: Language;
  }): Promise<UserProfile> => {
    const response = await api.put<UserProfile>("/users/me", data);
    return response.data;
  },

  /**
   * Get a user's followers.
   *
   * @async
   * @param {string} userId - The user's unique identifier
   * @returns {Promise<UserProfile[]>} Array of follower user profiles
   */
  getFollowers: async (userId: string): Promise<UserProfile[]> => {
    const response = await api.get<UserProfile[]>(`/users/${userId}/followers`);
    return response.data;
  },

  /**
   * Get a user's following list.
   *
   * @async
   * @param {string} userId - The user's unique identifier
   * @returns {Promise<UserProfile[]>} Array of followed user profiles
   */
  getFollowing: async (userId: string): Promise<UserProfile[]> => {
    const response = await api.get<UserProfile[]>(`/users/${userId}/following`);
    return response.data;
  },

  /**
   * Remove a follower (block them from following).
   *
   * @async
   * @param {string} followerId - The user ID to remove from followers
   * @returns {Promise<{ message: string }>} Response with confirmation message
   */
  removeFollower: async (followerId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/users/followers/${followerId}`);
    return response.data;
  },

  /**
   * Toggle follow status (follow/unfollow a user).
   * Sends a notification to the target user when following.
   *
   * @async
   * @param {string} targetId - The user ID to follow/unfollow
   * @returns {Promise<{ message: string }>} Response with confirmation message
   */
  toggleFollow: async (targetId: string): Promise<{ message: string }> => {
    const response = await api.post("/users/follow", { targetId });
    return response.data;
  },
};

/**
 * Reports API methods.
 * Create content reports for posts, comments, or users.
 *
 * @namespace reportsAPI
 */
export const reportsAPI = {
  /**
   * Create a new report.
   *
   * @async
   * @param {'post' | 'comment' | 'user'} targetType - Type of content being reported
   * @param {string} targetId - ID of the content to report
   * @param {string} reason - Description of why the content is being reported
   * @returns {Promise<{ message: string }>} Response with confirmation message
   */
  createReport: async (
    targetType: "post" | "comment" | "user",
    targetId: string,
    reason: string,
  ): Promise<{ message: string }> => {
    const response = await api.post("/reports", {
      targetType,
      targetId,
      reason,
    });
    return response.data;
  },
};

export default api;

/**
 * Re-export types for other modules to import consistently
 */
export type {
  LoginResponse,
  ErrorResponse,
  Notification,
  Post,
  Comment,
  User,
  UserProfile,
  Theme,
  Language,
} from "../utils/types";
