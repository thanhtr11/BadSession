import React, { useState } from 'react';
import apiClient from '../api';

export default function AdminSystemSettings({ users, onUserUpdated }) {
  const [subTab, setSubTab] = useState('player-guest');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [convertLoading, setConvertLoading] = useState(false);
  const [selectedUserToConvert, setSelectedUserToConvert] = useState(null);
  const [conversionType, setConversionType] = useState('player-to-guest'); // or 'guest-to-player'

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleConvertUser = async () => {
    if (!selectedUserToConvert) {
      showMessage('Please select a user', 'error');
      return;
    }

    setConvertLoading(true);
    try {
      const newRole = conversionType === 'player-to-guest' ? 'Guest' : 'Player';
      const endpoint = conversionType === 'player-to-guest' ? 'player-to-guest' : 'guest-to-player';

      await apiClient.post(
        `/users/${selectedUserToConvert.id}/${endpoint}`
      );

      showMessage(
        `${selectedUserToConvert.full_name} converted from ${selectedUserToConvert.role} to ${newRole}`,
        'success'
      );
      
      setSelectedUserToConvert(null);
      onUserUpdated();
    } catch (error) {
      showMessage(
        'Failed to convert user: ' + (error.response?.data?.error || error.message),
        'error'
      );
    } finally {
      setConvertLoading(false);
    }
  };

  const playerUsers = users.filter(u => u.role === 'Player');
  const guestUsers = users.filter(u => u.role === 'Guest');

  return (
    <div>
      {/* Sub-tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        borderBottom: '2px solid #ecf0f1',
        paddingBottom: '10px'
      }}>
        <button
          onClick={() => setSubTab('player-guest')}
          style={{
            padding: '8px 16px',
            background: subTab === 'player-guest' ? '#16a085' : '#ecf0f1',
            color: subTab === 'player-guest' ? 'white' : '#2c3e50',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: subTab === 'player-guest' ? 'bold' : 'normal',
            fontSize: '14px',
            transition: 'all 0.3s ease'
          }}
        >
          🔄 Convert Player/Guest
        </button>
        <button
          onClick={() => setSubTab('reservations')}
          style={{
            padding: '8px 16px',
            background: subTab === 'reservations' ? '#16a085' : '#ecf0f1',
            color: subTab === 'reservations' ? 'white' : '#2c3e50',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: subTab === 'reservations' ? 'bold' : 'normal',
            fontSize: '14px',
            transition: 'all 0.3s ease'
          }}
        >
          📋 Reservation Settings
        </button>
      </div>

      {/* Message Alert */}
      {message && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '20px',
          borderRadius: '4px',
          background: messageType === 'success' ? '#d4edda' : '#f8d7da',
          color: messageType === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${messageType === 'success' ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {messageType === 'success' ? '✓' : '✕'} {message}
        </div>
      )}

      {/* Player/Guest Conversion Tab */}
      {subTab === 'player-guest' && (
        <div className="section">
          <h2 className="section-title">🔄 Convert Player to Guest or Vice Versa</h2>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
              Conversion Type:
            </label>
            <div style={{ display: 'flex', gap: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="conversionType"
                  value="player-to-guest"
                  checked={conversionType === 'player-to-guest'}
                  onChange={(e) => setConversionType(e.target.value)}
                  style={{ marginRight: '8px', cursor: 'pointer' }}
                />
                👥 Convert Player to Guest
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="conversionType"
                  value="guest-to-player"
                  checked={conversionType === 'guest-to-player'}
                  onChange={(e) => setConversionType(e.target.value)}
                  style={{ marginRight: '8px', cursor: 'pointer' }}
                />
                👤 Convert Guest to Player
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
              Select User:
            </label>
            <select
              value={selectedUserToConvert?.id || ''}
              onChange={(e) => {
                const user = users.find(u => u.id === parseInt(e.target.value));
                setSelectedUserToConvert(user);
              }}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #bdc3c7',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="">-- Select a user --</option>
              {(conversionType === 'player-to-guest' ? playerUsers : guestUsers).map(user => (
                <option key={user.id} value={user.id}>
                  {user.full_name} ({user.username}) - {user.role}
                </option>
              ))}
            </select>
            {(conversionType === 'player-to-guest' ? playerUsers : guestUsers).length === 0 && (
              <p style={{ color: '#7f8c8d', fontSize: '12px', marginTop: '8px' }}>
                No {conversionType === 'player-to-guest' ? 'players' : 'guests'} available to convert.
              </p>
            )}
          </div>

          {selectedUserToConvert && (
            <div style={{
              padding: '15px',
              background: '#ecf0f1',
              borderRadius: '4px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: '0 0 10px 0' }}>
                <strong>Current User:</strong> {selectedUserToConvert.full_name}
              </p>
              <p style={{ margin: '0 0 10px 0' }}>
                <strong>Current Role:</strong> {selectedUserToConvert.role}
              </p>
              <p style={{ margin: '0', color: '#7f8c8d', fontSize: '12px' }}>
                This user will be converted to: <strong>{conversionType === 'player-to-guest' ? 'Guest' : 'Player'}</strong>
              </p>
            </div>
          )}

          <button
            onClick={handleConvertUser}
            disabled={!selectedUserToConvert || convertLoading}
            style={{
              padding: '10px 20px',
              background: selectedUserToConvert ? '#16a085' : '#bdc3c7',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedUserToConvert ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              fontSize: '14px',
              opacity: selectedUserToConvert ? 1 : 0.6,
              transition: 'all 0.3s ease'
            }}
          >
            {convertLoading ? '⏳ Converting...' : '🔄 Convert User'}
          </button>
        </div>
      )}

      {/* Reservation Settings Tab */}
      {subTab === 'reservations' && (
        <div className="section">
          <h2 className="section-title">📋 Reservation Settings</h2>
          
          <div style={{
            padding: '20px',
            background: '#ecf0f1',
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '16px', color: '#7f8c8d', marginBottom: '10px' }}>
              🚧 Reservation settings coming soon!
            </p>
            <p style={{ fontSize: '12px', color: '#95a5a6' }}>
              This feature will allow you to:
            </p>
            <ul style={{
              textAlign: 'left',
              display: 'inline-block',
              color: '#7f8c8d',
              fontSize: '12px'
            }}>
              <li>✓ Enable/disable court reservations</li>
              <li>✓ Set reservation duration rules</li>
              <li>✓ Configure cancellation policies</li>
              <li>✓ Manage reservation limits</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
