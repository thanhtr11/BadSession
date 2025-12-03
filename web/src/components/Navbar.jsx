import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-header">
        <div className="navbar-title">🏸 BadSession</div>
        <div className="navbar-subtitle">Team Management</div>
      </div>

      <div className="user-info">
        <div className="user-name">{user?.full_name}</div>
        <div className="user-role">{user?.role}</div>
      </div>

      <ul className="nav-menu">
        <li className="nav-item">
          <a href="/" className={`nav-link ${isActive('/')}`} onClick={() => navigate('/')}>
            📊 Dashboard
          </a>
        </li>
        <li className="nav-item">
          <a href="/sessions" className={`nav-link ${isActive('/sessions')}`} onClick={() => navigate('/sessions')}>
            📅 Sessions
          </a>
        </li>
        <li className="nav-item">
          <a href="/players" className={`nav-link ${isActive('/players')}`} onClick={() => navigate('/players')}>
            👥 Players
          </a>
        </li>
        <li className="nav-item">
          <a href="/guests" className={`nav-link ${isActive('/guests')}`} onClick={() => navigate('/guests')}>
            👤 Guests
          </a>
        </li>
        <li className="nav-item">
          <a href="/finance" className={`nav-link ${isActive('/finance')}`} onClick={() => navigate('/finance')}>
            💰 Finance
          </a>
        </li>
        {user?.role === 'Admin' && (
          <li className="nav-item">
            <a href="/admin" className={`nav-link ${isActive('/admin')}`} onClick={() => navigate('/admin')}>
              ⚙️ Admin Panel
            </a>
          </li>
        )}
      </ul>

      <button className="logout-btn" onClick={handleLogout}>
        🚪 Logout
      </button>
    </nav>
  );
}
