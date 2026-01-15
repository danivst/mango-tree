import { useState, useEffect, useMemo } from 'react'
import { adminAPI, Category } from '../../services/adminAPI'
import Snackbar from '../../components/Snackbar'
import { sortData, paginateData, getTotalPages, SortState } from '../../utils/tableUtils'
import './AdminPages.css'

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [creatorFilter, setCreatorFilter] = useState<'all' | 'system' | 'admin'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [sortState, setSortState] = useState<SortState>({ column: null, direction: null })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    type: 'success' | 'error'
  }>({ open: false, message: '', type: 'success' })

  useEffect(() => {
    fetchCategories()
  }, [])

  // Filter categories based on search, creator, and date range
  const filteredData = useMemo(() => {
    let filtered = categories

    // Search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((cat) => cat.name.toLowerCase().includes(query))
    }

    // Creator filter
    if (creatorFilter === 'system') {
      filtered = filtered.filter((cat) => !cat.createdBy || cat.createdBy === 'System')
    } else if (creatorFilter === 'admin') {
      filtered = filtered.filter((cat) => cat.createdBy && cat.createdBy !== 'System')
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom)
      filtered = filtered.filter((cat) => {
        const catDate = new Date(cat.createdAt)
        return catDate >= fromDate
      })
    }

    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((cat) => {
        const catDate = new Date(cat.createdAt)
        return catDate <= toDate
      })
    }

    return filtered
  }, [searchQuery, creatorFilter, dateFrom, dateTo, categories])

  // Sort filtered data
  const sortedData = useMemo(() => {
    return sortData(filteredData, sortState.column, sortState.direction, (cat, column) => {
      switch (column) {
        case 'name':
          return cat.name
        case 'added':
          return cat.createdAt
        case 'by':
          return cat.createdBy || 'System'
        default:
          return null
      }
    })
  }, [filteredData, sortState])

  // Paginate sorted data
  const paginatedData = useMemo(() => {
    return paginateData(sortedData, currentPage, itemsPerPage)
  }, [sortedData, currentPage, itemsPerPage])

  const totalPages = useMemo(() => {
    return getTotalPages(sortedData.length, itemsPerPage)
  }, [sortedData.length, itemsPerPage])

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchQuery, creatorFilter, dateFrom, dateTo])

  const handleSort = (column: string) => {
    setSortState((prev) => {
      if (prev.column === column) {
        if (prev.direction === 'asc') {
          return { column, direction: 'desc' }
        } else if (prev.direction === 'desc') {
          return { column: null, direction: null }
        }
      }
      return { column, direction: 'asc' }
    })
    setCurrentPage(1)
  }

  const getSortIcon = (column: string) => {
    if (sortState.column !== column) {
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
          <path d="M8 9l4-4 4 4M8 15l4 4 4-4" />
        </svg>
      )
    }
    if (sortState.direction === 'asc') {
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 9l4-4 4 4" />
        </svg>
      )
    }
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 15l4 4 4-4" />
      </svg>
    )
  }

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const data = await adminAPI.getCategories()
      setCategories(data)
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to load categories',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!categoryName || categoryName.trim().length === 0) {
      setSnackbar({
        open: true,
        message: 'Category name cannot be empty.',
        type: 'error',
      })
      return
    }

    if (categoryName.length > 20) {
      setSnackbar({
        open: true,
        message: 'Category name cannot be longer than 20 characters.',
        type: 'error',
      })
      return
    }

    try {
      await adminAPI.createCategory(categoryName.trim())
      setSnackbar({
        open: true,
        message: 'Category created successfully!',
        type: 'success',
      })
      setShowAddCategory(false)
      setCategoryName('')
      fetchCategories()
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to create category',
        type: 'error',
      })
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return
    }

    try {
      await adminAPI.deleteCategory(categoryId)
      setSnackbar({
        open: true,
        message: 'Category deleted successfully!',
        type: 'success',
      })
      fetchCategories()
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to delete category',
        type: 'error',
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Categories</h1>
        <div className="admin-page-actions">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className="admin-add-button"
            onClick={() => setShowAddCategory(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Category
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading...</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="sortable-header" onClick={() => handleSort('name')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    Category
                    {getSortIcon('name')}
                  </div>
                </th>
                <th className="sortable-header" onClick={() => handleSort('added')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    Added
                    {getSortIcon('added')}
                  </div>
                </th>
                <th className="sortable-header" onClick={() => handleSort('by')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    By
                    {getSortIcon('by')}
                  </div>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((category) => (
                <tr key={category._id}>
                  <td>{category.name}</td>
                  <td>{formatDate(category.createdAt)}</td>
                  <td>{category.createdBy ? category.createdBy : 'System'}</td>
                  <td>
                    <button
                      className="admin-delete-button"
                      onClick={() => handleDeleteCategory(category._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="admin-pagination">
              <button
                className="admin-pagination-button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="admin-pagination-info">
                Page {currentPage} of {totalPages} ({sortedData.length} total)
              </span>
              <button
                className="admin-pagination-button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h2 className="admin-modal-title">Add Category</h2>
            <form onSubmit={handleAddCategory}>
              <div className="admin-form-group">
                <label className="admin-form-label">Category</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                  maxLength={20}
                  placeholder="Enter category name (1-20 characters)"
                />
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {categoryName.length}/20 characters
                </p>
              </div>
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-button-secondary"
                  onClick={() => {
                    setShowAddCategory(false)
                    setCategoryName('')
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-button-primary"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </div>
  )
}

export default Categories
