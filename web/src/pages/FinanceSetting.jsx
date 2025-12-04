import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { formatVND } from '../utils/format';

export default function FinanceSetting({ user }) {
  const [playerMonthlyRate, setPlayerMonthlyRate] = useState(0);
  const [guestDailyRate, setGuestDailyRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get('/finance/settings');
      if (res.data) {
        setPlayerMonthlyRate(res.data.player_monthly_rate || 0);
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

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (user?.role !== 'Admin') {
      setMessage('Only admins can change settings');
      setMessageType('error');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/finance/settings', {
        player_monthly_rate: parseFloat(playerMonthlyRate),
        guest_daily_rate: parseFloat(guestDailyRate)
      });
      setMessage('✓ Settings saved successfully!');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage('Failed to save settings');
      setMessageType('error');
    } finally {
      setSaving(false);
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
      <h2 className="section-title">⚙️ Finance Settings</h2>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
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

        <form onSubmit={handleSaveSettings}>
          {/* Player Monthly Rate */}
          <div className="form-group" style={{ marginBottom: '25px' }}>
            <label className="form-label" style={{ fontSize: '16px', fontWeight: 'bold' }}>
              👤 Player Monthly Income Rate
            </label>
            <p style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '10px' }}>
              Default income amount charged per player per month
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold', minWidth: '150px' }}>
                {formatVND(playerMonthlyRate)}
              </span>
              <input
                type="number"
                step="1000"
                min="0"
                className="form-input"
                value={playerMonthlyRate}
                onChange={(e) => setPlayerMonthlyRate(e.target.value)}
                disabled={!canEdit}
                style={{ flex: 1 }}
                placeholder="Enter amount in VND"
              />
              <span style={{ fontSize: '12px', color: '#7f8c8d' }}>VND</span>
            </div>
          </div>

          {/* Guest Daily Rate */}
          <div className="form-group" style={{ marginBottom: '30px' }}>
            <label className="form-label" style={{ fontSize: '16px', fontWeight: 'bold' }}>
              🧑 Guest Daily Income Rate
            </label>
            <p style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '10px' }}>
              Default income amount charged per guest per day
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold', minWidth: '150px' }}>
                {formatVND(guestDailyRate)}
              </span>
              <input
                type="number"
                step="1000"
                min="0"
                className="form-input"
                value={guestDailyRate}
                onChange={(e) => setGuestDailyRate(e.target.value)}
                disabled={!canEdit}
                style={{ flex: 1 }}
                placeholder="Enter amount in VND"
              />
              <span style={{ fontSize: '12px', color: '#7f8c8d' }}>VND</span>
            </div>
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
              <li>Player Monthly Rate: Charged once per month per player</li>
              <li>Guest Daily Rate: Charged per day per guest attendance</li>
              <li>These are default rates used for income calculations</li>
            </ul>
          </div>

          {/* Save Button */}
          {canEdit ? (
            <button
              type="submit"
              className="button btn-success"
              disabled={saving}
              style={{ width: '100%', padding: '12px', fontSize: '16px', fontWeight: 'bold' }}
            >
              {saving ? '💾 Saving...' : '💾 Save Settings'}
            </button>
          ) : (
            <div
              style={{
                padding: '12px',
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                color: '#7f8c8d'
              }}
            >
              Only admins can modify settings
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
