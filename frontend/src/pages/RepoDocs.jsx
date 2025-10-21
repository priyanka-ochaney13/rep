import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import { useRepos } from '../store/repoStore.jsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toPng } from 'html-to-image';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { commitReadme } from '../api/apiClient.js';
import '../App.css';
import './RepoDocs.css';

const TABS = [
  { id: 'readme', label: '📄 README', icon: '📄' },
  { id: 'architecture', label: '🏗️ Architecture', icon: '🏗️' },
  { id: 'code-analysis', label: '🔍 Code Analysis', icon: '🔍' },
];

export default function RepoDocsPage() {
  const { owner, name } = useParams();
  const { repos, updateRepo } = useRepos();
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitError, setCommitError] = useState(null);
  const [activeTab, setActiveTab] = useState('readme');
  const [mermaid, setMermaid] = useState(null);
  
  const repo = useMemo(() => {
    console.log('🔍 Looking for repo:', { owner, name });
    console.log('📦 Available repos:', repos.map(r => ({ id: r.id, owner: r.owner, name: r.name })));
    const found = repos.find(r => r.owner === owner && r.name === name);
    console.log('✅ Found repo:', found);
    return found;
  }, [repos, owner, name]);

  // Load mermaid dynamically
  useEffect(() => {
    import('mermaid')
      .then(module => {
        const mermaidInstance = module.default;
        mermaidInstance.initialize({ 
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            primaryColor: '#8b5cf6',
            primaryTextColor: '#fff',
            primaryBorderColor: '#7c3aed',
            lineColor: '#6b7280',
            secondaryColor: '#10b981',
            tertiaryColor: '#f59e0b',
            background: '#0b1625',
            mainBkg: '#0f1724',
            secondBkg: '#141b2b',
            textColor: '#d0d7e2',
            fontSize: '16px',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif'
          },
          flowchart: {
            htmlLabels: true,
            curve: 'basis',
            rankSpacing: 100,      // More vertical spacing for detailed labels
            nodeSpacing: 80,       // More horizontal spacing
            padding: 25,
            useMaxWidth: true,
            diagramPadding: 30,
            wrappingWidth: 200     // Allow text wrapping in nodes
          },
          graph: {
            htmlLabels: true,
            curve: 'basis'
          }
        });
        setMermaid(mermaidInstance);
      })
      .catch(err => {
        console.log('Mermaid not available:', err);
      });
  }, []);

  // Render mermaid diagrams when architecture tab is active
  useEffect(() => {
    if (activeTab === 'architecture' && mermaid) {
      setTimeout(() => {
        mermaid.run({
          querySelector: '.mermaid'
        });
      }, 100);
    }
  }, [activeTab, mermaid]);
  
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
        <div className="docs-container-new">
          {/* Header Section */}
          <div className="docs-header-new">
            <div className="docs-header-content">
              <div className="docs-header-left">
                <div className="repo-icon large" aria-hidden></div>
                <div>
                  <h1 className="docs-title-new">{repo.name}</h1>
                  <div className="docs-subtitle">
                    <span>{repo.owner}</span>
                    <span className="dot">•</span>
                    <span>{repo.lang}</span>
                    <span className="dot">•</span>
                    <span className={`status-badge ${repo.status.toLowerCase()}`}>{repo.status}</span>
                  </div>
                </div>
              </div>
              
              <div className="docs-header-actions">
                {(!repo.commitStatus || repo.commitStatus !== 'success') && (
                  <button 
                    className="btn-primary small-btn" 
                    onClick={handleCommitToGitHub}
                    disabled={isCommitting || !repo.docs?.readme}
                  >
                    {isCommitting ? 'Committing...' : 'Commit to GitHub'}
                  </button>
                )}
                <Link to="/repositories" className="btn-secondary small-btn">
                  ← Back
                </Link>
              </div>
            </div>

            {/* Status Messages */}
            {commitError && (
              <div className="status-alert error">
                <strong>Commit Failed: </strong>
                {commitError}
                {commitError.includes('authentication') || commitError.includes('credentials') ? (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', opacity: 0.9 }}>
                    💡 <strong>Tip:</strong> Configure Git credentials or use a Personal Access Token
                  </div>
                ) : null}
              </div>
            )}
            
            {repo.commitStatus && repo.commitStatus !== 'skipped' && !commitError && (
              <div className={`status-alert ${repo.commitStatus === 'success' ? 'success' : 'error'}`}>
                <strong>{repo.commitStatus === 'success' ? '✓ Success: ' : '⚠ Warning: '}</strong>
                {repo.commitMessage || (repo.commitStatus === 'success' ? 'README committed to GitHub' : 'Failed to commit README')}
              </div>
            )}

            {/* Horizontal Tab Navigation */}
            <div className="docs-tabs">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label.replace(/^.+ /, '')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="docs-tab-content">
            <ErrorBoundary>
              {activeTab === 'readme' && <ReadmeTab repo={repo} />}
              {activeTab === 'architecture' && <ArchitectureTab repo={repo} mermaid={mermaid} />}
              {activeTab === 'code-analysis' && <CodeAnalysisTab repo={repo} />}
            </ErrorBoundary>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

// README Tab Component
function ReadmeTab({ repo }) {
  return (
    <div className="tab-panel">
      <div className="tab-panel-header">
        <h2>📄 Project Documentation</h2>
        <p className="tab-panel-desc">
          Comprehensive README with setup instructions, usage examples, and contribution guidelines
        </p>
      </div>
      
      <div className="content-card">
        {repo.docs?.readme ? (
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {repo.docs.readme}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h3>No README Available</h3>
            <p>The README hasn't been generated yet for this repository.</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="action-btn" onClick={() => {
          const blob = new Blob([repo.docs?.readme || ''], { type: 'text/markdown' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'README.md';
          a.click();
        }}>
          <span>⬇️</span>
          Download Markdown
        </button>
        <button className="action-btn" onClick={() => {
          navigator.clipboard.writeText(repo.docs?.readme || '');
          alert('✓ Copied to clipboard!');
        }}>
          <span>📋</span>
          Copy to Clipboard
        </button>
      </div>
    </div>
  );
}

// Architecture Tab Component
function ArchitectureTab({ repo, mermaid }) {
  const hasDiagrams = repo.docs?.visuals && Object.keys(repo.docs.visuals).length > 0;
  const folderTree = repo.docs?.folderTree;
  const [diagramError, setDiagramError] = React.useState(null);

  // Render diagrams when component mounts or mermaid becomes available
  React.useEffect(() => {
    if (mermaid && hasDiagrams) {
      try {
        mermaid.run({
          querySelector: '.mermaid'
        }).catch(err => {
          console.error('Mermaid render error:', err);
          setDiagramError(err.message);
        });
      } catch (err) {
        console.error('Mermaid error:', err);
        setDiagramError(err.message);
      }
    }
  }, [mermaid, hasDiagrams]);

  return (
    <div className="tab-panel">
      <div className="tab-panel-header">
        <h2>🏗️ System Architecture</h2>
        <p className="tab-panel-desc">
          Visual representation of your project structure, dependencies, and component relationships
        </p>
      </div>

      {/* Folder Structure */}
      {folderTree && (
        <div className="content-card">
          <h3 className="card-title">📁 Project Structure</h3>
          <div className="folder-tree">
            <pre style={{ 
              background: '#0f1724', 
              padding: '1.5rem', 
              borderRadius: '8px', 
              overflow: 'auto',
              fontSize: '0.875rem',
              lineHeight: '1.6'
            }}>
              {typeof folderTree === 'string' ? folderTree : String(folderTree || 'No folder structure available')}
            </pre>
          </div>
        </div>
      )}

      {/* Mermaid Diagrams */}
      {hasDiagrams ? (
        <div className="diagrams-grid">
          {Object.entries(repo.docs.visuals).map(([key, diagram], index) => {
            // Ensure diagram is a string
            const diagramText = typeof diagram === 'string' ? diagram : String(diagram || '');
            
            return (
              <DiagramCard 
                key={key} 
                title={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                diagramText={diagramText}
                diagramError={diagramError}
                diagramKey={key}
                index={index}
              />
            );
          })}
        </div>
      ) : (
        <div className="content-card">
          <div className="empty-state">
            <div className="empty-state-icon">🎨</div>
            <h3>No Architecture Diagrams</h3>
            <p>Architecture diagrams will be generated automatically from your codebase.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Enhanced Diagram Card with Professional Pan-Zoom
function DiagramCard({ title, diagramText, diagramError, diagramKey, index }) {
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [enableZoom, setEnableZoom] = useState(true);

  const handleExportPNG = async () => {
    setIsExporting(true);
    try {
      // Wait a bit for any pending renders
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const svgElement = containerRef.current?.querySelector('.mermaid svg');
      if (!svgElement) {
        alert('❌ Diagram not found. Please wait for it to render completely.');
        setIsExporting(false);
        return;
      }

      // Get actual SVG dimensions
      const svgBBox = svgElement.getBBox();
      const svgWidth = svgBBox.width || svgElement.clientWidth || 800;
      const svgHeight = svgBBox.height || svgElement.clientHeight || 600;
      
      // Create a clean container for export
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'absolute';
      exportContainer.style.left = '-9999px';
      exportContainer.style.top = '0';
      exportContainer.style.width = `${svgWidth + 80}px`;
      exportContainer.style.height = `${svgHeight + 80}px`;
      exportContainer.style.padding = '40px';
      exportContainer.style.background = '#0b1625';
      exportContainer.style.display = 'flex';
      exportContainer.style.alignItems = 'center';
      exportContainer.style.justifyContent = 'center';
      document.body.appendChild(exportContainer);
      
      // Clone SVG with all styles
      const clonedSvg = svgElement.cloneNode(true);
      clonedSvg.setAttribute('width', svgWidth);
      clonedSvg.setAttribute('height', svgHeight);
      exportContainer.appendChild(clonedSvg);
      
      // Export to PNG
      const dataUrl = await toPng(exportContainer, {
        backgroundColor: '#0b1625',
        quality: 1.0,
        pixelRatio: 2,
        width: svgWidth + 80,
        height: svgHeight + 80,
        cacheBust: true
      });
      
      // Cleanup
      document.body.removeChild(exportContainer);
      
      // Download
      const link = document.createElement('a');
      link.download = `${diagramKey}-architecture-diagram.png`;
      link.href = dataUrl;
      link.click();
      
      console.log('✅ Diagram exported successfully');
    } catch (err) {
      console.error('❌ Export error:', err);
      alert('Failed to export diagram. Error: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleViewInNewTab = () => {
    const svgElement = containerRef.current?.querySelector('.mermaid svg');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      window.open(url, '_blank');
    }
  };

  return (
    <div className={`content-card diagram-card ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="diagram-card-header">
        <h3 className="card-title">{title}</h3>
        <div className="diagram-controls">
          <button 
            className="control-btn customize-btn" 
            onClick={() => setShowCustomizeModal(true)}
            title="Customize Diagram"
          >
            ⚙️ Customize
          </button>
          <button 
            className="control-btn export-btn" 
            onClick={handleExportPNG}
            disabled={isExporting}
            title="Export as PNG"
          >
            {isExporting ? '⏳' : '📥'} Export
          </button>
          <label className="zoom-toggle" title="Toggle Zoom">
            <input 
              type="checkbox" 
              checked={enableZoom} 
              onChange={(e) => setEnableZoom(e.target.checked)}
            />
            <span>🔍 Zoom</span>
          </label>
        </div>
      </div>

      {/* Customize Modal */}
      {showCustomizeModal && (
        <div className="modal-overlay" onClick={() => setShowCustomizeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Customize Diagram</h3>
              <button className="modal-close" onClick={() => setShowCustomizeModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="modal-info">
                💡 To customize your diagram, regenerate the documentation with custom instructions for architecture visualization.
              </p>
              <div className="customize-options">
                <div className="option-group">
                  <h4>Current Features:</h4>
                  <ul>
                    <li>✅ GitDiagram-style 3-phase generation</li>
                    <li>✅ Hierarchical subgraph organization</li>
                    <li>✅ Color-coded components by layer</li>
                    <li>✅ Professional flowchart structure</li>
                  </ul>
                </div>
                <div className="option-group">
                  <h4>Export Options:</h4>
                  <div className="export-buttons">
                    <button className="modal-btn primary" onClick={() => {
                      handleExportPNG();
                      setShowCustomizeModal(false);
                    }}>
                      📥 Export as PNG
                    </button>
                    <button className="modal-btn secondary" onClick={() => {
                      handleViewInNewTab();
                      setShowCustomizeModal(false);
                    }}>
                      � Open in New Tab
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {diagramError ? (
        <div className="diagram-error">
          <p>⚠️ Diagram rendering error. Showing raw code:</p>
          <pre style={{ 
            background: '#0f1724', 
            padding: '1rem', 
            borderRadius: '8px', 
            overflow: 'auto',
            fontSize: '0.875rem'
          }}>
            {diagramText}
          </pre>
        </div>
      ) : enableZoom ? (
        <div className="transform-wrapper-container">
          <TransformWrapper
            initialScale={1}
            minScale={0.2}
            maxScale={4}
            centerOnInit={true}
            limitToBounds={false}
            wheel={{ 
              step: 0.15,
              smoothStep: 0.005
            }}
            doubleClick={{ 
              disabled: false, 
              step: 0.6,
              mode: 'zoomIn'
            }}
            panning={{ 
              disabled: false,
              velocityDisabled: false
            }}
          >
            {({ zoomIn, zoomOut, resetTransform, centerView }) => (
              <>
                <div className="zoom-controls-overlay">
                  <button 
                    className="zoom-control-btn" 
                    onClick={() => zoomIn(0.3)}
                    title="Zoom In"
                  >
                    🔍+
                  </button>
                  <button 
                    className="zoom-control-btn" 
                    onClick={() => zoomOut(0.3)}
                    title="Zoom Out"
                  >
                    🔍−
                  </button>
                  <button 
                    className="zoom-control-btn" 
                    onClick={() => resetTransform()}
                    title="Reset View"
                  >
                    ↺
                  </button>
                  <button 
                    className="zoom-control-btn" 
                    onClick={() => centerView(1)}
                    title="Center & Fit"
                  >
                    ⊡
                  </button>
                </div>
                <TransformComponent
                  wrapperStyle={{
                    width: '100%',
                    height: '100%'
                  }}
                  contentStyle={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div ref={containerRef} className="mermaid-zoom-container">
                    <pre className="mermaid" key={`mermaid-${diagramKey}-${index}`}>
                      {diagramText}
                    </pre>
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </div>
      ) : (
        <div className="diagram-static-container" ref={containerRef}>
          <pre className="mermaid" key={`mermaid-${diagramKey}-${index}`}>
            {diagramText}
          </pre>
        </div>
      )}
      
      <div className="diagram-hints">
        <span>💡 {enableZoom ? 'Mouse wheel to zoom • Drag to pan • Double-click to zoom in' : 'Enable zoom to interact with diagram'}</span>
      </div>
    </div>
  );
}

// Code Analysis Tab Component
function CodeAnalysisTab({ repo }) {
  const summaries = repo.docs?.summary;
  
  // Debug: log what we're getting
  React.useEffect(() => {
    console.log('📊 Summaries data:', summaries);
    console.log('📊 Type:', typeof summaries);
    if (summaries && typeof summaries === 'object') {
      console.log('📊 Keys:', Object.keys(summaries));
    }
  }, [summaries]);
  
  const hasSummaries = summaries && typeof summaries === 'object' && Object.keys(summaries).length > 0;

  // Group files by directory
  const groupedFiles = React.useMemo(() => {
    if (!hasSummaries) return {};
    
    // Check if summaries has repo_path key (invalid structure)
    if ('repo_path' in summaries) {
      console.error('⚠️ Invalid summaries structure - has repo_path key');
      return {};
    }
    
    const groups = {};
    try {
      Object.entries(summaries).forEach(([filename, summary]) => {
        const parts = filename.split('/');
        const dir = parts.length > 1 ? parts[0] : 'Root';
        if (!groups[dir]) groups[dir] = [];
        groups[dir].push({ filename, summary });
      });
    } catch (error) {
      console.error('Error grouping files:', error);
      return {};
    }
    return groups;
  }, [summaries, hasSummaries]);

  return (
    <div className="tab-panel">
      <div className="tab-panel-header">
        <h2>🔍 Code Analysis & Key Functions</h2>
        <p className="tab-panel-desc">
          AI-powered analysis of your codebase with explanations of main functions and modules
        </p>
      </div>

      {hasSummaries && Object.keys(groupedFiles).length > 0 ? (
        <div className="analysis-container">
          {Object.entries(groupedFiles).map(([directory, files]) => (
            <div key={directory} className="directory-section">
              <h3 className="directory-title">
                <span className="folder-icon">📂</span>
                {directory}
              </h3>
              
              <div className="files-grid">
                {files.map(({ filename, summary }) => (
                  <div key={filename} className="file-card">
                    <div className="file-card-header">
                      <span className="file-icon">
                        {filename.endsWith('.py') ? '🐍' :
                         filename.endsWith('.js') || filename.endsWith('.jsx') ? '📜' :
                         filename.endsWith('.ts') || filename.endsWith('.tsx') ? '📘' :
                         filename.endsWith('.java') ? '☕' :
                         filename.endsWith('.go') ? '🔵' :
                         '📄'}
                      </span>
                      <span className="file-name">{filename.split('/').pop()}</span>
                    </div>
                    <div className="file-card-body">
                      <p className="file-summary">
                        {typeof summary === 'string' 
                          ? summary 
                          : typeof summary === 'object' && summary !== null
                            ? JSON.stringify(summary, null, 2)
                            : String(summary || 'No summary available')
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="content-card">
          <div className="empty-state">
            <div className="empty-state-icon">🤖</div>
            <h3>No Code Analysis Available</h3>
            <p>AI-powered code analysis will provide insights into your main functions and modules.</p>
          </div>
        </div>
      )}

      {/* Changelog Section */}
      {repo.docs?.changelog && repo.docs.changelog.length > 0 && (
        <div className="content-card">
          <h3 className="card-title">📅 Recent Changes</h3>
          <div className="changelog-list">
            {repo.docs.changelog.map((entry, index) => (
              <div key={index} className="changelog-item">
                <span className="changelog-date">{entry.date}</span>
                <span className="changelog-entry">{entry.entry}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
