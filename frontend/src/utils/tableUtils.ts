export type SortDirection = 'asc' | 'desc' | null

export interface SortState {
  column: string | null
  direction: SortDirection
}

export const sortData = <T>(
  data: T[],
  column: string | null,
  direction: SortDirection,
  getValue: (item: T, column: string) => any
): T[] => {
  if (!column || !direction) return data

  return [...data].sort((a, b) => {
    const aVal = getValue(a, column)
    const bVal = getValue(b, column)

    // Handle null/undefined values
    if (aVal == null && bVal == null) return 0
    if (aVal == null) return direction === 'asc' ? -1 : 1
    if (bVal == null) return direction === 'asc' ? 1 : -1

    // Compare values
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const comparison = aVal.toLowerCase().localeCompare(bVal.toLowerCase())
      return direction === 'asc' ? comparison : -comparison
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return direction === 'asc' ? aVal - bVal : bVal - aVal
    }

    // Date comparison
    if (aVal instanceof Date && bVal instanceof Date) {
      return direction === 'asc' ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime()
    }

    // String date comparison
    const aDate = new Date(aVal)
    const bDate = new Date(bVal)
    if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
      return direction === 'asc' ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime()
    }

    // Fallback to string comparison
    const aStr = String(aVal).toLowerCase()
    const bStr = String(bVal).toLowerCase()
    const comparison = aStr.localeCompare(bStr)
    return direction === 'asc' ? comparison : -comparison
  })
}

export const paginateData = <T>(data: T[], page: number, itemsPerPage: number): T[] => {
  const startIndex = (page - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  return data.slice(startIndex, endIndex)
}

export const getTotalPages = (totalItems: number, itemsPerPage: number): number => {
  return Math.ceil(totalItems / itemsPerPage)
}
