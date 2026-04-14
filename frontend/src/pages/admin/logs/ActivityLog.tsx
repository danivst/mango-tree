/**
 * @file ActivityLog.tsx
 * @description Administrative interface for viewing and filtering system-wide activity logs.
 * Provides detailed tracking of user and admin actions (login, content creation, moderation)
 * with support for server-side pagination, date range filtering, and action type categorization.
 */

import { useState, useEffect, useMemo } from "react";
import { useThemeLanguage } from "../../../context/ThemeLanguageContext";
import { getTranslation } from "../../../utils/translations";
import { adminAPI } from "../../../services/admin-api";
import { SortState } from "../../../utils/table-utils";
import "../../../styles/shared.css";
import "./ActivityLog.css";
import Footer from "../../../components/global/Footer";
import { useSnackbar } from "../../../utils/snackbar";
import { AdminTable, ColumnDef } from "../../../components/admin/table";

// MUI Icon Imports
import HistoryIcon from "@mui/icons-material/History";

interface ActivityLogEntry {
  _id: string;
  userId: { _id: string; username: string } | null;
  actionType: string;
  targetId?: string;
  targetType?: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

const ActivityLog = () => {
  const { language } = useThemeLanguage();
  const t = (key: string, params?: Record<string, string>) =>
    getTranslation(language, key, params);
  const { showError } = useSnackbar();

  // State
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 50;

  // Filters
  const [search, setSearch] = useState("");
  const [actionType, setActionType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Sorting state
  const [sortState, setSortState] = useState<SortState>({
    column: "createdAt",
    direction: "desc",
  });

  /**
   * Fetches activity logs from the admin API with current filter and pagination state.
   * Updates local logs state and total pages for pagination.
   * * @async
   * @returns {Promise<void>}
   */
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getActivityLogs({
        page,
        limit,
        search: search || undefined,
        actionType: actionType || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setLogs(response.logs);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Failed to fetch activity logs:", error);
      }
      showError(t("somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, search, actionType, startDate, endDate]);

  /**
   * Updates the table sorting configuration.
   * Cycle logic: asc -> desc -> null.
   * * @param {string} column - The column key to sort by.
   */
  const handleSort = (column: string) => {
    setSortState((prev: SortState) => {
      if (prev.column === column) {
        if (prev.direction === "asc") return { column, direction: "desc" };
        if (prev.direction === "desc") return { column: null, direction: null };
      }
      return { column, direction: "asc" };
    });
  };

  /**
   * Performs client-side sorting on the current page of logs based on sortState.
   * Handles nested objects (username) and date parsing.
   */
  const sortedLogs = useMemo(() => {
    const sorted = [...logs];
    if (sortState.column) {
      sorted.sort((a, b) => {
        let valA: any = a[sortState.column as keyof ActivityLogEntry];
        let valB: any = b[sortState.column as keyof ActivityLogEntry];
        
        if (sortState.column === "username") {
          valA = a.userId?.username || "";
          valB = b.userId?.username || "";
        }
        
        if (typeof valA === "string" && sortState.column === "createdAt") {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        }
        
        if (valA < valB) return sortState.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortState.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [logs, sortState]);

  /**
   * Formats ISO date strings to localized readable format including time.
   * * @param {string} dateString - ISO date string
   * @returns {string} Formatted date string
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      language === "bg" ? "bg-BG" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  };

  /**
 * Renders a consistent, non-clickable label for the target of the log entry.
 * Displays only a truncated version of the ID for visual consistency.
 * * @param {ActivityLogEntry} entry - The log entry object
 * @returns {React.ReactNode}
 */
const renderTarget = (entry: ActivityLogEntry) => {
  if (!entry.targetId) {
    return <span className="text-muted">—</span>;
  }

  // Standardized style for all target types: just the truncated ID
  return (
    <span className="target-id-display">
      {entry.targetId.substring(0, 8)}...
    </span>
  );
};

  /**
   * Translates raw activity log descriptions into localized strings with parameters.
   * Extracts dynamic data (usernames, titles, reasons) from raw descriptions using RegEx.
   * * @param {string} actionType - Raw action enum from backend
   * @param {string} description - Raw description from backend
   * @param {string} [targetType] - Type of item acted upon
   * @returns {string} Localized and interpolated description
   */
  const getLocalizedDescription = (
    actionType: string,
    description: string,
    targetType?: string,
  ): string => {
    const keyMap: Record<string, string> = {
      LOGIN: "activityLogin",
      LOGOUT: "activityLogout",
      USERNAME_CHANGE: "activityUsernameChange",
      EMAIL_CHANGE: "activityEmailChange",
      PROFILE_IMAGE_CHANGE: "activityProfileImageChange",
      THEME_CHANGE: "activityThemeChange",
      LANGUAGE_CHANGE: "activityLanguageChange",
      BIO_UPDATE: "activityBioUpdate",
      PASSWORD_CHANGE: "activityPasswordChange",
      FOLLOW: "activityFollow",
      UNFOLLOW: "activityUnfollow",
      POST_CREATE: "activityPostCreate",
      POST_UPDATE: "activityPostEdit",
      POST_DELETE: "activityPostDelete",
      COMMENT_CREATE: "activityCommentCreate",
      COMMENT_EDIT: "activityCommentEdit",
      COMMENT_DELETE: "activityCommentDelete",
      LIKE: "activityLikePost",
      UNLIKE: "activityUnlikePost",
      LIKE_POST: "activityLikePost",
      UNLIKE_POST: "activityUnlikePost",
      LIKE_COMMENT: "activityLikeComment",
      UNLIKE_COMMENT: "activityUnlikeComment",
      CONTENT_APPROVE: "activityContentApprove",
      CONTENT_REJECT: "activityContentReject",
      BAN_USER: "activityBanUser",
      UNBAN_USER: "activityUnbanUser",
      "2FA_ENABLE": "activity2faEnable",
      "2FA_DISABLE": "activity2faDisable",
      CATEGORY_CREATE: "activityCategoryCreate",
      CATEGORY_UPDATE: "activityCategoryUpdate",
      CATEGORY_DELETE: "activityCategoryDelete",
      TAG_CREATE: "activityTagCreate",
      TAG_UPDATE: "activityTagUpdate",
      TAG_DELETE: "activityTagDelete",
      REPORT_SUBMIT: "activityReportSubmit",
      REPORT_RESOLVE: "activityReportResolve",
      REPORT_STATUS_UPDATE: "activityReportStatusUpdate",
      REPORT_ITEM_DELETE: "activityReportItemDelete",
    };

    let key = keyMap[actionType];
    if (actionType === "LIKE" && targetType === "comment") {
      key = "activityLikeComment";
    } else if (actionType === "UNLIKE" && targetType === "comment") {
      key = "activityUnlikeComment";
    }

    if (!key) return description;

    let params: Record<string, string> = {};
    try {
      switch (actionType) {
        case "USERNAME_CHANGE":
        case "EMAIL_CHANGE":
        case "THEME_CHANGE":
        case "LANGUAGE_CHANGE":
          const simpleMatch = description.match(/to (.+)$/);
          if (simpleMatch) {
            if (actionType === "USERNAME_CHANGE") params.username = simpleMatch[1];
            if (actionType === "EMAIL_CHANGE") params.email = simpleMatch[1];
            if (actionType === "THEME_CHANGE") params.theme = simpleMatch[1];
            if (actionType === "LANGUAGE_CHANGE") params.language = simpleMatch[1];
          }
          break;
        case "FOLLOW":
        case "UNFOLLOW":
          const userMatch = description.match(/user (.+)$/);
          if (userMatch) params.username = userMatch[1];
          break;
        case "POST_CREATE":
        case "POST_UPDATE":
        case "POST_DELETE":
          const titleMatch = description.match(/(?::\s*|")([^"]+)"?$/);
          if (titleMatch) params.title = titleMatch[1];
          break;
        case "CONTENT_APPROVE":
          const approveMatch = description.match(/Approved (.+) (.+)$/);
          if (approveMatch) {
            params.type = approveMatch[1];
            params.id = approveMatch[2];
          }
          break;
        case "CONTENT_REJECT":
          const rejectMatch = description.match(/Rejected (.+) (.+?)\. Reason:/);
          if (rejectMatch) {
            params.type = rejectMatch[1];
            params.id = rejectMatch[2];
            const reasonMatch = description.match(/Reason:\s*(.+)$/);
            if (reasonMatch) params.reason = reasonMatch[1];
          }
          break;
        case "BAN_USER":
          const banMatch = description.match(/Banned user (.+?)\. Reason:/);
          if (banMatch) params.username = banMatch[1];
          const banReasonMatch = description.match(/Reason:\s*(.+)$/);
          if (banReasonMatch) params.reason = banReasonMatch[1];
          break;
        case "UNBAN_USER":
          const unbanMatch = description.match(/Unbanned user (.+)$/);
          if (unbanMatch) params.username = unbanMatch[1];
          break;
        case "LIKE":
        case "UNLIKE":
          const idMatch = description.match(/(?:post|comment) (\w+)$/);
          if (idMatch) params.id = idMatch[1];
          break;
        case "CATEGORY_CREATE":
        case "CATEGORY_UPDATE":
        case "CATEGORY_DELETE":
        case "TAG_CREATE":
        case "TAG_UPDATE":
        case "TAG_DELETE":
          const nameMatch = description.match(/"([^"]+)"/);
          if (nameMatch) params.name = nameMatch[1];
          break;
        case "REPORT_SUBMIT":
          const reportMatch = description.match(/Reported (.+) (.+?)\. Reason:/);
          if (reportMatch) {
            params.targetType = reportMatch[1];
            params.targetId = reportMatch[2];
            const reportReasonMatch = description.match(/Reason:\s*(.+)$/);
            if (reportReasonMatch) params.reason = reportReasonMatch[1];
          }
          break;
        case "REPORT_STATUS_UPDATE":
          const statusMatch = description.match(/Updated report (.+?) status to (.+)$/);
          if (statusMatch) {
            params.id = statusMatch[1];
            params.status = statusMatch[2];
          }
          break;
        case "REPORT_ITEM_DELETE":
          const deleteMatch = description.match(/Deleted reported (.+) (.+)$/);
          if (deleteMatch) {
            params.targetType = deleteMatch[1];
            params.targetId = deleteMatch[2];
          }
          break;
      }
    } catch (err) {
      return description;
    }

    if (params.theme) params.theme = t(params.theme);
    if (params.language) {
      const langKey =
        params.language === "en"
          ? "english"
          : params.language === "bg"
            ? "bulgarian"
            : params.language;
      params.language = t(langKey);
    }
    if (params.type) params.type = t(params.type);
    if (params.targetType) params.targetType = t(params.targetType);

    return t(key, params);
  };

  /**
   * Extracts unique action types from the current log set to populate filter dropdown.
   */
  const actionTypes = useMemo(() => {
    const types = new Set<string>();
    logs.forEach((log) => types.add(log.actionType));
    return Array.from(types).sort();
  }, [logs]);

  /**
   * Resets all search and date filters to their default state and returns to page 1.
   */
  const clearFilters = () => {
    setSearch("");
    setActionType("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const columns: ColumnDef<ActivityLogEntry>[] = [
    {
      key: "createdAt",
      label: t("date"),
      sortable: true,
      minWidth: "150px",
      render: (log) => formatDate(log.createdAt),
    },
    {
      key: "username",
      label: t("user"),
      sortable: true,
      minWidth: "150px",
      render: (log) => log.userId?.username || "—",
    },
    {
      key: "actionType",
      label: t("action"),
      sortable: true,
      minWidth: "150px",
      render: (log) => <span className="action-badge">{log.actionType}</span>,
    },
    {
      key: "target",
      label: t("target"),
      sortable: false,
      minWidth: "150px",
      render: (log) => renderTarget(log),
    },
    {
      key: "description",
      label: t("description"),
      sortable: false,
      render: (log) =>
        getLocalizedDescription(
          log.actionType,
          log.description,
          log.targetType,
        ),
    },
    {
      key: "ipAddress",
      label: t("ipAddress"),
      sortable: false,
      minWidth: "150px",
      render: (log) => log.ipAddress || "—",
    },
  ];

  const emptyState = {
    icon: <HistoryIcon sx={{ fontSize: 40 }} />,
    title: t("noLogsFound"),
  };

  return (
    <div>
      <h1 className="page-container-title">{t("activityLog")}</h1>

      <AdminTable<ActivityLogEntry>
        data={sortedLogs}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        sortState={sortState}
        onSort={handleSort}
        searchQuery={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        columns={columns}
        loading={loading}
        error={""}
        hasFetched={!loading}
        onRefresh={fetchLogs}
        emptyState={emptyState}
        filterControls={
          <>
            <select
              value={actionType}
              onChange={(e) => {
                setActionType(e.target.value);
                setPage(1);
              }}
              className="filter-select"
            >
              <option value="">{t("allActions")}</option>
              {actionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="date-input"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="date-input"
            />
            <button className="btn-secondary" onClick={clearFilters}>
              {t("clearFilters")}
            </button>
          </>
        }
      />

      <Footer />
    </div>
  );
};

export default ActivityLog;