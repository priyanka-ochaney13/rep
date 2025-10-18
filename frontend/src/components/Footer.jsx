import React from 'react';
import './layout.css';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="rx-footer" role="contentinfo">
      <div className="rx-container rx-footer-inner">
        <div className="rx-footer-left">© {year} RepoX. All rights reserved.</div>
        <div className="rx-footer-right">
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="mailto:contact@repox.example">Contact</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
