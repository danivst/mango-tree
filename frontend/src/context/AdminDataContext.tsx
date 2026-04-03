import React, { createContext, useContext, useState, useCallback } from "react";
import {
  adminAPI,
  Category,
  Tag,
  User,
  Report,
  BannedUser,
  FlaggedContent,
} from "../services/admin-api";
import { useThemeLanguage } from "./ThemeLanguageContext";
import { getTranslation } from "../utils/translations";

/**
 * @template T
 * @interface AdminDataState
 * @description Generic state container for admin data entities.
 * Tracks the data array, loading status, error message, and fetched flag.
 *
 * @property {T[]} data - Array of entity data objects
 * @property {boolean} loading - True if a fetch operation is currently in progress
 * @property {string | null} error - Error message if fetch failed, null if successful or not attempted
 * @property {boolean} hasFetched - True if at least one successful fetch has completed for this entity
 */

interface AdminDataState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  hasFetched: boolean;
}

/**
 * @interface AdminDataContextType
 * @description Context API interface for admin dashboard data management.
 * Provides centralized access to all admin-visible data entities and their states.
 * Each entity follows a consistent state pattern: raw data + state container.
 *
 * Data Entities:
 * - categories: Content categories for posts
 * - tags: System tags for content classification
 * - users: All users with merged ban status (isBanned, banned_user_id)
 * - bannedUsers: Banned user records (separate endpoint)
 * - reports: Pending user reports only (status === "pending")
 * - flaggedContent: Posts/comments flagged by AI moderation for review
 *
 * State Containers (parallel to data):
 * - *State properties provide loading, error, and fetch completion info without separate state variables
 *
 * Operations:
 * - Individual fetch* functions for selective loading
 * - initialize() fetches all admin data in parallel
 *
 * @property {Category[]} categories - Content categories
 * @property {Tag[]} tags - System tags
 * @property {User[]} users - All users with merged ban status (isBanned, banned_user_id)
 * @property {BannedUser[]} bannedUsers - Banned user records
 * @property {Report[]} reports - Pending user reports only (status === "pending")
 * @property {FlaggedContent[]} flaggedContent - Posts/comments flagged for admin review
 *
 * @property {AdminDataState<Category>} categoriesState - State container for categories
 * @property {AdminDataState<Tag>} tagsState - State container for tags
 * @property {AdminDataState<User>} usersState - State container for users
 * @property {AdminDataState<BannedUser>} bannedUsersState - State container for banned users
 * @property {AdminDataState<Report>} reportsState - State container for reports
 * @property {AdminDataState<FlaggedContent>} flaggedContentState - State container for flagged content
 *
 * @property {() => Promise<void>} fetchCategories - Fetch all categories
 * @property {() => Promise<void>} fetchTags - Fetch all tags
 * @property {() => Promise<void>} fetchUsers - Fetch all users + merge ban status, also updates bannedUsers
 * @property {() => Promise<void>} fetchBannedUsers - Fetch banned users list (standalone)
 * @property {() => Promise<void>} fetchReports - Fetch pending reports only (status="pending")
 * @property {() => Promise<void>} fetchFlaggedContent - Fetch AI-flagged content for human review
 * @property {() => Promise<void>} initialize - Fetch all admin data in parallel (used on dashboard mount)
 */

interface AdminDataContextType {
  // Data arrays
  categories: Category[];
  tags: Tag[];
  users: User[];
  bannedUsers: BannedUser[];
  reports: Report[];
  flaggedContent: FlaggedContent[];

  // State containers
  categoriesState: AdminDataState<Category>;
  tagsState: AdminDataState<Tag>;
  usersState: AdminDataState<User>;
  bannedUsersState: AdminDataState<BannedUser>;
  reportsState: AdminDataState<Report>;
  flaggedContentState: AdminDataState<FlaggedContent>;

  // Fetch functions
  fetchCategories: () => Promise<void>;
  fetchTags: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchBannedUsers: () => Promise<void>;
  fetchReports: () => Promise<void>;
  fetchFlaggedContent: () => Promise<void>;

  // Initialize all
  initialize: () => Promise<void>;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(
  undefined,
);

/**
 * @file AdminDataContext.tsx
 * @description React Context for centralized admin dashboard data management.
 * Provides state and operations for all admin-visible entities (users, reports, content review, categories, tags).
 * Implements a consistent pattern: each entity has raw data + loading/error/fetched state.
 *
 * Architecture:
 * - Separate useState hooks for each data array and its loading/error/fetched flags
 * - useCallback wraps all fetch functions to prevent unnecessary re-renders
 * - Context value exposes both raw data arrays and aggregated state containers
 * - Localized error messages via getTranslation (user's current language)
 *
 * Special Business Logic:
 * - fetchUsers: Fetches all users AND banned users in parallel, then merges ban status into user objects.
 *   Result: users array has isBanned (boolean) and banned_user_id (string | undefined) fields.
 * - fetchReports: Backend returns all reports, but we filter to only pending (status="pending") for admin view.
 * - fetchFlaggedContent: Gets AI-flagged posts/comments that require human moderation review.
 *
 * Usage:
 * - Wrap admin dashboard layout with <AdminDataProvider>
 * - Child pages call useAdminData() to access data and trigger fetches
 * - Dashboard page calls initialize() on mount to populate everything
 *
 * @component
 * @requires useThemeLanguage - Provides translation function for error messages
 * @requires adminAPI - API service for all admin data endpoints
 */

export const AdminDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);

  // ========== DATA ARRAYS ==========
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [flaggedContent, setFlaggedContent] = useState<FlaggedContent[]>([]);

  // ========== LOADING STATES ==========
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [bannedUsersLoading, setBannedUsersLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [flaggedContentLoading, setFlaggedContentLoading] = useState(false);

  // ========== ERROR STATES ==========
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [bannedUsersError, setBannedUsersError] = useState<string | null>(null);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [flaggedContentError, setFlaggedContentError] = useState<string | null>(null);

  // ========== FETCHED FLAGS ==========
  const [categoriesFetched, setCategoriesFetched] = useState(false);
  const [tagsFetched, setTagsFetched] = useState(false);
  const [usersFetched, setUsersFetched] = useState(false);
  const [bannedUsersFetched, setBannedUsersFetched] = useState(false);
  const [reportsFetched, setReportsFetched] = useState(false);
  const [flaggedContentFetched, setFlaggedContentFetched] = useState(false);

  // ========== FETCH FUNCTIONS ==========

  /**
   * Fetch all categories from the backend.
   * Sets loading state, clears error, stores data, marks fetched.
   * Throws on error to allow caller (e.g., initialize) to handle.
   */
  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const data = await adminAPI.getCategories();
      setCategories(data);
      setCategoriesFetched(true);
    } catch (error: any) {
      const errorMsg = t("failedToLoadCategories");
      setCategoriesError(errorMsg);
      throw error;
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  /**
   * Fetch all tags from the backend.
   * Similar error handling and state updates as fetchCategories.
   */
  const fetchTags = useCallback(async () => {
    setTagsLoading(true);
    setTagsError(null);
    try {
      const data = await adminAPI.getTags();
      setTags(data);
      setTagsFetched(true);
    } catch (error: any) {
      const errorMsg = t("failedToLoadTags");
      setTagsError(errorMsg);
      throw error;
    } finally {
      setTagsLoading(false);
    }
  }, []);

  /**
   * Fetch all users and merge their ban status from banned users list.
   * This is a combined operation:
   * 1. Fetch all users
   * 2. Fetch all banned users
   * 3. Merge: for each user, set isBanned=true and banned_user_id if found in banned list
   * 4. Updates both users and bannedUsers state
   */
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const allUsers = await adminAPI.getAllUsers();
      const bannedList = await adminAPI.getBannedUsers();

      // Merge banned status into allUsers array
      const usersWithBanStatus = allUsers.map((user) => {
        const bannedInfo = bannedList.find(
          (bUser) => bUser.original_user_id === user._id,
        );
        return {
          ...user,
          isBanned: !!bannedInfo,
          banned_user_id: bannedInfo ? bannedInfo._id : undefined,
        };
      });

      setUsers(usersWithBanStatus);
      setBannedUsers(bannedList);
      setUsersFetched(true);
      setBannedUsersFetched(true);
    } catch (error: any) {
      const errorMsg = t("failedToLoadUsers");
      setUsersError(errorMsg);
      throw error;
    } finally {
      setUsersLoading(false);
    }
  }, []);

  /**
   * Fetch banned users list separately.
   * Used by BannedUsers page which only needs banned users, not the merged user list.
   */
  const fetchBannedUsers = useCallback(async () => {
    setBannedUsersLoading(true);
    setBannedUsersError(null);
    try {
      const data = await adminAPI.getBannedUsers();
      setBannedUsers(data);
      setBannedUsersFetched(true);
    } catch (error: any) {
      const errorMsg = t("failedToLoadBannedUsers");
      setBannedUsersError(errorMsg);
      throw error;
    } finally {
      setBannedUsersLoading(false);
    }
  }, []);

  /**
   * Fetch user reports, filtering to only pending status.
   * Backend returns all reports, but admin view only cares about pending ones.
   */
  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    setReportsError(null);
    try {
      const data = await adminAPI.getReports();
      const pendingReports = data.filter(
        (report: Report) => report.status === "pending",
      );
      setReports(pendingReports);
      setReportsFetched(true);
    } catch (error: any) {
      const errorMsg = t("failedToLoadReports");
      setReportsError(errorMsg);
      throw error;
    } finally {
      setReportsLoading(false);
    }
  }, []);

  /**
   * Fetch content flagged by AI moderation for human review.
   * This populates the "To Review" queue where admins approve/reject AI-moderated content.
   */
  const fetchFlaggedContent = useCallback(async () => {
    setFlaggedContentLoading(true);
    setFlaggedContentError(null);
    try {
      const data = await adminAPI.getFlaggedContent();
      setFlaggedContent(data);
      setFlaggedContentFetched(true);
    } catch (error: any) {
      const errorMsg = t("failedToLoadFlaggedContent");
      setFlaggedContentError(errorMsg);
      throw error;
    } finally {
      setFlaggedContentLoading(false);
    }
  }, []);

  /**
   * Initialize all admin data by calling all fetch functions in parallel.
   * Used by Admin Dashboard on mount to populate all admin pages at once.
   * Errors from individual fetches are not caught here; they bubble up
   * to allow Dashboard to handle partial failures gracefully.
   */
  const initialize = useCallback(async () => {
    await Promise.all([
      fetchCategories(),
      fetchTags(),
      fetchUsers(),
      fetchBannedUsers(),
      fetchReports(),
      fetchFlaggedContent(),
    ]);
  }, [
    fetchCategories,
    fetchTags,
    fetchUsers,
    fetchBannedUsers,
    fetchReports,
    fetchFlaggedContent,
  ]);

  // ========== CONTEXT VALUE ==========
  /**
   * Builds the context value object.
   * Exposes both raw data arrays and state container objects for each entity.
   * State containers allow components to access loading/error status without managing multiple separate state variables.
   */
  const value: AdminDataContextType = {
    categories,
    tags,
    users,
    bannedUsers,
    reports,
    flaggedContent,
    categoriesState: {
      data: categories,
      loading: categoriesLoading,
      error: categoriesError,
      hasFetched: categoriesFetched,
    },
    tagsState: {
      data: tags,
      loading: tagsLoading,
      error: tagsError,
      hasFetched: tagsFetched,
    },
    usersState: {
      data: users,
      loading: usersLoading,
      error: usersError,
      hasFetched: usersFetched,
    },
    bannedUsersState: {
      data: bannedUsers,
      loading: bannedUsersLoading,
      error: bannedUsersError,
      hasFetched: bannedUsersFetched,
    },
    reportsState: {
      data: reports,
      loading: reportsLoading,
      error: reportsError,
      hasFetched: reportsFetched,
    },
    flaggedContentState: {
      data: flaggedContent,
      loading: flaggedContentLoading,
      error: flaggedContentError,
      hasFetched: flaggedContentFetched,
    },
    fetchCategories,
    fetchTags,
    fetchUsers,
    fetchBannedUsers,
    fetchReports,
    fetchFlaggedContent,
    initialize,
  };

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
};

/**
 * Custom hook for consuming AdminDataContext.
 * Ensures hook is used within AdminDataProvider, throws error otherwise.
 *
 * @returns {AdminDataContextType} Complete admin data context value
 */
export const useAdminData = (): AdminDataContextType => {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error("useAdminData must be used within AdminDataProvider");
  }
  return context;
};
