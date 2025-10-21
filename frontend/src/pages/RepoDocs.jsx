import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { useRepos } from '../store/repoStore.jsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { commitReadme } from '../api/apiClient.js';
import '../App.css';

// Data now pulled from repo store

const DOC_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'readme', label: 'README' },
  { id: 'summary', label: 'Code Summary' },
  { id: 'changelog', label: 'Changelog' },
];

export default function RepoDocsPage() {
  const { owner, name } = useParams();
  const { repos, updateRepo } = useRepos();
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitError, setCommitError] = useState(null);
  
  const repo = useMemo(() => {
    console.log('🔍 Looking for repo:', { owner, name });
    console.log('📦 Available repos:', repos.map(r => ({ id: r.id, owner: r.owner, name: r.name })));
    const found = repos.find(r => r.owner === owner && r.name === name);
    console.log('✅ Found repo:', found);
    return found;
  }, [repos, owner, name]);
  
  const handleCommitToGitHub = async () => {
    if (!repo || !repo.docs?.readme) return;
    
    setIsCommitting(true);
    setCommitError(null);
    
    try {
      const githubUrl = `https://github.com/${owner}/${name}`;
      
      // Use the new commit-only endpoint to avoid regenerating everything
      const result = await commitReadme({
        inputData: githubUrl,
        readmeContent: repo.docs.readme,
        branch: 'main'
      });
      
      console.log('Commit result:', result);
      
      // Update repo with commit status
      updateRepo(repo.id, {
        commitStatus: result.commit_status,
        commitMessage: result.commit_message,
      });
      
      if (result.commit_status === 'success') {
        alert('✓ README successfully committed to GitHub!');
      } else {
        setCommitError(result.commit_message || 'Failed to commit README');
      }
    } catch (error) {
      console.error('Commit error:', error);
      setCommitError(error.message || 'Failed to commit README to GitHub');
    } finally {
      setIsCommitting(false);
    }
  };

  if (!repo) {
    return (
      <>
        <Header />
        <main className="docs-page" style={{padding:"4rem 1.5rem"}}>
          <div className="docs-container">
            <p style={{opacity:.7}}>Repository not found.</p>
            <p style={{opacity:.5, fontSize: '0.875rem', marginTop: '0.5rem'}}>
              Looking for: {owner}/{name}
            </p>
            <Link to="/repositories" className="btn-primary" style={{display:'inline-block',marginTop:'1.25rem'}}>← Back</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="docs-page">
        <div className="docs-container">
          <div className="docs-header-meta">
            <div className="repo-icon large" aria-hidden></div>
            <div>
              <h1 className="docs-title">{repo.name}</h1>
              <div className="docs-sub">{repo.owner} • {repo.lang}</div>
            </div>
            <div className="docs-header-actions">
              {(!repo.commitStatus || repo.commitStatus !== 'success') && (
                <button 
                  className="btn-primary small-btn" 
                  onClick={handleCommitToGitHub}
                  disabled={isCommitting || !repo.docs?.readme}
                  style={{marginRight: '0.5rem'}}
                >
                  {isCommitting ? 'Committing...' : 'Commit to GitHub'}
                </button>
              )}
              <Link to="/repositories" className="btn-secondary small-btn">Back to Repositories</Link>
            </div>
          </div>
          
          {commitError && (
            <div style={{
              padding: '1rem',
              marginBottom: '1.5rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444'
            }}>
              <strong>Commit Failed: </strong>
              {commitError}
            </div>
          )}
          
          {repo.commitStatus && repo.commitStatus !== 'skipped' && !commitError && (
            <div style={{
              padding: '1rem',
              marginBottom: '1.5rem',
              borderRadius: '8px',
              backgroundColor: repo.commitStatus === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${repo.commitStatus === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: repo.commitStatus === 'success' ? '#10b981' : '#ef4444'
            }}>
              <strong>{repo.commitStatus === 'success' ? 'Success: ' : 'Warning: '}</strong>
              {repo.commitMessage || (repo.commitStatus === 'success' ? 'README committed to GitHub' : 'Failed to commit README')}
            </div>
          )}
          
          <div className="docs-layout">
            <nav className="docs-nav" aria-label="Documentation sections">
              <ul>
                {DOC_SECTIONS.map(s => (
                  <li key={s.id}><a href={`#${s.id}`}>{s.label}</a></li>
                ))}
              </ul>
            </nav>
            <div className="docs-content">
              <section id="overview" className="doc-section">
                <h2>Overview</h2>
                <p>{repo.description || 'No description provided.'}</p>
                <div className="meta-row">
                  <span className={`status-badge ${repo.status.toLowerCase()}`}>{repo.status}</span>
                  <span className="tiny-meta">Updated {repo.updatedAt}</span>
                </div>
              </section>
              <section id="readme" className="doc-section">
                <h2>README</h2>
                <div className="md-block markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{repo.docs?.readme || '*No README*'}</ReactMarkdown>
                </div>
              </section>
              <section id="summary" className="doc-section">
                <h2>Code Summary</h2>
                {repo.docs?.summary && typeof repo.docs.summary === 'object' && Object.keys(repo.docs.summary).length > 0 ? (
                  <div>
                    {Object.entries(repo.docs.summary).map(([filename, summary]) => (
                      <div key={filename} style={{marginBottom: '1.5rem'}}>
                        <h3 style={{fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem'}}>{filename}</h3>
                        <p style={{opacity: 0.9, lineHeight: '1.6'}}>{typeof summary === 'string' ? summary : JSON.stringify(summary)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>{typeof repo.docs?.summary === 'string' ? repo.docs.summary : 'No code summaries generated.'}</p>
                )}
              </section>
              <section id="changelog" className="doc-section">
                <h2>Changelog</h2>
                {repo.docs?.changelog?.length ? (
                  <ul className="changelog">
                    {repo.docs.changelog.map((c,i)=>(
                      <li key={i}><span className="chg-date">{c.date}</span>{c.entry}</li>
                    ))}
                  </ul>) : <p>No changelog entries yet.</p>}
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
