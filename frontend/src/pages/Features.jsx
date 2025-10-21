import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../App.css';

const features = [
  {
    title: 'AI-Powered Generation',
    desc: 'Automatically creates comprehensive READMEs, code summaries, and changelogs using advanced AI models trained on millions of repositories.',
    icon: '✨',
    color: '--c1',
    details: [
      'Smart code analysis and understanding',
      'Context-aware documentation generation',
      'Natural language explanations',
      'Automated API documentation'
    ]
  },
  {
    title: 'Mermaid Diagrams',
    desc: 'Generate beautiful, exportable diagrams using Mermaid.js – visualize your code structure, dependencies, and workflows automatically.',
    icon: '📊',
    color: '--c2',
    details: [
      'Automatic architecture diagrams',
      'Dependency flow charts',
      'Database schema visualization',
      'Export as PNG or SVG'
    ]
  },
  {
    title: 'Real-Time Updates',
    desc: 'Documentation automatically updates with every repository change, ensuring consistency and accuracy across your entire team.',
    icon: '⚡',
    color: '--c3',
    details: [
      'GitHub webhook integration',
      'Instant documentation refresh',
      'Version history tracking',
      'Change notifications'
    ]
  },
  {
    title: 'Multiple Export Formats',
    desc: 'Export documentation in PDF and Markdown formats for maximum flexibility. Share with your team or integrate into existing workflows.',
    icon: '📥',
    color: '--c4',
    details: [
      'PDF export with custom styling',
      'Markdown for GitHub/GitLab',
      'HTML documentation sites',
      'API documentation formats'
    ]
  },
  {
    title: 'Code Summaries',
    desc: 'Get instant summaries of complex codebases. Understand what each file, function, and module does without reading thousands of lines.',
    icon: '📝',
    color: '--c1',
    details: [
      'File-level summaries',
      'Function documentation',
      'Complex logic explanations',
      'Quick onboarding guides'
    ]
  },
  {
    title: 'Smart Changelogs',
    desc: 'Automatically generate changelogs from your git history. Never manually write release notes again.',
    icon: '📋',
    color: '--c2',
    details: [
      'Semantic version detection',
      'Grouped by feature/fix/breaking',
      'Contributor attribution',
      'Release note generation'
    ]
  },
  {
    title: 'Multi-Language Support',
    desc: 'Works with JavaScript, TypeScript, Python, Go, Java, and more. One tool for all your projects.',
    icon: '🌐',
    color: '--c3',
    details: [
      'JavaScript & TypeScript',
      'Python',
      'Go, Java, C++',
      'Framework-specific docs'
    ]
  },
  {
    title: 'Team Collaboration',
    desc: 'Share documentation with your team, manage access permissions, and collaborate on improving your docs.',
    icon: '👥',
    color: '--c4',
    details: [
      'Team workspaces',
      'Role-based access control',
      'Commenting and feedback',
      'Approval workflows'
    ]
  }
];

const useCases = [
  {
    title: 'For Developers',
    desc: 'Spend less time writing docs, more time coding. Focus on building features while RepoX handles documentation.',
    icon: '💻'
  },
  {
    title: 'For Teams',
    desc: 'Ensure everyone has access to up-to-date documentation. Improve collaboration and reduce onboarding time.',
    icon: '🤝'
  },
  {
    title: 'For Open Source',
    desc: 'Make your projects more accessible. Good documentation attracts more contributors and users.',
    icon: '🌟'
  }
];

export default function FeaturesPage() {
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
            <span className="gradient">Professional Documentation</span>
          </h1>
          <p>
            RepoX combines AI-powered generation, real-time updates, and flexible export options
            to deliver the most comprehensive documentation solution for modern development teams.
          </p>
        </section>

        {/* Core Features */}
        <section className="section padded" style={{ paddingTop: '2rem' }}>
          <div className="section-inner">
            <h2 className="section-title">Core Features</h2>
            <p className="section-lead">
              Powerful automation tools that save you hours of manual work
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
              Simple, automated workflow that integrates seamlessly with your development process
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
                  desc: 'Simply provide your GitHub repository URL. RepoX securely accesses your code.'
                },
                {
                  step: '2',
                  title: 'AI Analyzes Your Code',
                  desc: 'Our advanced AI reads through your codebase, understanding structure, dependencies, and logic.'
                },
                {
                  step: '3',
                  title: 'Documentation Generated',
                  desc: 'Comprehensive docs, diagrams, and summaries are created automatically in seconds.'
                },
                {
                  step: '4',
                  title: 'Export & Share',
                  desc: 'Download in your preferred format or share directly with your team.'
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
              Join thousands of developers who've already automated their documentation workflow
            </p>
            <div className="cta-row">
              <button 
                className="btn-primary"
                onClick={() => window.location.href = '/repositories'}
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
