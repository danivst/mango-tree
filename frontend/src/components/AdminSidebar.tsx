import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import './AdminSidebar.css'

interface TokenPayload {
  userId: string
  username?: string
  role: string
  exp: number
  iat: number
}

interface SidebarItem {
  id: string
  label: string
  icon: JSX.Element
  path: string
}

const AdminSidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [username, setUsername] = useState<string>('')

  useEffect(() => {
    // Get username from token or API
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const decoded = jwtDecode<TokenPayload>(token)
        // Username might not be in token, fetch from API if needed
        // For now, we'll try to get it from token or use a placeholder
        if (decoded.username) {
          setUsername(decoded.username)
        } else {
          // Fetch user info from API
          fetchUserInfo()
        }
      } catch (error) {
        console.error('Error decoding token:', error)
      }
    }
  }, [])

  const fetchUserInfo = async () => {
    try {
      const api = (await import('../services/api')).default
      const response = await api.get('/users/me')
      if (response.data && response.data.username) {
        setUsername(response.data.username)
      }
    } catch (error) {
      console.error('Error fetching user info:', error)
    }
  }

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setIsCollapsed(true)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true)
    }
  }, [isMobile])

  const menuItems: SidebarItem[] = [
    {
      id: 'review',
      label: 'To Review',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      path: '/dashboard/review'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
      ),
      path: '/dashboard/reports'
    },
    {
      id: 'users',
      label: 'Users',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      path: '/dashboard/users'
    },
    {
      id: 'tags',
      label: 'Tags',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      ),
      path: '/dashboard/tags'
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
      path: '/dashboard/categories'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
        </svg>
      ),
      path: '/dashboard/settings'
    }
  ]

  const handleItemClick = (path: string) => {
    navigate(path)
    if (isMobile) {
      setIsCollapsed(true)
    }
  }

  const activeItem = menuItems.find(item => location.pathname === item.path)

  return (
    <>
      {(isMobile && !isCollapsed) && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsCollapsed(true)}
        />
      )}
      <div className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''}`}>
        <div className="sidebar-header">
          {!isCollapsed && (
            <>
              <div className="sidebar-logo">
                <div className="logo-placeholder"></div>
                <h2 className="sidebar-title">MangoTree</h2>
              </div>
              {username && (
                <div className="sidebar-greeting">
                  Hi, {username}
                </div>
              )}
              <div className="sidebar-divider"></div>
            </>
          )}
          {isMobile && !isCollapsed && (
            <button 
              className="sidebar-close"
              onClick={() => setIsCollapsed(true)}
              aria-label="Close sidebar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-item ${activeItem?.id === item.id ? 'active' : ''}`}
              onClick={() => handleItemClick(item.path)}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {!isCollapsed && <span className="sidebar-label">{item.label}</span>}
            </button>
          ))}
        </nav>
        {isMobile && isCollapsed && (
          <button 
            className="sidebar-expand"
            onClick={() => setIsCollapsed(false)}
            aria-label="Expand sidebar"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </>
  )
}

export default AdminSidebar
