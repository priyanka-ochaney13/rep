import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRepos } from '../store/repoStore.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import '../App.css';

// Data now sourced from repo store

export default function RepositoriesPage() {
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { repos, loading, error, connectRepo, retryGeneration, deleteRepo, refreshRepos, checkForUpdates, regenerateRepo } = useRepos();
  const { user } = useAuth();
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return repos.filter(r => (r.name + ' ' + r.owner).toLowerCase().includes(q));
  }, [query, repos]);

  // Auto-refresh when page becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && user) {
        await refreshRepos();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshRepos, user]);

  const handleAddRepo = useCallback(async (formData) => {
    const result = await connectRepo(formData.githubUrl, {
      description: formData.description,
      branch: formData.branch
    });
    
    // Show error if connection failed
    if (result && result.error) {
      alert(`Failed to connect repository:\n\n${result.error}`);
    }
    
    return result;
  }, [connectRepo]);

  useEffect(() => {
    function onKey(e){ if(e.key==='Escape' && showModal) setShowModal(false); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showModal]);

  const hasNoRepos = repos.length === 0;

  // Show loading state
  if (loading) {
    return (
      <>
        <Header />
        <main className="repos-page" style={{paddingBottom: '3rem'}}>
          <div className="repos-container">
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              color: '#8b949e'
            }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                border: '4px solid rgba(99, 102, 241, 0.2)', 
                borderTopColor: '#6366f1', 
                borderRadius: '50%', 
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 1rem'
              }} />
              <p>Loading your repositories from cloud storage...</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="repos-page" style={{paddingBottom: '3rem'}}>
        <div className="repos-container">
          <div className="repos-head">
            <div>
              <h1 className="repos-title">Your Repositories</h1>
              <p className="repos-sub">Manage and monitor your connected GitHub repositories (synced from DynamoDB)</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-primary shadow-float" onClick={() => setShowModal(true)}>+ Connect Repository</button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{
              padding: '1rem 1.5rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#fca5a5',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <span style={{ flex: 1 }}>{error}</span>
              <button onClick={refreshRepos} style={{
                padding: '0.5rem 1rem',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '6px',
                color: '#fca5a5',
                cursor: 'pointer'
              }}>
                Try Again
              </button>
            </div>
          )}

          {hasNoRepos ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              background: 'rgba(15, 23, 36, 0.5)',
              borderRadius: '12px',
              border: '1px dashed rgba(139, 148, 158, 0.3)',
              marginTop: '2rem'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
              <h2 style={{ color: '#d0d7e2', marginBottom: '0.5rem', fontSize: '1.5rem' }}>No Repositories Yet</h2>
              <p style={{ color: '#8b949e', marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
                Get started by connecting your first GitHub repository. We'll automatically generate comprehensive documentation for you.
              </p>
              <button className="btn-primary" onClick={() => setShowModal(true)}>
                + Connect Your First Repository
              </button>
            </div>
          ) : (
            <>
              <div className="repos-search-wrapper">
                <input
                  type="text"
                  placeholder="Search repositories..."
                  className="repos-search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>
              <div className="repo-grid" aria-live="polite">
                {filtered.length > 0 ? (
                  filtered.map(repo => <RepoCard 
                    key={repo.id || (repo.owner+repo.name)} 
                    repo={repo} 
                    onRetry={() => retryGeneration(repo.id)} 
                    onViewDocs={() => navigate(`/docs/${repo.owner}/${repo.name}`)} 
                    onDelete={async () => await deleteRepo(repo.id)}
                    onCheckUpdates={() => checkForUpdates(repo.id)}
                    onRegenerate={() => regenerateRepo(repo.id)}
                  />)
                ) : (
                  <div style={{ 
                    gridColumn: '1 / -1', 
                    textAlign: 'center', 
                    padding: '3rem', 
                    color: '#8b949e' 
                  }}>
                    No repositories match your search.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        {showModal && <ConnectRepositoryModal onClose={() => setShowModal(false)} onSubmit={async (d)=> {
          const result = await handleAddRepo(d);
          // Only close modal if successful (no error)
          if (!result || !result.error) {
            setShowModal(false);
          }
        }} />}
      </main>
      <Footer />
    </>
  );
}

function RepoCard({ repo, onViewDocs, onRetry, onDelete, onCheckUpdates, onRegenerate }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete repository. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleCheckUpdates = async () => {
    setIsCheckingUpdates(true);
    try {
      await onCheckUpdates();
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setShowRegenerateConfirm(false);
    try {
      const result = await onRegenerate();
      if (result.error) {
        alert(`Failed to regenerate: ${result.error}`);
      }
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="repo-card">
      <div className="repo-top">
        <div className="repo-icon" aria-hidden></div>
        <div className="repo-meta">
          <h2 className="repo-name">{repo.name}</h2>
          <div className="repo-owner">{repo.owner}</div>
        </div>
      </div>
      {repo.description && <p className="repo-desc">{repo.description}</p>}
      <div className="repo-inline-meta">
        {repo.lang && <span className="repo-lang">{repo.lang}</span>}
      </div>
      
      {/* Update Indicator */}
      {repo.hasUpdates && (
        <div style={{
          padding: '0.75rem',
          background: 'rgba(251, 191, 36, 0.1)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          borderRadius: '8px',
          marginTop: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ fontSize: '1.25rem' }}>🔄</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#fbbf24' }}>
              Updates Available
            </div>
            <div style={{ fontSize: '0.75rem', color: '#8b949e', marginTop: '0.125rem' }}>
              {repo.updateMessage || `${repo.commitsBehind || 'New'} commits since last sync`}
            </div>
          </div>
        </div>
      )}
      
      <div className="repo-status-row">
        <span className={`status-badge ${repo.status.toLowerCase()}`}>{repo.status}</span>
        {repo.status === 'Failed' && <button className="retry-link" onClick={onRetry}>Retry</button>}
      </div>
      <div className="repo-updated">Updated {new Date(repo.updatedAt || Date.now()).toLocaleDateString(undefined,{ month:'short', day:'numeric', year:'numeric' })}</div>
      
      <div className="repo-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button 
          className="btn-primary small-btn" 
          onClick={onViewDocs} 
          disabled={repo.status !== 'Ready'}
          style={{ flex: '1' }}
        >
          {repo.status !== 'Ready' ? '...' : 'View Docs'}
        </button>
        
        {repo.status === 'Ready' && !repo.hasUpdates && (
          <button 
            className="square-btn" 
            onClick={handleCheckUpdates}
            disabled={isCheckingUpdates}
            title="Check for repository updates"
            style={{
              padding: '0.5rem 0.75rem',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#a5b4fc'
            }}
          >
            {isCheckingUpdates ? '...' : '🔍'}
          </button>
        )}
        
        {repo.hasUpdates && (
          <button 
            className="square-btn" 
            onClick={() => setShowRegenerateConfirm(true)}
            disabled={isRegenerating}
            title="Regenerate documentation"
            style={{
              padding: '0.5rem 0.75rem',
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              color: '#fbbf24',
              fontWeight: '600'
            }}
          >
            {isRegenerating ? '...' : '🔄'}
          </button>
        )}
        
        <button 
          className="square-btn delete-btn" 
          aria-label="Delete repository"
          onClick={() => setShowDeleteConfirm(true)}
          title="Delete repository"
        >
          Delete
        </button>
      </div>
      {repo.status !== 'Ready' && <div className="card-overlay-progress" aria-hidden>
          {repo.status === 'Processing' && <div className="spinner" />}
      </div>}
      
      {showDeleteConfirm && (
        <div className="modal-backdrop" onMouseDown={(e)=>{ if(e.target===e.currentTarget) setShowDeleteConfirm(false); }}>
          <div className="modal-panel" role="dialog" aria-modal="true" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Delete Repository</h2>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)} aria-label="Close">×</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ color: '#d0d7e2', marginBottom: '1rem' }}>
                Are you sure you want to delete <strong>{repo.name}</strong> and all its documentation?
              </p>
              <p style={{ color: '#8b949e', fontSize: '0.875rem' }}>
                This will permanently remove the documentation from your account. Your GitHub repository will not be affected.
              </p>
            </div>
            <div className="modal-actions" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>Cancel</button>
              <button type="button" className="btn-primary" onClick={handleDelete} style={{ backgroundColor: '#ef4444' }} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showRegenerateConfirm && (
        <div className="modal-backdrop" onMouseDown={(e)=>{ if(e.target===e.currentTarget) setShowRegenerateConfirm(false); }}>
          <div className="modal-panel" role="dialog" aria-modal="true" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>🔄 Regenerate Documentation</h2>
              <button className="modal-close" onClick={() => setShowRegenerateConfirm(false)} aria-label="Close">×</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ color: '#d0d7e2', marginBottom: '1rem' }}>
                This will fetch the latest code from <strong>{repo.name}</strong> and regenerate all documentation with the newest changes.
              </p>
              <div style={{
                padding: '1rem',
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#fbbf24', fontWeight: '600', marginBottom: '0.25rem' }}>
                  📊 {repo.commitsBehind || 'New'} commits will be processed
                </div>
                <div style={{ fontSize: '0.75rem', color: '#8b949e' }}>
                  {repo.updateMessage || 'Updates detected in your repository'}
                </div>
              </div>
              <p style={{ color: '#8b949e', fontSize: '0.875rem' }}>
                The existing documentation will be updated with new content. This may take a few moments.
              </p>
            </div>
            <div className="modal-actions" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowRegenerateConfirm(false)} disabled={isRegenerating}>Cancel</button>
              <button type="button" className="btn-primary" onClick={handleRegenerate} style={{ backgroundColor: '#fbbf24', color: '#0b1625' }} disabled={isRegenerating}>
                {isRegenerating ? 'Regenerating...' : 'Regenerate Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConnectRepositoryModal({ onClose, onSubmit }) {
  const [githubUrl, setGithubUrl] = useState('');
  const [description, setDescription] = useState('');
  const [branch, setBranch] = useState('main');
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function parseUrl(url) {
    // Expect formats like https://github.com/owner/repo
    try {
      const u = new URL(url);
      if (u.hostname !== 'github.com') return null;
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts.length < 2) return null;
      return { owner: parts[0], name: parts[1] };
    } catch { return null; }
  }

  const parsed = parseUrl(githubUrl);
  const urlInvalid = touched && !parsed;

  async function handleSubmit(e){
    e.preventDefault();
    setTouched(true);
    if(!parsed) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({ githubUrl, description, branch });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e)=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="connect-heading">
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 id="connect-heading">Connect Repository</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <label className="field-group">
            <span className="field-label">GitHub URL *</span>
            <div className={`input-wrapper ${urlInvalid? 'invalid':''}`}>
              <input
                type="url"
                required
                placeholder="https://github.com/username/repo"
                value={githubUrl}
                onChange={e=>setGithubUrl(e.target.value)}
                onBlur={()=>setTouched(true)}
              />
            </div>
            {urlInvalid && <span className="field-error">Enter a valid GitHub repository URL.</span>}
          </label>
          <label className="field-group">
            <span className="field-label">Description</span>
            <textarea
              placeholder="What does this repository do?"
              value={description}
              onChange={e=>setDescription(e.target.value)}
              rows={4}
            />
          </label>
          <label className="field-group">
            <span className="field-label">Branch</span>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder="main"
                value={branch}
                onChange={e=>setBranch(e.target.value)}
              />
            </div>
            <span style={{fontSize: '0.875rem', opacity: 0.7, marginTop: '0.25rem', display: 'block'}}>
              Specify which branch to generate documentation from (e.g., main, master, develop)
            </span>
          </label>
          <div className="modal-actions">
            <button type="button" className="btn-secondary modal-cancel" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!parsed || isSubmitting}>
              {isSubmitting ? 'Connecting...' : 'Connect Repository'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
