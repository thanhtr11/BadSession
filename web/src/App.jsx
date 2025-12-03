import React, { useState, useEffect } from 'react';
import './styles.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sessions from './pages/Sessions';
import Players from './pages/Players';
import Guests from './pages/Guests';
import Finance from './pages/Finance';
import AdminPanel from './pages/AdminPanel';
import Navbar from './components/Navbar';

function App() {
  // Version: 2025-12-03-v2
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('App mounted, checking authentication');
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      // Only try to parse if userData is not null and not the string 'undefined'
      if (token && userData && userData !== 'undefined' && userData.trim().length > 0) {
        try {
          const parsedUser = JSON.parse(userData);
          setIsAuthenticated(true);
          setUser(parsedUser);
        } catch (parseError) {
          console.error('Failed to parse user data:', parseError);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } else {
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    setLoading(false);
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f7fa',
        fontSize: '24px',
        fontFamily: 'Arial, sans-serif',
        color: '#2c3e50'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Router>
      {isAuthenticated ? (
        <div className="app-container">
          <Navbar user={user} onLogout={handleLogout} />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/players" element={<Players />} />
              <Route path="/guests" element={<Guests />} />
              <Route path="/finance" element={<Finance user={user} />} />
              {user?.role === 'Admin' && (
                <Route path="/admin" element={<AdminPanel />} />
              )}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
