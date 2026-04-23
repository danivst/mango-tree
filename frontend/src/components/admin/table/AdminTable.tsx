/**
 * @file AdminTable.tsx
 * @description A highly reusable, generic data table component designed for administrative interfaces.
 * Updated to use Material UI Icons for sorting and empty states.
 */

import React, { useState, useRef, useEffect } from "react";
// Import MUI Icons
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import InboxIcon from '@mui/icons-material/Inbox';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { useThemeLanguage } from "../../../context/ThemeLanguageContext";
import { getTranslation } from "../../../utils/translations";
import { SortState } from "../../../utils/table-utils";
import "../../../styles/shared.css";

export interface ColumnDef<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  minWidth?: string;
}

export interface AdminTableProps<T> {
  data: T[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  sortState: SortState;
  onSort: (column: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  columns: ColumnDef<T>[];
  filterControls?: React.ReactNode;
  actionsRender?: (item: T) => React.ReactNode;
  loading: boolean;
  error: string | null;
  hasFetched: boolean;
  emptyState?: {
    icon: React.ReactNode;
    title: string;
    message?: string;
  };
  onRefresh: () => void;
  refreshDisabled?: boolean;
  enableDragScroll?: boolean;
  tableContainerClassName?: string;
}

/**
 * Renders a visual empty state using MUI Icons.
 */
function DefaultEmptyState({
  title,
  message,
  icon,
}: {
  title: string;
  message?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon || <InboxIcon sx={{ fontSize: 48 }} />}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {message && <p className="empty-state-message">{message}</p>}
    </div>
  );
}

export default function AdminTable<T>({
  data,
  currentPage,
  totalPages,
  onPageChange,
  sortState,
  onSort,
  searchQuery,
  onSearchChange,
  columns,
  filterControls,
  actionsRender,
  loading,
  error,
  hasFetched,
  emptyState,
  onRefresh,
  refreshDisabled = false,
  enableDragScroll = false,
  tableContainerClassName,
}: AdminTableProps<T>) {
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const scrollStartLeft = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!enableDragScroll) return;
    const container = tableContainerRef.current;
    if (!container) return;

    if (
      (e.target as HTMLElement).tagName === "INPUT" ||
      (e.target as HTMLElement).tagName === "BUTTON" ||
      (e.target as HTMLElement).tagName === "A" ||
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest("a")
    ) {
      return;
    }

    e.preventDefault();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    scrollStartLeft.current = container.scrollLeft;
    document.body.style.userSelect = "none";
    if (container) container.style.cursor = "grabbing";
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const container = tableContainerRef.current;
      if (!container) return;
      const deltaX = e.clientX - dragStartX.current;
      container.scrollLeft = scrollStartLeft.current - deltaX;
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        document.body.style.userSelect = "";
        const container = tableContainerRef.current;
        if (container) container.style.cursor = "grab";
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const tableColumns = actionsRender
    ? [
        ...columns,
        { key: "actions", label: t("actions") || "Actions", sortable: false },
      ]
    : columns;

  /**
   * Helper to render MUI sort icons based on current state.
   */
  const getSortIcon = (columnKey: string) => {
    if (sortState.column !== columnKey) {
      return <UnfoldMoreIcon sx={{ fontSize: 16, opacity: 0.5 }} />;
    }
    return sortState.direction === "asc" 
      ? <KeyboardArrowUpIcon sx={{ fontSize: 16 }} /> 
      : <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />;
  };

  const renderHeaderContent = (col: ColumnDef<T>) => {
    if (col.sortable) {
      return (
        <div className="sort-header-content">
          {col.label}
          {getSortIcon(col.key)}
        </div>
      );
    }
    return col.label;
  };

  const containerClass = enableDragScroll
    ? `table-container table-grab ${tableContainerClassName || ""}`.trim()
    : `table-container ${tableContainerClassName || ""}`.trim();

  return (
    <div className="mb-5">
      <div className="page-container-actions">
        <button
          className="btn-secondary icon-btn mr-2"
          onClick={onRefresh}
          disabled={loading || refreshDisabled}
        >
          <RefreshIcon sx={{ fontSize: 18, marginRight: '4px' }} />
          {t("refresh")}
        </button>
        <div className="search-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <SearchIcon sx={{ position: 'absolute', left: '10px', fontSize: 20, opacity: 0.5 }} />
          <input
            type="text"
            className="search-input"
            style={{ paddingLeft: '35px' }}
            placeholder={t("search") + "..."}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        {filterControls}
      </div>

      {error && (
        <div className="error-box-colored">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="loading">{t("loading")}</div>
      ) : !hasFetched ? (
        <div className="loading">
          {t("noDataLoaded")}. {t("clickRefreshToLoad")}
        </div>
      ) : data.length === 0 ? (
        emptyState ? (
          <DefaultEmptyState
            icon={emptyState.icon}
            title={emptyState.title}
            message={emptyState.message}
          />
        ) : (
          <DefaultEmptyState title={t("noDataLoaded")} />
        )
      ) : (
        <div
          ref={tableContainerRef}
          className={containerClass}
          onMouseDown={handleMouseDown}
        >
          <table className="table">
            <thead>
              <tr>
                {tableColumns.map((col) => (
                  <th
                    key={col.key}
                    className={col.sortable ? "sortable-header" : undefined}
                    style={
                      col.minWidth ? { minWidth: col.minWidth } : undefined
                    }
                    onClick={col.sortable ? () => onSort(col.key) : undefined}
                  >
                    {renderHeaderContent(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={idx}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render
                        ? col.render(item)
                        : ((item as any)[col.key] as React.ReactNode)}
                    </td>
                  ))}
                  {actionsRender && (
                    <td>
                      <div className="table-actions">{actionsRender(item)}</div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-button icon-btn"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeftIcon sx={{ fontSize: 20 }} />
                {t("previous")}
              </button>
              <span className="pagination-info">
                {t("page")} {currentPage} {t("of")} {totalPages} ({data.length}{" "}
                {t("total")})
              </span>
              <button
                className="pagination-button icon-btn"
                onClick={() =>
                  onPageChange(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
              >
                {t("next")}
                <ChevronRightIcon sx={{ fontSize: 20 }} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}