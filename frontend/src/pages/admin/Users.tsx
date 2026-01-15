import { useState, useEffect, useMemo } from 'react'
import { adminAPI, User } from '../../services/adminAPI'
import Snackbar from '../../components/Snackbar'
import { sortData, paginateData, getTotalPages, SortState } from '../../utils/tableUtils'
import './AdminPages.css'

type DeleteStep = 'warning' | 'reason' | 'confirm' | null

const Users = () => {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleteStep, setDeleteStep] = useState<DeleteStep>(null)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [sortState, setSortState] = useState<SortState>({ column: null, direction: null })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    type: 'success' | 'error'
  }>({ open: false, message: '', type: 'success' })

  useEffect(() => {
    fetchUsers()
  }, [])

  // Filter users based on search, role, and date range
  const filteredData = useMemo(() => {
    let filtered = users

    // Search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (user) =>
          user.username.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom)
      filtered = filtered.filter((user) => {
        const userDate = new Date(user.createdAt)
        return userDate >= fromDate
      })
    }

    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999) // Include entire end day
      filtered = filtered.filter((user) => {
        const userDate = new Date(user.createdAt)
        return userDate <= toDate
      })
    }

    return filtered
  }, [searchQuery, roleFilter, dateFrom, dateTo, users])

  // Sort filtered data
  const sortedData = useMemo(() => {
    return sortData(filteredData, sortState.column, sortState.direction, (user, column) => {
      switch (column) {
        case 'username':
          return user.username
        case 'email':
          return user.email
        case 'role':
          return user.role
        case 'created':
          return user.createdAt
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
  }, [searchQuery, roleFilter, dateFrom, dateTo])

  const handleSort = (column: string) => {
    setSortState((prev) => {
      if (prev.column === column) {
        // Cycle through: asc -> desc -> null
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

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await adminAPI.getAllUsers()
      setUsers(data)
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to load users',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (userId: string) => {
    setDeleteUserId(userId)
    setDeleteStep('warning')
  }

  const handleDeleteContinue = () => {
    setDeleteStep('reason')
  }

  const handleDeleteBack = () => {
    setDeleteStep('warning')
    setDeleteReason('')
  }

  const handleDeleteTerminate = () => {
    setDeleteStep('confirm')
  }

  const handleDeleteConfirm = async () => {
    if (!deleteUserId) return

    try {
      await adminAPI.deleteUser(deleteUserId, deleteReason)
      setSnackbar({
        open: true,
        message: 'Successfully deleted account!',
        type: 'success',
      })
      setDeleteStep(null)
      setDeleteUserId(null)
      setDeleteReason('')
      fetchUsers()
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to delete user',
        type: 'error',
      })
    }
  }

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!adminEmail || !adminEmail.includes('@')) {
      setSnackbar({
        open: true,
        message: 'Email must contain @ symbol.',
        type: 'error',
      })
      return
    }

    try {
      await adminAPI.createAdmin(adminEmail)
      setSnackbar({
        open: true,
        message: 'Admin account created successfully! Password setup email sent.',
        type: 'success',
      })
      setShowAddAdmin(false)
      setAdminEmail('')
      fetchUsers()
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to create admin',
        type: 'error',
      })
    }
  }

  const selectedUser = deleteUserId ? users.find((u) => u._id === deleteUserId) : null

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Users</h1>
        <div className="admin-page-actions">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className="admin-add-button"
            onClick={() => setShowAddAdmin(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Admin
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
                <th className="sortable-header" onClick={() => handleSort('username')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    Username
                    {getSortIcon('username')}
                  </div>
                </th>
                <th className="sortable-header" onClick={() => handleSort('email')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    Email
                    {getSortIcon('email')}
                  </div>
                </th>
                <th className="sortable-header" onClick={() => handleSort('role')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    Role
                    {getSortIcon('role')}
                  </div>
                </th>
                <th className="sortable-header" onClick={() => handleSort('created')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    Created
                    {getSortIcon('created')}
                  </div>
                </th>
                <th>Profile</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((user) => (
                <tr key={user._id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      background: user.role === 'admin' ? '#E77728' : '#A6C36F',
                      color: '#FFF'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  <td>
                    <a
                      href={`/users/${user._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-link"
                    >
                      View Profile
                    </a>
                  </td>
                  <td>
                    {user.role !== 'admin' && (
                      <button
                        className="admin-delete-button"
                        onClick={() => handleDeleteClick(user._id)}
                      >
                        Delete
                      </button>
                    )}
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

      {/* Delete Modal */}
      {deleteStep && selectedUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            {deleteStep === 'warning' && (
              <>
                <h2 className="admin-modal-title">Delete Account</h2>
                <p className="admin-modal-text">
                  This action cannot be undone and the user will lose access to the account. All their posts and comments will also be deleted.
                </p>
                <div className="admin-modal-actions">
                  <button
                    className="admin-button-secondary"
                    onClick={() => {
                      setDeleteStep(null)
                      setDeleteUserId(null)
                    }}
                  >
                    Close
                  </button>
                  <button
                    className="admin-button-primary"
                    onClick={handleDeleteContinue}
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {deleteStep === 'reason' && (
              <>
                <h2 className="admin-modal-title">Reason for Deletion</h2>
                <form onSubmit={(e) => { e.preventDefault(); handleDeleteTerminate() }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Reason for deletion</label>
                    <textarea
                      className="admin-form-textarea"
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      required
                      rows={4}
                      placeholder="Enter the reason for account termination..."
                    />
                  </div>
                  <div className="admin-modal-actions">
                    <button
                      type="button"
                      className="admin-button-secondary"
                      onClick={handleDeleteBack}
                    >
                      Go Back
                    </button>
                    <button
                      type="submit"
                      className="admin-button-primary"
                    >
                      Terminate Account
                    </button>
                  </div>
                </form>
              </>
            )}

            {deleteStep === 'confirm' && (
              <>
                <h2 className="admin-modal-title">Confirm Deletion</h2>
                <p className="admin-modal-text">
                  Do you wish to proceed and permanently delete <strong>{selectedUser.username}</strong>'s account?
                </p>
                <div className="admin-modal-actions">
                  <button
                    className="admin-button-secondary"
                    onClick={() => {
                      setDeleteStep('reason')
                    }}
                  >
                    No
                  </button>
                  <button
                    className="admin-button-danger"
                    onClick={handleDeleteConfirm}
                  >
                    Yes
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddAdmin && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h2 className="admin-modal-title">Add Admin</h2>
            <form onSubmit={handleAddAdmin}>
              <div className="admin-form-group">
                <label className="admin-form-label">Email</label>
                <input
                  type="email"
                  className="admin-form-input"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                  placeholder="Enter admin email"
                />
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  A password setup email will be sent to this address.
                </p>
              </div>
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-button-secondary"
                  onClick={() => {
                    setShowAddAdmin(false)
                    setAdminEmail('')
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-button-primary"
                >
                  Create Admin
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

export default Users
