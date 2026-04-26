/**
 * @file tableUtils.ts
 * @description Generic utility functions for sorting and paginating tabular data.
 * Used primarily in admin tables and any list views with sortable columns.
 */

/**
 * Sort direction for table columns.
 * @typedef {'asc' | 'desc' | null} SortDirection
 */
export type SortDirection = 'asc' | 'desc' | null;

/**
 * State object for table sorting configuration.
 *
 * @interface SortState
 * @property {string | null} column - The column key to sort by (null for no sorting)
 * @property {SortDirection} direction - Sort direction ('asc', 'desc', or null)
 */
export interface SortState {
  column: string | null;
  direction: SortDirection;
}

/**
 * Sort an array of objects based on a column and direction.
 * Handles strings, numbers, Dates, and ISO date strings.
 *
 * @function sortData
 * @template T - The type of objects being sorted
 * @param {T[]} data - The array to sort ( copied, not mutated )
 * @param {string | null} column - The column key to sort by
 * @param {SortDirection} direction - Sort direction ('asc' or 'desc')
 * @param {(item: T, column: string) => any} getValue - Function to extract the sort value from an item
 * @returns {T[]} A new sorted array
 *
 * @example
 * ```ts
 * const sorted = sortData(users, 'username', 'asc', u => u.username);
 * ```
 */
export const sortData = <T>(
  data: T[],
  column: string | null,
  direction: SortDirection,
  getValue: (item: T, column: string) => any
): T[] => {
  if (!column || !direction) return data;

  return [...data].sort((a, b) => {
    const aVal = getValue(a, column);
    const bVal = getValue(b, column);

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return direction === 'asc' ? -1 : 1;
    if (bVal == null) return direction === 'asc' ? 1 : -1;

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const comparison = aVal.toLowerCase().localeCompare(bVal.toLowerCase());
      return direction === 'asc' ? comparison : -comparison;
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    }

    if (aVal instanceof Date && bVal instanceof Date) {
      return direction === 'asc' ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime();
    }

    const aDate = new Date(aVal);
    const bDate = new Date(bVal);
    if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
      return direction === 'asc' ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime();
    }

    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    const comparison = aStr.localeCompare(bStr);
    return direction === 'asc' ? comparison : -comparison;
  });
};

/**
 * Paginate an array by returning a slice for a given page.
 *
 * @function paginateData
 * @template T - The type of items in the array
 * @param {T[]} data - The full data array
 * @param {number} page - The page number (1-indexed)
 * @param {number} itemsPerPage - Number of items per page
 * @returns {T[]} The items for the requested page
 *
 * @example
 * ```ts
 * const page1 = paginateData(items, 1, 10); // items 0-9
 * const page2 = paginateData(items, 2, 10); // items 10-19
 * ```
 */
export const paginateData = <T>(data: T[], page: number, itemsPerPage: number): T[] => {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return data.slice(startIndex, endIndex);
};

/**
 * Calculate the total number of pages given total items and items per page.
 *
 * @function getTotalPages
 * @param {number} totalItems - Total number of items
 * @param {number} itemsPerPage - Number of items per page
 * @returns {number} Total number of pages (rounds up)
 */
export const getTotalPages = (totalItems: number, itemsPerPage: number): number => {
  return Math.ceil(totalItems / itemsPerPage);
};
