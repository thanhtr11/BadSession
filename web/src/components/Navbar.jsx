import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => (location.pathname === path ? 'active' : '');

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

      <button
        className="sidebar-toggle"
        aria-label="Toggle sidebar"
        onClick={toggleSidebar}
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? '→' : '←'}
      </button>

      <div className="navbar-header">
        <div className="navbar-title">🏸 BadSession</div>
        <div className="navbar-subtitle">Team Management</div>
      </div>

      <div className="user-info">
        <div className="user-name">{user?.full_name}</div>
        <div className="user-role">{user?.role}</div>
      </div>

  {menuOpen && <div className="mobile-backdrop show" onClick={() => setMenuOpen(false)} />}

  <ul className={`nav-menu ${menuOpen ? 'open' : ''}`}>
        <li className="nav-item">
          <a className={`nav-link ${isActive('/')}`} onClick={() => handleNav('/')}>
            <span className="nav-icon">📊</span>
            <span className="nav-label">Dashboard</span>
          </a>
        </li>
        <li className="nav-item">
          <a className={`nav-link ${isActive('/sessions')}`} onClick={() => handleNav('/sessions')}>
            <span className="nav-icon">📅</span>
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
  <button className="logout-btn" onClick={() => { handleLogout(); setMenuOpen(false); }}>
    <span className="logout-icon">🚪</span>
    <span className="logout-label">Logout</span>
  </button>
    </nav>
  );
}
