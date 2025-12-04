import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { formatVND } from '../utils/format';

export default function FinanceSetting({ user }) {
  const [guestDailyRate, setGuestDailyRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingGuest, setSavingGuest] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get('/finance/settings');
      if (res.data) {
        setGuestDailyRate(res.data.guest_daily_rate || 0);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setMessage('Failed to load settings');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSaveGuestRate = async (e) => {
    e.preventDefault();
    if (user?.role !== 'Admin') {
      showMessage('Only admins can change settings', 'error');
      return;
    }

    setSavingGuest(true);
    try {
      await apiClient.post('/finance/settings', {
        guest_daily_rate: parseFloat(guestDailyRate),
        player_monthly_rate: 0,
        player_monthly_year: null,
        player_monthly_month: null
      });
      showMessage('✓ Guest Daily Rate saved successfully!', 'success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showMessage('Failed to save guest rate', 'error');
    } finally {
      setSavingGuest(false);
    }
  };

  const canEdit = user?.role === 'Admin';

  if (loading) {
    return <div className="loading">Loading Settings...</div>;
  }

  if (!canEdit) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        borderRadius: '4px',
        border: '1px solid #f5c6cb'
      }}>
        ⛔ Access Denied: Only administrators can access finance settings.
      </div>
    );
  }

  return (
    <div>
      <h2 className="section-title">⚙️ Guest Income Settings</h2>

      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        {message && (
          <div
            style={{
              padding: '15px',
              marginBottom: '20px',
              borderRadius: '4px',
              backgroundColor: messageType === 'success' ? '#d4edda' : '#f8d7da',
              color: messageType === 'success' ? '#155724' : '#721c24',
              border: `1px solid ${messageType === 'success' ? '#c3e6cb' : '#f5c6cb'}`
            }}
          >
            {message}
          </div>
        )}

        {/* Guest Daily Income Rate Section */}
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '25px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold', color: '#2c3e50' }}>
            🧑 Guest Daily Income Rate
          </h3>
          <p style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '15px' }}>
            Default income amount charged per guest per day. This amount is automatically recorded when guests check in.
          </p>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '8px' }}>
              Amount (VND)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold', minWidth: '160px', color: '#e74c3c' }}>
                {formatVND(guestDailyRate)}
              </span>
              <input
                type="number"
                step="1000"
                min="0"
                className="form-input"
                value={guestDailyRate}
                onChange={(e) => setGuestDailyRate(e.target.value)}
                placeholder="Enter amount in VND"
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <button
            onClick={handleSaveGuestRate}
            disabled={savingGuest}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: savingGuest ? '#95a5a6' : '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: savingGuest ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s'
            }}
            onMouseEnter={(e) => !savingGuest && (e.target.style.backgroundColor = '#c0392b')}
            onMouseLeave={(e) => !savingGuest && (e.target.style.backgroundColor = '#e74c3c')}
          >
            {savingGuest ? '💾 Saving...' : '💾 Save Guest Rate'}
          </button>
        </div>

        {/* Info Box */}
        <div
          style={{
            backgroundColor: '#e7f3ff',
            border: '1px solid #b3d9ff',
            borderRadius: '4px',
            padding: '15px',
            marginBottom: '20px',
            fontSize: '13px',
            color: '#004085'
          }}
        >
          <strong>ℹ️ Info:</strong>
          <ul style={{ margin: '8px 0 0 20px', paddingLeft: '10px' }}>
            <li>Guest Daily Rate: Applied automatically when guests check in</li>
            <li>Player monthly rates are now configured in the "Player Income" tab</li>
            <li>Changes are saved immediately when you click the save button</li>
            <li>All rates are in Vietnamese Dong (VND)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
