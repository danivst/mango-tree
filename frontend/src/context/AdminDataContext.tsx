import React, { createContext, useContext, useState, useCallback } from 'react';
import { adminAPI, Category, Tag, User, Report, BannedUser, FlaggedContent } from '../services/adminAPI';

interface AdminDataState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  hasFetched: boolean;
}

interface AdminDataContextType {
  // Data
  categories: Category[];
  tags: Tag[];
  users: User[]; // With isBanned and banned_user_id merged
  bannedUsers: BannedUser[];
  reports: Report[];
  flaggedContent: FlaggedContent[];

  // States
  categoriesState: AdminDataState<Category>;
  tagsState: AdminDataState<Tag>;
  usersState: AdminDataState<User>;
  bannedUsersState: AdminDataState<BannedUser>;
  reportsState: AdminDataState<Report>;
  flaggedContentState: AdminDataState<FlaggedContent>;

  // Fetch functions
  fetchCategories: () => Promise<void>;
  fetchTags: () => Promise<void>;
  fetchUsers: () => Promise<void>; // Also fetches bannedUsers and merges
  fetchBannedUsers: () => Promise<void>;
  fetchReports: () => Promise<void>;
  fetchFlaggedContent: () => Promise<void>;

  // Initialize all
  initialize: () => Promise<void>;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export const AdminDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Individual states
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [flaggedContent, setFlaggedContent] = useState<FlaggedContent[]>([]);

  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [bannedUsersLoading, setBannedUsersLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [flaggedContentLoading, setFlaggedContentLoading] = useState(false);

  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [bannedUsersError, setBannedUsersError] = useState<string | null>(null);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [flaggedContentError, setFlaggedContentError] = useState<string | null>(null);

  const [categoriesFetched, setCategoriesFetched] = useState(false);
  const [tagsFetched, setTagsFetched] = useState(false);
  const [usersFetched, setUsersFetched] = useState(false);
  const [bannedUsersFetched, setBannedUsersFetched] = useState(false);
  const [reportsFetched, setReportsFetched] = useState(false);
  const [flaggedContentFetched, setFlaggedContentFetched] = useState(false);

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const data = await adminAPI.getCategories();
      setCategories(data);
      setCategoriesFetched(true);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to load categories';
      setCategoriesError(errorMsg);
      throw error;
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // Fetch Tags
  const fetchTags = useCallback(async () => {
    setTagsLoading(true);
    setTagsError(null);
    try {
      const data = await adminAPI.getTags();
      setTags(data);
      setTagsFetched(true);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to load tags';
      setTagsError(errorMsg);
      throw error;
    } finally {
      setTagsLoading(false);
    }
  }, []);

  // Fetch Users (also fetches banned users and merges ban status)
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const allUsers = await adminAPI.getAllUsers();
      const bannedList = await adminAPI.getBannedUsers();

      // Merge banned status into allUsers
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
      const errorMsg = error.response?.data?.message || 'Failed to load users';
      setUsersError(errorMsg);
      throw error;
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Fetch Banned Users (separate, for BannedUsers page)
  const fetchBannedUsers = useCallback(async () => {
    setBannedUsersLoading(true);
    setBannedUsersError(null);
    try {
      const data = await adminAPI.getBannedUsers();
      setBannedUsers(data);
      setBannedUsersFetched(true);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to load banned users';
      setBannedUsersError(errorMsg);
      throw error;
    } finally {
      setBannedUsersLoading(false);
    }
  }, []);

  // Fetch Reports (pending only)
  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    setReportsError(null);
    try {
      const data = await adminAPI.getReports();
      const pendingReports = data.filter((report: Report) => report.status === 'pending');
      setReports(pendingReports);
      setReportsFetched(true);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to load reports';
      setReportsError(errorMsg);
      throw error;
    } finally {
      setReportsLoading(false);
    }
  }, []);

  // Fetch Flagged Content (To Review)
  const fetchFlaggedContent = useCallback(async () => {
    setFlaggedContentLoading(true);
    setFlaggedContentError(null);
    try {
      const data = await adminAPI.getFlaggedContent();
      setFlaggedContent(data);
      setFlaggedContentFetched(true);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to load flagged content';
      setFlaggedContentError(errorMsg);
      throw error;
    } finally {
      setFlaggedContentLoading(false);
    }
  }, []);

  // Initialize all data
  const initialize = useCallback(async () => {
    await Promise.all([
      fetchCategories(),
      fetchTags(),
      fetchUsers(),
      fetchBannedUsers(),
      fetchReports(),
      fetchFlaggedContent(),
    ]);
  }, [fetchCategories, fetchTags, fetchUsers, fetchBannedUsers, fetchReports, fetchFlaggedContent]);

  const value: AdminDataContextType = {
    categories,
    tags,
    users,
    bannedUsers,
    reports,
    flaggedContent,
    categoriesState: { data: categories, loading: categoriesLoading, error: categoriesError, hasFetched: categoriesFetched },
    tagsState: { data: tags, loading: tagsLoading, error: tagsError, hasFetched: tagsFetched },
    usersState: { data: users, loading: usersLoading, error: usersError, hasFetched: usersFetched },
    bannedUsersState: { data: bannedUsers, loading: bannedUsersLoading, error: bannedUsersError, hasFetched: bannedUsersFetched },
    reportsState: { data: reports, loading: reportsLoading, error: reportsError, hasFetched: reportsFetched },
    flaggedContentState: { data: flaggedContent, loading: flaggedContentLoading, error: flaggedContentError, hasFetched: flaggedContentFetched },
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

export const useAdminData = (): AdminDataContextType => {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within AdminDataProvider');
  }
  return context;
};
