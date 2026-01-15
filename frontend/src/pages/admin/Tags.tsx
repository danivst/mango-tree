import { useState, useEffect, useMemo } from 'react'
import { adminAPI, Tag } from '../../services/adminAPI'
import Snackbar from '../../components/Snackbar'
import { sortData, paginateData, getTotalPages, SortState } from '../../utils/tableUtils'
import './AdminPages.css'

const Tags = () => {
  const [tags, setTags] = useState<Tag[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [creatorFilter, setCreatorFilter] = useState<'all' | 'system' | 'admin'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAddTag, setShowAddTag] = useState(false)
  const [tagName, setTagName] = useState('')
  const [sortState, setSortState] = useState<SortState>({ column: null, direction: null })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    type: 'success' | 'error'
  }>({ open: false, message: '', type: 'success' })

  useEffect(() => {
    fetchTags()
  }, [])

  // Filter tags based on search, creator, and date range
  const filteredData = useMemo(() => {
    let filtered = tags

    // Search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((tag) => tag.name.toLowerCase().includes(query))
    }

    // Creator filter
    if (creatorFilter === 'system') {
      filtered = filtered.filter((tag) => !tag.createdBy || tag.createdBy === 'System')
    } else if (creatorFilter === 'admin') {
      filtered = filtered.filter((tag) => tag.createdBy && tag.createdBy !== 'System')
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom)
      filtered = filtered.filter((tag) => {
        const tagDate = new Date(tag.createdAt)
        return tagDate >= fromDate
      })
    }

    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((tag) => {
        const tagDate = new Date(tag.createdAt)
        return tagDate <= toDate
      })
    }

    return filtered
  }, [searchQuery, creatorFilter, dateFrom, dateTo, tags])

  // Sort filtered data
  const sortedData = useMemo(() => {
    return sortData(filteredData, sortState.column, sortState.direction, (tag, column) => {
      switch (column) {
        case 'name':
          return tag.name
        case 'added':
          return tag.createdAt
        case 'by':
          return tag.createdBy || 'System'
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

  const fetchTags = async () => {
    try {
      setLoading(true)
      const data = await adminAPI.getTags()
      setTags(data)
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to load tags',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!tagName || tagName.trim().length === 0) {
      setSnackbar({
        open: true,
        message: 'Tag name cannot be empty.',
        type: 'error',
      })
      return
    }

    if (tagName.length > 20) {
      setSnackbar({
        open: true,
        message: 'Tag name cannot be longer than 20 characters.',
        type: 'error',
      })
      return
    }

    try {
      await adminAPI.createTag(tagName.trim())
      setSnackbar({
        open: true,
        message: 'Tag created successfully!',
        type: 'success',
      })
      setShowAddTag(false)
      setTagName('')
      fetchTags()
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to create tag',
        type: 'error',
      })
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    if (!window.confirm('Are you sure you want to delete this tag?')) {
      return
    }

    try {
      await adminAPI.deleteTag(tagId)
      setSnackbar({
        open: true,
        message: 'Tag deleted successfully!',
        type: 'success',
      })
      fetchTags()
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to delete tag',
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
        <h1 className="admin-page-title">Tags</h1>
        <div className="admin-page-actions">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className="admin-add-button"
            onClick={() => setShowAddTag(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Tag
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
                    Tag
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
              {paginatedData.map((tag) => (
                <tr key={tag._id}>
                  <td>{tag.name}</td>
                  <td>{formatDate(tag.createdAt)}</td>
                  <td>{tag.createdBy ? tag.createdBy : 'System'}</td>
                  <td>
                    <button
                      className="admin-delete-button"
                      onClick={() => handleDeleteTag(tag._id)}
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

      {/* Add Tag Modal */}
      {showAddTag && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h2 className="admin-modal-title">Add Tag</h2>
            <form onSubmit={handleAddTag}>
              <div className="admin-form-group">
                <label className="admin-form-label">Tag</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  required
                  maxLength={20}
                  placeholder="Enter tag name (1-20 characters)"
                />
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {tagName.length}/20 characters
                </p>
              </div>
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-button-secondary"
                  onClick={() => {
                    setShowAddTag(false)
                    setTagName('')
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-button-primary"
                >
                  Create Tag
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

export default Tags
