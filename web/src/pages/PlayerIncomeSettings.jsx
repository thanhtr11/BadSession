import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { formatVND } from '../utils/format';

export default function PlayerIncomeSettings({ user }) {
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState(new Set());
  const [monthlyRate, setMonthlyRate] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const res = await apiClient.get('/users');
      // Filter to only show players (non-Admin role)
      const playerList = res.data.filter(u => u.role === 'Player');
      setPlayers(playerList);
    } catch (error) {
      console.error('Failed to fetch players:', error);
      showMessage('Failed to load players', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 4000);
  };

  const handlePlayerToggle = (playerId) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else {
      newSelected.add(playerId);
    }
    setSelectedPlayers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPlayers.size === players.length) {
      setSelectedPlayers(new Set());
    } else {
      setSelectedPlayers(new Set(players.map(p => p.id)));
    }
  };

  const handleApplyRate = async () => {
    if (!monthlyRate || !year || !month) {
      showMessage('Please fill in all fields', 'error');
      return;
    }

    if (selectedPlayers.size === 0) {
      showMessage('Please select at least one player', 'error');
      return;
    }

    setSaving(true);
    try {
      const selectedPlayerIds = Array.from(selectedPlayers);
      const res = await apiClient.post('/finance/apply-player-income', {
        player_ids: selectedPlayerIds,
        amount: parseFloat(monthlyRate),
        year: parseInt(year),
        month: parseInt(month)
      });

      showMessage(res.data.message || `Applied income rate to ${selectedPlayers.size} player(s)`, 'success');
      
      // Reset form
      setSelectedPlayers(new Set());
      setMonthlyRate('');
      setYear(new Date().getFullYear());
      setMonth(new Date().getMonth() + 1);
    } catch (error) {
      showMessage(
        error.response?.data?.error || 'Failed to apply income rate',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  // Generate year and month options
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    years.push(i);
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return <div className="loading">Loading players...</div>;
  }

  if (!user || user.role !== 'Admin') {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        borderRadius: '4px',
        border: '1px solid #f5c6cb'
      }}>
        ⛔ Access Denied: Only administrators can manage player income settings.
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>⚙️ Apply Monthly Income Rate to Specific Players</h2>
      
      {message && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          backgroundColor: messageType === 'success' ? '#d4edda' : '#f8d7da',
          color: messageType === 'success' ? '#155724' : '#721c24',
          borderRadius: '4px',
          border: `1px solid ${messageType === 'success' ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {messageType === 'success' ? '✓' : '⚠'} {message}
        </div>
      )}

      <div style={{
        backgroundColor: '#f9f9f9',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #e0e0e0'
      }}>
        <h3>📊 Income Settings</h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Monthly Rate (VND)
            </label>
            <input
              type="number"
              value={monthlyRate}
              onChange={(e) => setMonthlyRate(e.target.value)}
              placeholder="e.g., 150000"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              {monthNames.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: '#f9f9f9',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #e0e0e0'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <h3 style={{ margin: 0 }}>👥 Select Players ({selectedPlayers.size}/{players.length})</h3>
          <button
            onClick={handleSelectAll}
            style={{
              padding: '8px 15px',
              backgroundColor: selectedPlayers.size === players.length ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {selectedPlayers.size === players.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '10px'
        }}>
          {players.length === 0 ? (
            <p style={{ color: '#999', margin: '20px' }}>No players found</p>
          ) : (
            players.map(player => (
              <div
                key={player.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  backgroundColor: selectedPlayers.has(player.id) ? '#e7f3ff' : 'transparent',
                  transition: 'background-color 0.2s'
                }}
                onClick={() => handlePlayerToggle(player.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedPlayers.has(player.id)}
                  onChange={() => {}}
                  style={{
                    marginRight: '12px',
                    cursor: 'pointer',
                    width: '18px',
                    height: '18px'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>{player.full_name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>@{player.username}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <button
        onClick={handleApplyRate}
        disabled={saving || selectedPlayers.size === 0 || !monthlyRate}
        style={{
          width: '100%',
          padding: '12px',
          marginTop: '20px',
          backgroundColor: saving || selectedPlayers.size === 0 || !monthlyRate ? '#6c757d' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: saving || selectedPlayers.size === 0 || !monthlyRate ? 'not-allowed' : 'pointer',
          opacity: saving || selectedPlayers.size === 0 || !monthlyRate ? 0.6 : 1
        }}
      >
        {saving ? '⏳ Applying...' : `✓ Apply Income Rate to ${selectedPlayers.size} Player(s)`}
      </button>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#e7f3ff',
        borderRadius: '4px',
        border: '1px solid #b3d9ff'
      }}>
        <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>ℹ️ How it works:</p>
        <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '14px' }}>
          <li>Select one or more players from the list</li>
          <li>Enter the monthly income rate</li>
          <li>Choose the year and month</li>
          <li>Click "Apply Income Rate" to create income records</li>
          <li>Income records will appear as "⏳ Pending" in the Income tab</li>
        </ul>
      </div>
    </div>
  );
}
