import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../App.css';

const features = [
  {
    title: 'AI-Powered Generation',
    desc: 'Automatically creates comprehensive READMEs, code summaries, and detailed project analysis using advanced AI models powered by Mistral AI.',
    icon: '✨',
    color: '--c1',
    details: [
      'Mistral AI-powered code understanding',
      'Context-aware documentation generation',
      'Natural language explanations',
      'Automated file-level analysis'
    ]
  },
  {
    title: 'Interactive Mermaid Diagrams',
    desc: 'Generate beautiful, interactive architecture diagrams with zoom, pan, and export capabilities. Visualize your code structure professionally.',
    icon: '📊',
    color: '--c2',
    details: [
      'Automatic architecture flowcharts',
      'Hierarchical component organization',
      'Interactive zoom & pan controls',
      'Export as SVG or PNG'
    ]
  },
  {
    title: 'Smart Documentation Regeneration',
    desc: 'Manually check for repository changes and regenerate documentation with one click. Keep your docs in sync without creating duplicates.',
    icon: '🔄',
    color: '--c3',
    details: [
      'Manual change detection',
      'One-click regeneration',
      'Preserves record history',
      'Tracks commit metadata'
    ]
  },
  {
    title: 'GitHub Integration',
    desc: 'Connect any public or private GitHub repository. Support for custom branches, commit tracking, and secure authentication.',
    icon: '�',
    color: '--c4',
    details: [
      'Public & private repositories',
      'Custom branch support',
      'Commit SHA tracking',
      'GitHub API integration'
    ]
  },
  {
    title: 'Detailed Code Analysis',
    desc: 'Get comprehensive analysis of each file including purpose, key functions, technical details, and language detection.',
    icon: '�',
    color: '--c1',
    details: [
      'File-level purpose analysis',
      'Function & component detection',
      'Technical implementation details',
      'Export as MD or PDF'
    ]
  },
  {
    title: 'Zero Local Storage',
    desc: 'All processing happens in-memory with no temporary files created. Secure, fast, and leaves no trace on the server.',
    icon: '�',
    color: '--c2',
    details: [
      'In-memory code processing',
      'No temporary files',
      'Enhanced security',
      'Faster generation'
    ]
  },
  {
    title: 'Multi-Language Support',
    desc: 'Works with JavaScript, TypeScript, Python, Java, Go, and more. Automatically detects languages and frameworks.',
    icon: '🌐',
    color: '--c3',
    details: [
      'JavaScript, TypeScript, JSX',
      'Python',
      'Java, Go, C++, Rust',
      'Framework detection'
    ]
  },
  {
    title: 'AWS Cognito Authentication',
    desc: 'Secure user authentication with AWS Cognito. Email verification, JWT tokens, and protected API endpoints.',
    icon: '�',
    color: '--c4',
    details: [
      'Email verification',
      'JWT token authentication',
      'Secure password policies',
      'Protected user data'
    ]
  }
];

const useCases = [
  {
    title: 'For Developers',
    desc: 'Spend less time writing docs, more time coding. Generate professional documentation in seconds with AI-powered analysis.',
    icon: '💻'
  },
  {
    title: 'For Teams',
    desc: 'Keep documentation synchronized with your codebase. Check for changes and regenerate docs manually when needed without creating duplicates.',
    icon: '🤝'
  },
  {
    title: 'For Open Source',
    desc: 'Make your projects more accessible with comprehensive READMEs, architecture diagrams, and detailed code analysis.',
    icon: '🌟'
  }
];

export default function FeaturesPage() {
  const navigate = useNavigate();
  const { user, setAuthModalOpen, setAuthModalTab, setRedirectPath } = useAuth();

  const handleGetStarted = () => {
    if (!user) {
      setAuthModalTab('login');
      setRedirectPath('/repositories');
      setAuthModalOpen(true);
    } else {
      navigate('/repositories');
    }
  };

  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="hero" style={{ paddingTop: '4rem', paddingBottom: '2rem' }}>
          <div className="hero-badge">Complete Feature Set</div>
          <h1>
            Everything You Need for
            <br />
            <span className="gradient">Automated Documentation</span>
          </h1>
          <p>
            RepoX combines Mistral AI-powered analysis, interactive architecture diagrams, and smart regeneration
            to deliver comprehensive documentation that stays in sync with your codebase.
          </p>
        </section>

        {/* Core Features */}
        <section className="section padded" style={{ paddingTop: '2rem' }}>
          <div className="section-inner">
            <h2 className="section-title">Core Features</h2>
            <p className="section-lead">
              Powerful AI automation and smart features that save you hours of manual work
            </p>
            <div className="card-grid two-cols four-rows">
              {features.map((feature) => (
                <div key={feature.title} className="info-card">
                  <div className="icon-badge" data-color={feature.color} aria-hidden="true">
                    {feature.icon}
                  </div>
                  <h3>{feature.title}</h3>
                  <p style={{ marginBottom: '1rem' }}>{feature.desc}</p>
                  <ul style={{ 
                    margin: 0, 
                    padding: '0 0 0 1.25rem', 
                    color: '#9da9b8', 
                    fontSize: '0.85rem',
                    lineHeight: '1.6' 
                  }}>
                    {feature.details.map((detail, idx) => (
                      <li key={idx}>{detail}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="section padded" style={{ background: 'linear-gradient(145deg,#0e1728,#0d1322)' }}>
          <div className="section-inner">
            <h2 className="section-title">Built for Everyone</h2>
            <p className="section-lead">
              Whether you're a solo developer or part of a large team, RepoX adapts to your workflow
            </p>
            <div className="card-grid three-cols">
              {useCases.map((useCase) => (
                <div key={useCase.title} className="info-card">
                  <div className="icon-badge" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                    {useCase.icon}
                  </div>
                  <h3>{useCase.title}</h3>
                  <p>{useCase.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="section padded">
          <div className="section-inner">
            <h2 className="section-title">How It Works</h2>
            <p className="section-lead">
              Simple automated workflow with zero local storage - everything processes in-memory
            </p>
            <div style={{ 
              maxWidth: '800px', 
              margin: '0 auto',
              display: 'grid',
              gap: '1.5rem'
            }}>
              {[
                {
                  step: '1',
                  title: 'Connect Your Repository',
                  desc: 'Provide your GitHub repository URL and branch. RepoX securely accesses your code using GitHub API.'
                },
                {
                  step: '2',
                  title: 'AI Analyzes Your Code',
                  desc: 'Mistral AI reads through your codebase in-memory, understanding structure, dependencies, and logic without storing files locally.'
                },
                {
                  step: '3',
                  title: 'Documentation Generated',
                  desc: 'Comprehensive README, interactive Mermaid diagrams, and detailed file analysis are created automatically in seconds.'
                },
                {
                  step: '4',
                  title: 'View, Export & Regenerate',
                  desc: 'View docs in an interactive UI, export as Markdown/PDF, or regenerate when your code changes.'
                }
              ].map((step) => (
                <div 
                  key={step.step}
                  style={{
                    display: 'flex',
                    gap: '1.5rem',
                    alignItems: 'flex-start',
                    background: 'linear-gradient(165deg,#141b2b,#121726)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: '.9rem',
                    padding: '1.5rem'
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg,#14b8ff,#3b82f6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#0b1625',
                    flexShrink: 0
                  }}>
                    {step.step}
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>{step.title}</h3>
                    <p style={{ margin: 0, color: '#b6c1ce', fontSize: '0.95rem', lineHeight: '1.5' }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section cta padded">
          <div className="section-inner cta-inner">
            <h2 className="section-title">Ready to Get Started?</h2>
            <p className="section-lead">
              Join developers who've automated their documentation workflow with AI-powered generation
            </p>
            <div className="cta-row">
              <button 
                className="btn-primary"
                onClick={handleGetStarted}
              >
                Connect Your First Repo →
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
