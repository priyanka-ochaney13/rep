import './App.css';
import Header from './components/Header.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Footer from './components/Footer.jsx';
import { StatsStrip, ProblemSection, FeaturesSection, CTASection } from './components/Sections.jsx';
import { useNavigate } from 'react-router-dom';

const stats = [
  { value: '10x', label: 'Faster Onboarding' },
  { value: '100%', label: 'Always Up-to-Date' },
  { value: '0', label: 'Manual Work' }
];

const problems = [
  { title: 'Time-Consuming', desc: 'Developers spend hours writing and updating documentation instead of building features', icon: '⏱️' },
  { title: 'Always Outdated', desc: 'Documentation quickly becomes stale as code changes, leading to confusion and errors', icon: '📄' },
  { title: 'Low Adoption', desc: 'Teams ignore docs when they are incomplete, inconsistent or hard to navigate', icon: '⚠️' }
];

const features = [
  { title: 'AI-Powered Generation', desc: 'Automatically creates comprehensive READMEs, code summaries, and changelogs using advanced AI', icon: '✨', color: '--c1' },
  { title: 'Mermaid Diagrams', desc: 'Generate beautiful, exportable diagrams using Mermaid.js – a feature rare in current tools', icon: '🔗', color: '--c2' },
  { title: 'Real-Time Updates', desc: 'Documentation automatically updates with every repository change, ensuring consistency', icon: '⚡', color: '--c3' },
  { title: 'Multiple Export Formats', desc: 'Export documentation in PDF and Markdown formats for maximum flexibility', icon: '⬇️', color: '--c4' }
];

function App() {
  const navigate = useNavigate();
  const { user, setAuthModalOpen, setAuthModalTab, setRedirectPath } = useAuth();
  return (
    <>
      <Header />
      <main>
        <section className="hero" id="hero">
          <div className="hero-badge">⚡ AI-Powered Documentation</div>
          <h1>
            Stop Writing Docs.<br />
            <span className="gradient">Start Building.</span>
          </h1>
          <p>
            RepoX connects to your GitHub repositories and automatically generates comprehensive documentation,
            so your team can focus on innovation instead of tedious manual work.
          </p>
          <div className="cta-row">
            <button
              className="btn-primary"
              onClick={() => {
                if (!user) {
                  setAuthModalTab('login');
                  setRedirectPath('/repositories');
                  setAuthModalOpen(true);
                } else {
                  navigate('/repositories');
                }
              }}
            >Get Started →</button>
            <button className="btn-secondary">Live Demo</button>
          </div>
        </section>
        <StatsStrip stats={stats} />
        <ProblemSection items={problems} />
        <FeaturesSection features={features} />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}

export default App;
