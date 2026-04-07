import React, { useState, useRef, useEffect } from "react";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { getTranslation } from "../../utils/translations";
import { SortState } from "../../utils/table-utils";
import "../../styles/shared.css";

export interface ColumnDef<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  minWidth?: string;
}

export interface AdminTableProps<T> {
  // Data
  data: T[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;

  // Sorting
  sortState: SortState;
  onSort: (column: string) => void;

  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;

  // Columns
  columns: ColumnDef<T>[];

  // Optional: Additional filter controls (rendered beside search bar)
  filterControls?: React.ReactNode;

  // Actions column (alternative to including actions in columns)
  actionsRender?: (item: T) => React.ReactNode;

  // State
  loading: boolean;
  error: string | null;
  hasFetched: boolean;

  // Empty state (custom or default)
  emptyState?: {
    icon: React.ReactNode;
    title: string;
    message?: string;
  };

  // Refresh
  onRefresh: () => void;
  refreshDisabled?: boolean;

  // Optional features
  enableDragScroll?: boolean;
  tableContainerClassName?: string;
}

function DefaultEmptyState({ title, message, icon }: { title: string; message?: string; icon?: React.ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon || <span className="material-icons">inbox</span>}
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

  // Drag-to-scroll state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const scrollStartLeft = useRef(0);

  // Drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!enableDragScroll) return;
    const container = tableContainerRef.current;
    if (!container) return;

    // Only start drag if clicking on the container (not on interactive elements)
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

  // Build columns array, optionally appending actions column
  const tableColumns = actionsRender
    ? [...columns, { key: 'actions', label: t('actions') || 'Actions', sortable: false }]
    : columns;

  // Render sort icon
  const getSortIcon = (columnKey: string) => {
    if (sortState.column !== columnKey) {
      return (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="sort-icon-inactive"
        >
          <path d="M8 9l4-4 4 4M8 15l4 4 4-4" />
        </svg>
      );
    }
    if (sortState.direction === "asc") {
      return (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 9l4-4 4 4" />
        </svg>
      );
    }
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 15l4 4 4-4" />
      </svg>
    );
  };

  // Render header cell content directly in loop, so no fragment needed.
  // This function returns the content of the th.
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

  // Determine container class
  const containerClass = enableDragScroll
    ? `table-container table-grab ${tableContainerClassName || ''}`.trim()
    : `table-container ${tableContainerClassName || ''}`.trim();

  return (
    <div className="mb-5">
      {/* Toolbar: Refresh, Search, Filter Controls */}
      <div className="page-container-actions">
        <button
          className="btn-secondary icon-btn mr-2"
          onClick={onRefresh}
          disabled={loading || refreshDisabled}
        >
          <span className="material-icons text-base">refresh</span>
          {t("refresh")}
        </button>
        <input
          type="text"
          className="search-input"
          placeholder={t("search") + "..."}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {filterControls}
      </div>

      {/* Error */}
      {error && (
        <div className="error-box-colored">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="loading">{t("loading")}</div>
      ) : !hasFetched ? (
        <div className="loading">
          No data loaded. Click Refresh to load data.
        </div>
      ) : data.length === 0 ? (
        emptyState ? (
          <DefaultEmptyState
            icon={emptyState.icon}
            title={emptyState.title}
            message={emptyState.message}
          />
        ) : (
          <DefaultEmptyState title="No data available" />
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
                    style={col.minWidth ? { minWidth: col.minWidth } : undefined}
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
                        : (item as any)[col.key] as React.ReactNode}
                    </td>
                  ))}
                  {actionsRender && (
                    <td>
                      <div className="table-actions">
                        {actionsRender(item)}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-button"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                {t("previous")}
              </button>
              <span className="pagination-info">
                {t("page")} {currentPage} {t("of")} {totalPages} ({data.length} {t("total")})
              </span>
              <button
                className="pagination-button"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                {t("next")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
