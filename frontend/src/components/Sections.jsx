import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

export function StatsStrip({ stats }) {
  return (
    <section className="stats-strip" aria-label="Key metrics">
      <div className="stats-grid">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProblemSection({ items }) {
  return (
    <section id="problem" className="section padded" aria-labelledby="problem-heading">
      <div className="section-inner">
        <h2 id="problem-heading" className="section-title">The Documentation Problem</h2>
        <p className="section-lead">Manual documentation slows team collaboration and developer onboarding because it's a time‑consuming process that lacks proper automation.</p>
        <div className="card-grid three-cols">
          {items.map(item => (
            <div key={item.title} className="info-card problem">
              <div className="icon-badge" aria-hidden="true">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection({ features }) {
  return (
    <section id="features" className="section padded" aria-labelledby="features-heading">
      <div className="section-inner">
        <h2 id="features-heading" className="section-title">Automated Documentation,<br /> <span className="gradient-text">Built for Developers</span></h2>
        <div className="card-grid two-cols four-rows">
          {features.map(f => (
            <div key={f.title} className="info-card feature">
              <div className="icon-badge" data-color={f.color} aria-hidden="true">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTASection() {
  const navigate = useNavigate();
  return (
    <section id="cta" className="section cta padded" aria-labelledby="cta-heading">
      <div className="section-inner cta-inner">
        <h2 id="cta-heading" className="section-title">Ready to Automate Your Docs?</h2>
        <p className="section-lead">Join thousands of developers who've already saved countless hours with RepoX</p>
        <div className="cta-row">
          <button className="btn-primary" onClick={() => navigate('/repositories')}>Connect Your First Repo →</button>
        </div>
      </div>
    </section>
  );
}
