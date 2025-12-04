import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef(null);

  const isActive = (path) => (location.pathname === path ? 'active' : '');

  // Close dropdown when navigating
  useEffect(() => {
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [userMenuOpen]);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const handleNav = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <nav className={`navbar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <button
        className="hamburger"
        aria-label="Toggle navigation"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        ☰
      </button>

      <div className="navbar-header">
        <div>
          <div className="navbar-title">🏸 BadSession</div>
          <div className="navbar-subtitle">Team Management</div>
        </div>
        <button
          className="sidebar-toggle"
          aria-label="Toggle sidebar"
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </div>

      <div className="user-menu">
        <button 
          className="user-menu-trigger"
          onClick={() => setUserMenuOpen(!userMenuOpen)}
        >
          <div className="user-info-display">
            <div className="user-name">{user?.full_name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <span className="user-menu-icon">▼</span>
        </button>
        
        {userMenuOpen && (
          <div className="user-dropdown" ref={userMenuRef}>
            <button 
              className="logout-btn-dropdown"
              onClick={() => {
                handleLogout();
                setUserMenuOpen(false);
              }}
            >
              <span className="logout-icon">🚪</span>
              <span className="logout-label">Logout</span>
            </button>
          </div>
        )}
      </div>

  {menuOpen && <div className="mobile-backdrop show" onClick={() => setMenuOpen(false)} />}

  <ul className={`nav-menu ${menuOpen ? 'open' : ''}`}>
        <li className="nav-item">
          <a className={`nav-link ${isActive('/')}`} onClick={() => handleNav('/')}>
            <span className="nav-icon">📊</span>
            <span className="nav-label">Dashboard</span>
          </a>
        </li>
        <li className="nav-item calendar-item">
          <a className={`nav-link calendar-link ${isActive('/calendar')}`} onClick={() => handleNav('/calendar')}>
            <span className="nav-icon">📅</span>
            <span className="nav-label">Calendar</span>
            <span className="calendar-badge">NEW</span>
          </a>
        </li>
        <li className="nav-item">
          <a className={`nav-link ${isActive('/sessions')}`} onClick={() => handleNav('/sessions')}>
            <span className="nav-icon">🏸</span>
            <span className="nav-label">Sessions</span>
          </a>
        </li>
        <li className="nav-item">
          <a className={`nav-link ${isActive('/players')}`} onClick={() => handleNav('/players')}>
            <span className="nav-icon">👥</span>
            <span className="nav-label">Players</span>
          </a>
        </li>
        <li className="nav-item">
          <a className={`nav-link ${isActive('/guests')}`} onClick={() => handleNav('/guests')}>
            <span className="nav-icon">👤</span>
            <span className="nav-label">Guests</span>
          </a>
        </li>
        <li className="nav-item">
          <a className={`nav-link ${isActive('/finance')}`} onClick={() => handleNav('/finance')}>
            <span className="nav-icon">💰</span>
            <span className="nav-label">Finance</span>
          </a>
        </li>
        {user?.role === 'Admin' && (
          <li className="nav-item">
            <a className={`nav-link ${isActive('/admin')}`} onClick={() => handleNav('/admin')}>
              <span className="nav-icon">⚙️</span>
              <span className="nav-label">Admin Panel</span>
            </a>
          </li>
        )}
      </ul>
    </nav>
  );
}
