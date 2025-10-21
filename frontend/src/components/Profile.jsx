import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getUserProfile } from '../api/apiClient'
import Header from './Header'
import Footer from './Footer'
import '../App.css'

export default function Profile() {
  const { user } = useAuth()
  const [backendProfile, setBackendProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch user profile from backend when component mounts
  useEffect(() => {
    if (user) {
      fetchBackendData()
    }
  }, [user])

  const fetchBackendData = async () => {
    setLoading(true)
    setError(null)
    try {
      const profile = await getUserProfile()
      setBackendProfile(profile)
    } catch (err) {
      console.error('Failed to fetch backend data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <>
        <Header />
        <main style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
          <h1>Profile</h1>
          <p style={{ color: '#9da9b8', marginTop: '1rem' }}>Please sign in to view your profile.</p>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="repos-page" style={{ paddingBottom: '3rem' }}>
        <div className="repos-container" style={{ maxWidth: '960px' }}>
          {/* Page Header */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h1 className="repos-title">Account Settings</h1>
            <p className="repos-sub">Manage your profile and account preferences</p>
          </div>

          {/* Profile Card */}
          <div className="info-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="user-avatar" style={{ width: '72px', height: '72px', fontSize: '1.8rem' }}>
                {(user.displayName || user.email || 'U')?.[0]?.toUpperCase()}
              </div>
              <div>
                <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem' }}>{user.displayName || user.email?.split('@')[0]}</h2>
                <p style={{ margin: 0, color: '#9da9b8', fontSize: '0.9rem' }}>{user.email}</p>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="info-card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.15rem' }}>
              Account Information
            </h3>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ color: '#9da9b8', fontSize: '0.9rem' }}>Email</span>
                <span style={{ fontSize: '0.95rem' }}>{user.email}</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ color: '#9da9b8', fontSize: '0.9rem' }}>Username</span>
                <span style={{ fontSize: '0.95rem' }}>{user.username}</span>
              </div>

              {loading && (
                <div style={{ padding: '0.75rem 0', textAlign: 'center' }}>
                  <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                  <p style={{ color: '#9da9b8', fontSize: '0.85rem', marginTop: '0.5rem' }}>Loading account details...</p>
                </div>
              )}

              {error && (
                <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem' }}>
                  <p style={{ color: '#ef4444', fontSize: '0.9rem', margin: 0 }}>Error: {error}</p>
                </div>
              )}

              {backendProfile && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ color: '#9da9b8', fontSize: '0.9rem' }}>User ID</span>
                    <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: '#b6c1ce' }}>{backendProfile.user_id}</span>
                  </div>

                  {backendProfile.groups && backendProfile.groups.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ color: '#9da9b8', fontSize: '0.9rem' }}>Groups</span>
                      <span style={{ fontSize: '0.95rem' }}>{backendProfile.groups.join(', ')}</span>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.75rem', padding: '0.75rem 0' }}>
                    <span style={{ color: '#9da9b8', fontSize: '0.9rem' }}>Session Expires</span>
                    <span style={{ fontSize: '0.95rem' }}>
                      {backendProfile.token_expires 
                        ? new Date(backendProfile.token_expires * 1000).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Security Section */}
          <div className="info-card">
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem' }}>
              Security
            </h3>
            <p style={{ color: '#9da9b8', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: '1.5' }}>
              Your account is secured with AWS Cognito authentication. Sessions automatically expire after 1 hour for your security.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button 
                onClick={fetchBackendData}
                disabled={loading}
                className="btn-secondary"
                style={{ fontSize: '0.9rem', padding: '0.65rem 1.1rem' }}
              >
                Refresh Session
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      
      {/* Add spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}

