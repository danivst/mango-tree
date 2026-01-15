import { useState, useEffect } from 'react'
import { adminAPI, FlaggedContent } from '../../services/adminAPI'
import Snackbar from '../../components/Snackbar'
import './AdminPages.css'

const ToReview = () => {
  const [flaggedContent, setFlaggedContent] = useState<FlaggedContent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContent, setSelectedContent] = useState<FlaggedContent | null>(null)
  const [showDisapprove, setShowDisapprove] = useState(false)
  const [disapproveReason, setDisapproveReason] = useState('')
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    type: 'success' | 'error'
  }>({ open: false, message: '', type: 'success' })

  useEffect(() => {
    fetchFlaggedContent()
  }, [])

  const fetchFlaggedContent = async () => {
    try {
      setLoading(true)
      const data = await adminAPI.getFlaggedContent()
      setFlaggedContent(data)
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to load flagged content',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleView = (content: FlaggedContent) => {
    setSelectedContent(content)
  }

  const handleApprove = async (contentId: string, type: 'post' | 'comment') => {
    try {
      await adminAPI.approveContent(contentId, type)
      setSnackbar({
        open: true,
        message: 'Successfully approved content',
        type: 'success',
      })
      setSelectedContent(null)
      fetchFlaggedContent()
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to approve content',
        type: 'error',
      })
    }
  }

  const handleDisapprove = async () => {
    if (!selectedContent || !disapproveReason.trim()) {
      setSnackbar({
        open: true,
        message: 'Please provide a reason for disapproval.',
        type: 'error',
      })
      return
    }

    try {
      await adminAPI.disapproveContent(
        selectedContent._id,
        selectedContent.type as 'post' | 'comment',
        disapproveReason
      )
      setSnackbar({
        open: true,
        message: 'Content disapproved successfully',
        type: 'success',
      })
      setSelectedContent(null)
      setShowDisapprove(false)
      setDisapproveReason('')
      fetchFlaggedContent()
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to disapprove content',
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

  if (selectedContent) {
    return (
      <div className="admin-page">
        <div className="admin-content-view">
          <button
            className="admin-button-secondary"
            onClick={() => {
              setSelectedContent(null)
              setShowDisapprove(false)
              setDisapproveReason('')
            }}
            style={{ marginBottom: '20px' }}
          >
            ← Back
          </button>
          <div className="admin-content-card">
            <h2 style={{ marginTop: 0 }}>Content Details</h2>
            <p><strong>Type:</strong> {getCategoryLabel(selectedContent.type)}</p>
            <p><strong>Author:</strong> {selectedContent.authorId.username}</p>
            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
              {selectedContent.type === 'post' ? (
                <>
                  <h3>{selectedContent.content.title}</h3>
                  <p>{selectedContent.content.content}</p>
                  {selectedContent.content.image && selectedContent.content.image.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      {selectedContent.content.image.map((img: string, idx: number) => (
                        <img key={idx} src={img} alt={`Post image ${idx + 1}`} style={{ maxWidth: '100%', marginTop: '8px' }} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p>{selectedContent.content.text || selectedContent.content.content}</p>
              )}
            </div>
            {!showDisapprove ? (
              <div className="admin-modal-actions" style={{ marginTop: '24px' }}>
                <button
                  className="admin-button-danger"
                  onClick={() => setShowDisapprove(true)}
                >
                  Disapprove
                </button>
                <button
                  className="admin-button-primary"
                  onClick={() => handleApprove(selectedContent._id, selectedContent.type as 'post' | 'comment')}
                >
                  Approve
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '24px' }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Reason for not allowing the content</label>
                  <textarea
                    className="admin-form-textarea"
                    value={disapproveReason}
                    onChange={(e) => setDisapproveReason(e.target.value)}
                    required
                    rows={4}
                    placeholder="Enter the reason for disapproval..."
                  />
                </div>
                <div className="admin-modal-actions">
                  <button
                    className="admin-button-secondary"
                    onClick={() => {
                      setShowDisapprove(false)
                      setDisapproveReason('')
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="admin-button-danger"
                    onClick={handleDisapprove}
                  >
                    Submit Disapproval
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
      <h1 className="admin-page-title">To Review</h1>
      {flaggedContent.length === 0 ? (
        <div className="admin-loading">No flagged content to review</div>
      ) : (
        <div className="admin-cards-grid">
          {flaggedContent.map((content) => (
            <div key={content._id} className="admin-card">
              <div className="admin-card-category">
                {getCategoryLabel(content.type)}
              </div>
              <button
                className="admin-button-primary"
                onClick={() => handleView(content)}
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

export default ToReview
