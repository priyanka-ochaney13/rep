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
import '../App.css';
import './RepoDocs.css';

const TABS = [
  { id: 'readme', label: 'README', icon: '📄' },
  { id: 'architecture', label: 'Architecture', icon: '🏗️' },
  { id: 'code-analysis', label: 'Code Analysis', icon: '🔍' },
];

export default function RepoDocsPage() {
  const { owner, name } = useParams();
  const { repos, updateRepo } = useRepos();
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
            <Link to="/repositories" className="btn-primary" style={{display:'inline-block',marginTop:'1.25rem'}}>Back</Link>
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
                <Link to="/repositories" className="btn-secondary small-btn">
                  Back
                </Link>
              </div>
            </div>

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
  const handleDownload = () => {
    const blob = new Blob([repo.docs?.readme || ''], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(repo.docs?.readme || '');
    alert('✓ Copied to clipboard!');
  };

  return (
    <div className="tab-panel">
      <div className="tab-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>📄 Project Documentation</h2>
          <p className="tab-panel-desc">
            Comprehensive README with setup instructions, usage examples, and contribution guidelines
          </p>
        </div>
        {repo.docs?.readme && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleDownload}
              style={{
                padding: '0.625rem 1.25rem',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#4f46e5'}
              onMouseOut={(e) => e.target.style.background = '#6366f1'}
            >
              ⬇️ Download Markdown
            </button>
            <button
              onClick={handleCopy}
              style={{
                padding: '0.625rem 1.25rem',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#7c3aed'}
              onMouseOut={(e) => e.target.style.background = '#8b5cf6'}
            >
              📋 Copy to Clipboard
            </button>
          </div>
        )}
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
            <div className="empty-state-icon">�</div>
            <h3>No README Available</h3>
            <p>The README hasn't been generated yet for this repository.</p>
          </div>
        )}
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

      {/* Folder Structure - Hidden as it's redundant with diagrams */}
      {/* {folderTree && (
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
      )} */}

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
    console.log('🎨 Starting export...');
    
    try {
      // Wait for rendering to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const svgElement = containerRef.current?.querySelector('.mermaid svg');
      console.log('📊 SVG Element:', svgElement);
      
      if (!svgElement) {
        console.error('❌ SVG not found');
        alert('❌ Diagram not found. Please wait for it to render completely.');
        setIsExporting(false);
        return;
      }

      // Clone the SVG to avoid modifying the original
      const svgClone = svgElement.cloneNode(true);
      
      // Add white background to the SVG
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '100%');
      rect.setAttribute('height', '100%');
      rect.setAttribute('fill', '#0b1625');
      svgClone.insertBefore(rect, svgClone.firstChild);
      
      // Ensure SVG has proper dimensions
      const bbox = svgElement.getBBox();
      const padding = 40;
      svgClone.setAttribute('width', bbox.width + padding * 2);
      svgClone.setAttribute('height', bbox.height + padding * 2);
      svgClone.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`);
      
      // Serialize SVG to string
      const svgData = new XMLSerializer().serializeToString(svgClone);
      
      // Create blob and download
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      const link = document.createElement('a');
      link.download = `${diagramKey || 'diagram'}-architecture.svg`;
      link.href = url;
      link.click();
      
      // Cleanup
      URL.revokeObjectURL(url);
      
      console.log('✅ Diagram exported as SVG');
      setIsExporting(false);
      
    } catch (err) {
      console.error('❌ Export error:', err);
      alert('Failed to export diagram. Error: ' + err.message);
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
            className="control-btn" 
            onClick={handleViewInNewTab}
            title="Open in New Tab"
          >
            Open in New Tab
          </button>
          <button 
            className="control-btn export-btn" 
            onClick={handleExportPNG}
            disabled={isExporting}
            title="Export as JPEG"
          >
            {isExporting ? '' : ''} Export
          </button>
          <label className="zoom-toggle" title="Toggle Zoom">
            <input 
              type="checkbox" 
              checked={enableZoom} 
              onChange={(e) => setEnableZoom(e.target.checked)}
            />
            <span>Zoom</span>
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
                    +
                  </button>
                  <button 
                    className="zoom-control-btn" 
                    onClick={() => zoomOut(0.3)}
                    title="Zoom Out"
                  >
                    −
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
    </div>
  );
}

// Code Analysis Tab Component - Enhanced with Project Structure
function CodeAnalysisTab({ repo }) {
  const summaries = repo.docs?.summary;
  const projectAnalysis = repo.docs?.projectAnalysis;
  
  // Debug: log what we're getting
  React.useEffect(() => {
    console.log('📊 Project Analysis data:', projectAnalysis);
    console.log('📊 Summaries data:', summaries);
  }, [summaries, projectAnalysis]);
  
  const hasSummaries = summaries && typeof summaries === 'object' && Object.keys(summaries).length > 0;
  const hasAnalysis = projectAnalysis && projectAnalysis.detailed_analysis;

  // Export functions
  const exportAsMarkdown = () => {
    if (!hasAnalysis || !projectAnalysis.detailed_analysis) return;
    
    let markdown = `# Code Analysis Report\n\n`;
    markdown += `**Repository:** ${repo.owner}/${repo.name}\n\n`;
    markdown += `**Generated:** ${new Date().toLocaleDateString()}\n\n`;
    
    // Statistics
    markdown += `## Statistics\n\n`;
    markdown += `- **Files Analyzed:** ${projectAnalysis.file_count || 0}\n`;
    markdown += `- **Languages:** ${projectAnalysis.languages?.length || 0}\n`;
    markdown += `- **Detailed Analyses:** ${Object.keys(projectAnalysis.detailed_analysis).length}\n\n`;
    
    // File analyses
    markdown += `## File Analysis\n\n`;
    Object.entries(projectAnalysis.detailed_analysis).forEach(([filepath, analysis]) => {
      markdown += `### ${filepath}\n\n`;
      
      if (analysis.language) {
        markdown += `**Language:** ${analysis.language}\n\n`;
      }
      
      if (analysis.purpose) {
        markdown += `**Purpose:**\n${analysis.purpose}\n\n`;
      }
      
      if (analysis.functions && analysis.functions.length > 0) {
        markdown += `**Key Functions & Components:**\n`;
        analysis.functions.forEach(func => {
          markdown += `- ${func}\n`;
        });
        markdown += `\n`;
      }
      
      if (analysis.key_details && analysis.key_details.length > 0) {
        markdown += `**Technical Details:**\n`;
        analysis.key_details.forEach(detail => {
          markdown += `- ${detail}\n`;
        });
        markdown += `\n`;
      }
      
      markdown += `---\n\n`;
    });
    
    // Download
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${repo.name}-code-analysis.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsPDF = () => {
    if (!hasAnalysis || !projectAnalysis.detailed_analysis) return;
    
    // Create a printable HTML version
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Code Analysis - ${repo.name}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          h1 { color: #1a1a1a; border-bottom: 3px solid #6366f1; padding-bottom: 10px; }
          h2 { color: #2d3748; margin-top: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
          h3 { color: #4a5568; margin-top: 25px; }
          h4 { color: #718096; text-transform: uppercase; font-size: 0.875rem; letter-spacing: 0.05em; margin-top: 20px; }
          .meta { color: #666; font-size: 0.9rem; margin-bottom: 30px; }
          .stats { 
            background: #f7fafc; 
            padding: 20px; 
            border-radius: 8px; 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 20px;
            margin: 20px 0;
          }
          .stat-item { text-align: center; }
          .stat-value { font-size: 2rem; font-weight: bold; color: #6366f1; }
          .stat-label { font-size: 0.875rem; color: #718096; }
          .file-analysis {
            margin: 30px 0;
            padding: 20px;
            background: #f9fafb;
            border-left: 4px solid #6366f1;
            border-radius: 4px;
            page-break-inside: avoid;
          }
          .language-badge {
            display: inline-block;
            background: #e0e7ff;
            color: #5b21b6;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            margin-bottom: 10px;
          }
          .purpose { margin: 15px 0; }
          .section { margin: 20px 0; }
          ul { margin: 10px 0; padding-left: 20px; }
          li { margin: 8px 0; }
          code { 
            background: #edf2f7; 
            padding: 2px 6px; 
            border-radius: 3px; 
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 0.9em;
          }
          hr { border: none; border-top: 1px solid #e2e8f0; margin: 30px 0; }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>Code Analysis Report</h1>
        <div class="meta">
          <strong>Repository:</strong> ${repo.owner}/${repo.name}<br>
          <strong>Generated:</strong> ${new Date().toLocaleString()}
        </div>
        
        <h2>Statistics</h2>
        <div class="stats">
          <div class="stat-item">
            <div class="stat-value">${projectAnalysis.file_count || 0}</div>
            <div class="stat-label">Files Analyzed</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${projectAnalysis.languages?.length || 0}</div>
            <div class="stat-label">Languages</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${Object.keys(projectAnalysis.detailed_analysis).length}</div>
            <div class="stat-label">Detailed Analyses</div>
          </div>
        </div>
        
        <h2>File Analysis</h2>
    `;
    
    Object.entries(projectAnalysis.detailed_analysis).forEach(([filepath, analysis]) => {
      html += `<div class="file-analysis">`;
      html += `<h3>${filepath}</h3>`;
      
      if (analysis.language) {
        html += `<span class="language-badge">${analysis.language}</span>`;
      }
      
      if (analysis.purpose) {
        html += `<div class="purpose"><h4>Purpose</h4><p>${analysis.purpose}</p></div>`;
      }
      
      if (analysis.functions && analysis.functions.length > 0) {
        html += `<div class="section"><h4>Key Functions & Components</h4><ul>`;
        analysis.functions.forEach(func => {
          html += `<li>${func}</li>`;
        });
        html += `</ul></div>`;
      }
      
      if (analysis.key_details && analysis.key_details.length > 0) {
        html += `<div class="section"><h4>Technical Details</h4><ul>`;
        analysis.key_details.forEach(detail => {
          html += `<li>${detail}</li>`;
        });
        html += `</ul></div>`;
      }
      
      html += `</div>`;
    });
    
    html += `
        <div class="no-print" style="margin-top: 40px; text-align: center;">
          <button onclick="window.print()" style="
            background: #6366f1; 
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 6px; 
            font-size: 1rem; 
            cursor: pointer;
            font-weight: 600;
          ">Print / Save as PDF</button>
          <button onclick="window.close()" style="
            background: #e2e8f0; 
            color: #1a1a1a; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 6px; 
            font-size: 1rem; 
            cursor: pointer;
            margin-left: 10px;
            font-weight: 600;
          ">Close</button>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

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
      <div className="tab-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Code Analysis & Project Structure</h2>
          <p className="tab-panel-desc">
            Detailed breakdown of your project structure with AI-powered analysis of each file's purpose and key functions
          </p>
        </div>
        {hasAnalysis && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={exportAsMarkdown}
              style={{
                padding: '0.625rem 1.25rem',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#4f46e5'}
              onMouseOut={(e) => e.target.style.background = '#6366f1'}
            >
              📄 Export MD
            </button>
            <button
              onClick={exportAsPDF}
              style={{
                padding: '0.625rem 1.25rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#059669'}
              onMouseOut={(e) => e.target.style.background = '#10b981'}
            >
              📑 Export PDF
            </button>
          </div>
        )}
      </div>

      {/* Project Statistics */}
      {hasAnalysis && (
        <div className="content-card" style={{ marginBottom: '2rem' }}>
          <div className="structure-stats" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            padding: '1rem',
            background: 'rgba(99, 102, 241, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6366f1' }}>
                {projectAnalysis.file_count || 0}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#8b949e' }}>Files Analyzed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                {projectAnalysis.languages?.length || 0}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#8b949e' }}>Languages</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                {Object.keys(projectAnalysis.detailed_analysis || {}).length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#8b949e' }}>Detailed Analyses</div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed File Analysis */}
      {hasAnalysis && projectAnalysis.detailed_analysis ? (
        <div className="analysis-container">
          <h3 style={{ 
            fontSize: '1.25rem', 
            marginBottom: '1.5rem',
            color: '#d0d7e2',
            fontWeight: '600'
          }}>
            Detailed File Analysis
          </h3>
          
          {Object.entries(projectAnalysis.detailed_analysis).map(([filepath, analysis]) => (
            <FileAnalysisCard key={filepath} filepath={filepath} analysis={analysis} />
          ))}
        </div>
      ) : hasSummaries && Object.keys(groupedFiles).length > 0 ? (
        // Fallback to old summary display if new analysis not available
        <div className="analysis-container">
          {Object.entries(groupedFiles).map(([directory, files]) => (
            <div key={directory} className="directory-section">
              <h3 className="directory-title">
                <span className="folder-icon"></span>
                {directory}
              </h3>
              
              <div className="files-grid">
                {files.map(({ filename, summary }) => (
                  <div key={filename} className="file-card">
                    <div className="file-card-header">
                      <span className="file-icon"></span>
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
            <div className="empty-state-icon"></div>
            <h3>No Code Analysis Available</h3>
            <p>AI-powered code analysis will provide insights into your main functions and modules.</p>
          </div>
        </div>
      )}

      {/* Changelog Section */}
      {repo.docs?.changelog && repo.docs.changelog.length > 0 && (
        <div className="content-card">
          <h3 className="card-title">Recent Changes</h3>
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

// New component for displaying detailed file analysis
function FileAnalysisCard({ filepath, analysis }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  const getFileIcon = (filename) => {
    // Return empty string - no emojis
    return '';
  };

  const filename = filepath.split('/').pop();
  const directory = filepath.substring(0, filepath.lastIndexOf('/')) || 'root';

  return (
    <div className="file-analysis-card" style={{
      background: '#0f1724',
      border: '1px solid #1f2b3b',
      borderRadius: '12px',
      marginBottom: '1.5rem',
      overflow: 'hidden',
      transition: 'all 0.2s ease'
    }}>
      {/* File Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '1.25rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isExpanded ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
          transition: 'background 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontWeight: '600', 
              color: '#d0d7e2',
              fontSize: '1rem',
              marginBottom: '0.25rem'
            }}>
              {filename}
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#8b949e',
              fontFamily: 'ui-monospace, monospace'
            }}>
              {directory}
            </div>
          </div>
          {analysis.language && (
            <span style={{
              padding: '0.25rem 0.75rem',
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              borderRadius: '12px',
              fontSize: '0.75rem',
              color: '#a5b4fc',
              fontWeight: '500'
            }}>
              {analysis.language}
            </span>
          )}
        </div>
        <div style={{
          fontSize: '1.25rem',
          color: '#6b7280',
          transition: 'transform 0.2s ease',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          ▼
        </div>
      </div>

      {/* File Details - Expandable */}
      {isExpanded && (
        <div style={{ padding: '0 1.25rem 1.25rem 1.25rem' }}>
          {/* Purpose */}
          {analysis.purpose && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ 
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#8b949e',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Purpose
              </h4>
              <p style={{ 
                color: '#d0d7e2',
                lineHeight: '1.6',
                fontSize: '0.9375rem'
              }}>
                {analysis.purpose}
              </p>
            </div>
          )}

          {/* Consolidated Details Card */}
          {((analysis.functions && analysis.functions.length > 0) || (analysis.key_details && analysis.key_details.length > 0)) && (
            <div style={{ 
              background: 'rgba(99, 102, 241, 0.05)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              {/* Key Functions Section */}
              {analysis.functions && analysis.functions.length > 0 && (
                <div style={{ marginBottom: analysis.key_details && analysis.key_details.length > 0 ? '1.5rem' : '0' }}>
                  <h4 style={{ 
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#8b949e',
                    marginBottom: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Key Functions & Components
                  </h4>
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    {analysis.functions.map((func, idx) => (
                      <div key={idx} style={{
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.875rem',
                        color: '#d0d7e2',
                        fontFamily: 'ui-monospace, monospace',
                        lineHeight: '1.5',
                        borderLeft: '3px solid rgba(99, 102, 241, 0.5)',
                        paddingLeft: '0.75rem'
                      }}>
                        {func}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Details Section */}
              {analysis.key_details && analysis.key_details.length > 0 && (
                <div>
                  <h4 style={{ 
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#8b949e',
                    marginBottom: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Technical Details
                  </h4>
                  <ul style={{ 
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    {analysis.key_details.map((detail, idx) => (
                      <li key={idx} style={{
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.875rem',
                        color: '#d0d7e2',
                        lineHeight: '1.5',
                        borderLeft: '3px solid rgba(99, 102, 241, 0.5)',
                        paddingLeft: '0.75rem'
                      }}>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Symbols/Exports */}
          {analysis.symbols && analysis.symbols.length > 0 && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #1f2b3b' }}>
              <h4 style={{ 
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#6b7280',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Detected Symbols
              </h4>
              <div style={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                {analysis.symbols.slice(0, 10).map((symbol, idx) => (
                  <span key={idx} style={{
                    padding: '0.25rem 0.625rem',
                    background: 'rgba(107, 114, 128, 0.2)',
                    border: '1px solid rgba(107, 114, 128, 0.4)',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    color: '#9ca3af',
                    fontFamily: 'ui-monospace, monospace'
                  }}>
                    {symbol}
                  </span>
                ))}
                {analysis.symbols.length > 10 && (
                  <span style={{
                    padding: '0.25rem 0.625rem',
                    color: '#6b7280',
                    fontSize: '0.75rem'
                  }}>
                    +{analysis.symbols.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
