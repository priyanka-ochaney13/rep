import React, { useState, useEffect, useRef } from 'react';
import './layout.css';
import { useAuth } from '../context/AuthContext.jsx';
import AuthModal from './AuthModal.jsx';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { user, setAuthModalOpen } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const initial = (user?.displayName || user?.email || 'U')?.[0]?.toUpperCase() || 'U';
  const name = user?.displayName || user?.email || '';

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  return (
    <>
      <header className="rx-header">
        <div className="rx-container rx-header-inner">
          <div className="rx-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>RepoX</div>
          <nav className="rx-nav" aria-label="Main navigation">
            <a onClick={() => navigate('/features')} style={{ cursor: 'pointer' }}>Features</a>
            {user && <a onClick={() => navigate('/repositories')} style={{ cursor: 'pointer' }}>Repositories</a>}
            {!user ? (
              <button className="btn-primary btn-sm" onClick={() => setAuthModalOpen(true)}>Login / Sign Up</button>
            ) : (
              <div className="relative" style={{marginLeft:'1rem'}} ref={menuRef}>
                <button onClick={() => setMenuOpen((v) => !v)} className="user-pill">
                  <span className="user-avatar" aria-hidden>{initial}</span>
                  <span className="user-name">{name}</span>
                </button>
                {menuOpen && (
                  <UserMenu onClose={() => setMenuOpen(false)} navigate={navigate} />
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

function UserMenu({ onClose, navigate }) {
  const { logout } = useAuth();
  const handleLogout = async () => {
    await logout();
    onClose?.();
    navigate('/');
  };
  const handleProfile = () => {
    navigate('/profile');
    onClose?.();
  };
  return (
    <div className="user-menu">
      <button onClick={handleProfile} className="user-menu-item">Profile</button>
      <button onClick={() => { navigate('/repositories'); onClose?.(); }} className="user-menu-item">Repositories</button>
      <button onClick={handleLogout} className="user-menu-item">Logout</button>
    </div>
  );
}

export default Header;
