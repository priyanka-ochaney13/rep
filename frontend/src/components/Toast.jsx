import React, { useEffect } from 'react';

export default function Toast({ message, type = 'info', duration = 3000, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    toast: {
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      padding: '1rem 1.5rem',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      minWidth: '300px',
      maxWidth: '500px',
      animation: 'slideInRight 0.3s ease-out',
      background: type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 
                  type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 
                  'rgba(99, 102, 241, 0.15)',
      border: type === 'success' ? '1px solid rgba(16, 185, 129, 0.4)' : 
              type === 'error' ? '1px solid rgba(239, 68, 68, 0.4)' : 
              '1px solid rgba(99, 102, 241, 0.4)',
      color: '#d0d7e2'
    },
    icon: {
      fontSize: '1.25rem',
      flexShrink: 0
    },
    message: {
      flex: 1,
      fontSize: '0.9375rem',
      lineHeight: '1.5'
    },
    closeButton: {
      background: 'transparent',
      border: 'none',
      color: '#8b949e',
      cursor: 'pointer',
      fontSize: '1.25rem',
      padding: '0',
      width: '20px',
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      opacity: 0.7,
      transition: 'opacity 0.2s ease'
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return '🔄';
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div style={styles.toast}>
        <span style={styles.icon}>{getIcon()}</span>
        <span style={styles.message}>{message}</span>
        <button 
          style={styles.closeButton}
          onClick={onClose}
          onMouseEnter={(e) => e.target.style.opacity = '1'}
          onMouseLeave={(e) => e.target.style.opacity = '0.7'}
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    </>
  );
}
