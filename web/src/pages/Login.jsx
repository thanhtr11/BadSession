import React, { useState } from 'react';
import apiClient from '../api';
import { useNavigate } from 'react-router-dom';

export default function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        await apiClient.post('/auth/register', formData);
        // Auto-login after registration
        const loginRes = await apiClient.post('/auth/login', {
          username: formData.username,
          password: formData.password
        });
        onLogin(loginRes.data.token, loginRes.data.user);
        navigate('/');
      } else {
        const res = await apiClient.post('/auth/login', {
          username: formData.username,
          password: formData.password
        });
        onLogin(res.data.token, res.data.user);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <h2 className="form-title">🏸 BadSession</h2>
        
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="full_name"
                className="form-input"
                placeholder="Enter your full name"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              name="username"
              className="form-input"
              placeholder="Enter username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="form-button" disabled={loading}>
            {loading ? 'Processing...' : isRegister ? 'Register' : 'Login'}
          </button>
        </form>

        <div className="form-link">
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <a onClick={() => {
            setIsRegister(!isRegister);
            setError('');
            setFormData({ username: '', password: '', full_name: '' });
          }}>
            {isRegister ? 'Login' : 'Register'}
          </a>
        </div>

        {!isRegister && (
          <div className="form-link" style={{ marginTop: '20px', fontSize: '12px', color: '#7f8c8d' }}>
            Demo Credentials:<br/>
            Username: <strong>Admin</strong><br/>
            Password: <strong>Admin</strong>
          </div>
        )}
      </div>
    </div>
  );
}
