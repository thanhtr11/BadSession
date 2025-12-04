import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
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

  return (
    <nav className="navbar">
      <button
        className="hamburger"
        aria-label="Toggle navigation"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        ☰
      </button>

      <div className="navbar-header">
        <div className="navbar-title">🏸 BadSession</div>
        <div className="navbar-subtitle">Team Management</div>
      </div>

      <div className="user-info">
        <div className="user-name">{user?.full_name}</div>
        <div className="user-role">{user?.role}</div>
      </div>

      <ul className={`nav-menu ${menuOpen ? 'open' : ''}`}>
        <li className="nav-item">
          <a className={`nav-link ${isActive('/')}`} onClick={() => handleNav('/')}>📊 Dashboard</a>
        </li>
        <li className="nav-item">
          <a className={`nav-link ${isActive('/sessions')}`} onClick={() => handleNav('/sessions')}>📅 Sessions</a>
        </li>
        <li className="nav-item">
          <a className={`nav-link ${isActive('/players')}`} onClick={() => handleNav('/players')}>👥 Players</a>
        </li>
        <li className="nav-item">
          <a className={`nav-link ${isActive('/guests')}`} onClick={() => handleNav('/guests')}>👤 Guests</a>
        </li>
        <li className="nav-item">
          <a className={`nav-link ${isActive('/finance')}`} onClick={() => handleNav('/finance')}>💰 Finance</a>
        </li>
        {user?.role === 'Admin' && (
          <li className="nav-item">
            <a className={`nav-link ${isActive('/admin')}`} onClick={() => handleNav('/admin')}>⚙️ Admin Panel</a>
          </li>
        )}
      </ul>

      <button className="logout-btn" onClick={() => { handleLogout(); setMenuOpen(false); }}>🚪 Logout</button>
    </nav>
  );
}
