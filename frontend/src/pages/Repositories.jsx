import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRepos } from '../store/repoStore.jsx';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import '../App.css';

// Data now sourced from repo store

export default function RepositoriesPage() {
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { repos, loading, error, connectRepo, retryGeneration, deleteRepo, refreshRepos } = useRepos();
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return repos.filter(r => (r.name + ' ' + r.owner).toLowerCase().includes(q));
  }, [query, repos]);

  const handleAddRepo = useCallback(async (formData) => {
    await connectRepo(formData.githubUrl, {
      description: formData.description,
      language: formData.language,
      stars: formData.stars
    });
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
              <button className="btn-secondary" onClick={refreshRepos} title="Refresh from cloud">
                🔄 Refresh
              </button>
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
                  filtered.map(repo => <RepoCard key={repo.id || (repo.owner+repo.name)} repo={repo} onRetry={() => retryGeneration(repo.id)} onViewDocs={() => navigate(`/docs/${repo.owner}/${repo.name}`)} onDelete={async () => await deleteRepo(repo.id)} />)
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
        {showModal && <ConnectRepositoryModal onClose={() => setShowModal(false)} onSubmit={(d)=>{handleAddRepo(d); setShowModal(false);}} />}
      </main>
      <Footer />
    </>
  );
}

function RepoCard({ repo, onViewDocs, onRetry, onDelete }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      <div className="repo-status-row">
        <span className={`status-badge ${repo.status.toLowerCase()}`}>{repo.status}</span>
        {repo.status === 'Failed' && <button className="retry-link" onClick={onRetry}>Retry</button>}
      </div>
      <div className="repo-updated">Updated {new Date(repo.updatedAt || Date.now()).toLocaleDateString(undefined,{ month:'short', day:'numeric', year:'numeric' })}</div>
      <div className="repo-actions">
        <button className="btn-primary small-btn" onClick={onViewDocs} disabled={repo.status !== 'Ready'}>{repo.status !== 'Ready' ? '...' : 'View Docs'}</button>
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
    </div>
  );
}

function ConnectRepositoryModal({ onClose, onSubmit }) {
  const [githubUrl, setGithubUrl] = useState('');
  const [description, setDescription] = useState('');
  const [commitToGithub, setCommitToGithub] = useState(false);
  const [touched, setTouched] = useState(false);

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

  function handleSubmit(e){
    e.preventDefault();
    setTouched(true);
    if(!parsed) return;
    onSubmit({ githubUrl, description, commitToGithub });
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
          <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            marginTop: '1rem'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              cursor: 'pointer',
              gap: '0.75rem'
            }}>
              <input 
                type="checkbox" 
                checked={commitToGithub} 
                onChange={e=>setCommitToGithub(e.target.checked)}
                style={{
                  marginTop: '0.25rem',
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              />
              <div>
                <div style={{fontWeight: '500', marginBottom: '0.25rem'}}>
                  Commit generated README.md to GitHub
                </div>
                <div style={{fontSize: '0.875rem', opacity: 0.7, lineHeight: '1.4'}}>
                  If enabled, the generated README will be automatically committed and pushed to your repository. Requires Git credentials to be configured.
                </div>
              </div>
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary modal-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={!parsed}>Connect Repository</button>
          </div>
        </form>
      </div>
    </div>
  );
}
