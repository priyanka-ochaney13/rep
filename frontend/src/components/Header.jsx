import React, { useState } from 'react';
import './layout.css';
import { useAuth } from '../context/AuthContext.jsx';
import AuthModal from './AuthModal.jsx';

export function Header() {
  const { user, setAuthModalOpen } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const initial = (user?.displayName || user?.email || 'U')?.[0]?.toUpperCase() || 'U';
  const name = user?.displayName || user?.email || '';
  return (
    <>
      <header className="rx-header">
        <div className="rx-container rx-header-inner">
          <div className="rx-logo">RepoX</div>
          <nav className="rx-nav" aria-label="Main navigation">
            <a href="#features">Features</a>
            <a href="#problem">Problem</a>
            <a href="#cta">Get Started</a>
            {!user ? (
              <button className="btn-primary btn-sm" onClick={() => setAuthModalOpen(true)}>Login / Sign Up</button>
            ) : (
              <div className="relative" style={{marginLeft:'1rem'}}>
                <button onClick={() => setMenuOpen((v) => !v)} className="user-pill">
                  <span className="user-avatar" aria-hidden>{initial}</span>
                  <span className="user-name">{name}</span>
                </button>
                {menuOpen && (
                  <UserMenu onClose={() => setMenuOpen(false)} />
                )}
              </div>
            )}
          </nav>
        </div>
      </header>
      <AuthModal />
    </>
  );
}

function UserMenu({ onClose }) {
  const { logout } = useAuth();
  const handleLogout = async () => {
    await logout();
    onClose?.();
  };
  return (
    <div className="user-menu">
      <button onClick={handleLogout} className="user-menu-item">Logout</button>
    </div>
  );
}

export default Header;
