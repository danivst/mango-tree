import { useState, useEffect } from 'react'
import { adminAPI, Report } from '../../services/adminAPI'
import Snackbar from '../../components/Snackbar'
import './AdminPages.css'

const Reports = () => {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showReject, setShowReject] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [reason, setReason] = useState('')
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    type: 'success' | 'error'
  }>({ open: false, message: '', type: 'success' })

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const data = await adminAPI.getReports()
      setReports(data)
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to load reports',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleView = (report: Report) => {
    setSelectedReport(report)
  }

  const handleReject = async () => {
    if (!selectedReport || !reason.trim()) {
      setSnackbar({
        open: true,
        message: 'Please provide a reason.',
        type: 'error',
      })
      return
    }

    try {
      await adminAPI.rejectReport(selectedReport._id, reason)
      setSnackbar({
        open: true,
        message: 'Report rejected successfully',
        type: 'success',
      })
      setSelectedReport(null)
      setShowReject(false)
      setReason('')
      fetchReports()
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to reject report',
        type: 'error',
      })
    }
  }

  const handleDeleteItem = async () => {
    if (!selectedReport || !reason.trim()) {
      setSnackbar({
        open: true,
        message: 'Please provide a reason for deletion.',
        type: 'error',
      })
      return
    }

    try {
      await adminAPI.deleteReportedItem(selectedReport._id, reason)
      setSnackbar({
        open: true,
        message: 'Item deleted successfully',
        type: 'success',
      })
      setSelectedReport(null)
      setShowDelete(false)
      setReason('')
      fetchReports()
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to delete item',
        type: 'error',
      })
    }
  }

  const getCategoryLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Loading...</div>
      </div>
    )
  }

  if (selectedReport) {
    return (
      <div className="admin-page">
        <div className="admin-content-view">
          <button
            className="admin-button-secondary"
            onClick={() => {
              setSelectedReport(null)
              setShowReject(false)
              setShowDelete(false)
              setReason('')
            }}
            style={{ marginBottom: '20px' }}
          >
            ← Back
          </button>
          <div className="admin-content-card">
            <h2 style={{ marginTop: 0 }}>Report Details</h2>
            <p><strong>Submitted by:</strong> {selectedReport.reportedBy.username}</p>
            <p><strong>Category:</strong> {getCategoryLabel(selectedReport.targetType)}</p>
            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
              <p><strong>Reason/Description:</strong></p>
              <p>{selectedReport.reason}</p>
            </div>
            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(231, 119, 40, 0.1)', borderRadius: '8px' }}>
              <p><strong>Reference to item:</strong> {selectedReport.targetType} ID: {selectedReport.targetId}</p>
            </div>
            {!showReject && !showDelete ? (
              <div className="admin-modal-actions" style={{ marginTop: '24px' }}>
                <button
                  className="admin-button-secondary"
                  onClick={() => {
                    setShowReject(true)
                    setShowDelete(false)
                  }}
                >
                  Reject
                </button>
                <button
                  className="admin-button-danger"
                  onClick={() => {
                    setShowDelete(true)
                    setShowReject(false)
                  }}
                >
                  Delete Item
                </button>
              </div>
            ) : showReject ? (
              <div style={{ marginTop: '24px' }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Reason for rejecting (not marked as disruptive)</label>
                  <textarea
                    className="admin-form-textarea"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    rows={4}
                    placeholder="Enter the reason..."
                  />
                </div>
                <div className="admin-modal-actions">
                  <button
                    className="admin-button-secondary"
                    onClick={() => {
                      setShowReject(false)
                      setReason('')
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="admin-button-primary"
                    onClick={handleReject}
                  >
                    Submit Rejection
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '24px' }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Reason for deleting the item</label>
                  <textarea
                    className="admin-form-textarea"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    rows={4}
                    placeholder="Enter the reason for deletion..."
                  />
                </div>
                <div className="admin-modal-actions">
                  <button
                    className="admin-button-secondary"
                    onClick={() => {
                      setShowDelete(false)
                      setReason('')
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="admin-button-danger"
                    onClick={handleDeleteItem}
                  >
                    Delete Item
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          open={snackbar.open}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      </div>
    )
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Reports</h1>
      {reports.length === 0 ? (
        <div className="admin-loading">No reports to review</div>
      ) : (
        <div className="admin-cards-grid">
          {reports.map((report) => (
            <div key={report._id} className="admin-card">
              <h3 className="admin-card-title">{report.reportedBy.username}</h3>
              <p className="admin-card-category">{getCategoryLabel(report.targetType)}</p>
              <p className="admin-card-description">{report.reason}</p>
              <button
                className="admin-button-primary"
                onClick={() => handleView(report)}
                style={{ marginTop: '16px' }}
              >
                View
              </button>
            </div>
          ))}
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

export default Reports
