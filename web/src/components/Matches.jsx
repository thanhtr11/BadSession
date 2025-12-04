import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import '../styles.css';

export default function Matches({ sessionId, sessionDetails, onClose }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [players, setPlayers] = useState([]);
  const [guests, setGuests] = useState([]);
  const [editingMatch, setEditingMatch] = useState(null);
  const [formData, setFormData] = useState({
    match_name: '',
    player1_id: '',
    player1_guest_name: '',
    player1_is_guest: false,
    player2_id: '',
    player2_guest_name: '',
    player2_is_guest: false,
    player1_score: 0,
    player2_score: 0,
    match_status: 'Pending'
  });

  useEffect(() => {
    fetchMatches();
    fetchPlayersAndGuests();
  }, [sessionId]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/matches/session/${sessionId}`);
      setMatches(res.data);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      alert('Failed to fetch matches: ' + error.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayersAndGuests = async () => {
    try {
      // Get all users (players)
      const usersRes = await apiClient.get('/users');
      setPlayers(usersRes.data);

      // Get guests from attendance
      if (sessionDetails?.attendance) {
        const guestList = sessionDetails.attendance
          .filter(a => a.is_guest)
          .map(a => ({ id: null, name: a.guest_name, is_guest: true }));
        setGuests(guestList);
      }
    } catch (error) {
      console.error('Failed to fetch players/guests:', error);
    }
  };

  const handleOpenModal = (match = null) => {
    if (match) {
      setEditingMatch(match);
      setFormData({
        match_name: match.match_name,
        player1_id: match.player1_id,
        player1_guest_name: match.player1_guest_name || '',
        player1_is_guest: match.player1_is_guest,
        player2_id: match.player2_id,
        player2_guest_name: match.player2_guest_name || '',
        player2_is_guest: match.player2_is_guest,
        player1_score: match.player1_score,
        player2_score: match.player2_score,
        match_status: match.match_status
      });
    } else {
      setEditingMatch(null);
      setFormData({
        match_name: '',
        player1_id: '',
        player1_guest_name: '',
        player1_is_guest: false,
        player2_id: '',
        player2_guest_name: '',
        player2_is_guest: false,
        player1_score: 0,
        player2_score: 0,
        match_status: 'Pending'
      });
    }
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.player1_id && !formData.player1_guest_name) {
      alert('Please select Player 1 (player or guest)');
      return;
    }
    if (!formData.player2_id && !formData.player2_guest_name) {
      alert('Please select Player 2 (player or guest)');
      return;
    }

    try {
      if (editingMatch) {
        // Update match
        await apiClient.put(`/matches/${editingMatch.id}`, {
          match_name: formData.match_name,
          player1_score: parseInt(formData.player1_score),
          player2_score: parseInt(formData.player2_score),
          match_status: formData.match_status
        });
        alert('Match updated successfully!');
      } else {
        // Create match
        await apiClient.post('/matches', {
          session_id: sessionId,
          ...formData,
          player1_score: parseInt(formData.player1_score),
          player2_score: parseInt(formData.player2_score)
        });
        alert('Match created successfully!');
      }
      setShowModal(false);
      fetchMatches();
    } catch (error) {
      console.error('Failed to save match:', error);
      alert('Failed to save match: ' + error.response?.data?.error);
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm('Are you sure you want to delete this match?')) return;

    try {
      await apiClient.delete(`/matches/${matchId}`);
      alert('Match deleted successfully!');
      fetchMatches();
    } catch (error) {
      console.error('Failed to delete match:', error);
      alert('Failed to delete match: ' + error.response?.data?.error);
    }
  };

  const getPlayerName = (playerId, isGuest, guestName) => {
    if (isGuest) return guestName;
    const player = players.find(p => p.id === playerId);
    return player ? player.full_name : 'Unknown';
  };

  if (loading) return <div className="loading">Loading Matches...</div>;

  return (
    <div className="matches-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>🏸 Matches</h2>
        <div>
          <button className="button btn-secondary" onClick={() => handleOpenModal()} style={{ marginRight: '10px' }}>
            ➕ Add Match
          </button>
          <button className="button btn-secondary" onClick={onClose}>
            ✕ Close
          </button>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="empty-state">
          <p>No matches created yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="matches-list">
          {matches.map(match => (
            <div key={match.id} className="match-card">
              <div className="match-header">
                <h3>{match.match_name}</h3>
                <span className={`badge badge-${match.match_status.toLowerCase()}`}>
                  {match.match_status}
                </span>
              </div>

              <div className="match-body">
                <div className="match-players">
                  <div className="player">
                    <div className="player-name">
                      {getPlayerName(match.player1_id, match.player1_is_guest, match.player1_guest_name)}
                      {match.player1_is_guest && <span className="guest-badge">Guest</span>}
                    </div>
                    <div className="player-score">{match.player1_score}</div>
                  </div>

                  <div className="vs">vs</div>

                  <div className="player">
                    <div className="player-name">
                      {getPlayerName(match.player2_id, match.player2_is_guest, match.player2_guest_name)}
                      {match.player2_is_guest && <span className="guest-badge">Guest</span>}
                    </div>
                    <div className="player-score">{match.player2_score}</div>
                  </div>
                </div>

                <div className="match-footer">
                  <small>Created by: {match.created_by_name}</small>
                  <div className="match-actions">
                    <button
                      className="button btn-small btn-primary"
                      onClick={() => handleOpenModal(match)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="button btn-small btn-danger"
                      onClick={() => handleDeleteMatch(match.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingMatch ? '✏️ Edit Match' : '➕ Create Match'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Match Name (Optional)</label>
                <input
                  type="text"
                  name="match_name"
                  value={formData.match_name}
                  onChange={handleInputChange}
                  placeholder="e.g., Final Match, Semi-Final"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Player 1 Type</label>
                  <select
                    value={formData.player1_is_guest ? 'guest' : 'player'}
                    onChange={(e) => {
                      const isGuest = e.target.value === 'guest';
                      setFormData(prev => ({
                        ...prev,
                        player1_is_guest: isGuest,
                        player1_id: '',
                        player1_guest_name: ''
                      }));
                    }}
                  >
                    <option value="player">Player</option>
                    <option value="guest">Guest</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    {formData.player1_is_guest ? 'Guest Name' : 'Select Player'}
                  </label>
                  {formData.player1_is_guest ? (
                    <input
                      type="text"
                      value={formData.player1_guest_name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        player1_guest_name: e.target.value
                      }))}
                      placeholder="Enter guest name"
                    />
                  ) : (
                    <select
                      value={formData.player1_id}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        player1_id: e.target.value
                      }))}
                    >
                      <option value="">-- Select Player --</option>
                      {players.map(player => (
                        <option key={player.id} value={player.id}>
                          {player.full_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label>Player 1 Score</label>
                  <input
                    type="number"
                    name="player1_score"
                    value={formData.player1_score}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Player 2 Type</label>
                  <select
                    value={formData.player2_is_guest ? 'guest' : 'player'}
                    onChange={(e) => {
                      const isGuest = e.target.value === 'guest';
                      setFormData(prev => ({
                        ...prev,
                        player2_is_guest: isGuest,
                        player2_id: '',
                        player2_guest_name: ''
                      }));
                    }}
                  >
                    <option value="player">Player</option>
                    <option value="guest">Guest</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    {formData.player2_is_guest ? 'Guest Name' : 'Select Player'}
                  </label>
                  {formData.player2_is_guest ? (
                    <input
                      type="text"
                      value={formData.player2_guest_name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        player2_guest_name: e.target.value
                      }))}
                      placeholder="Enter guest name"
                    />
                  ) : (
                    <select
                      value={formData.player2_id}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        player2_id: e.target.value
                      }))}
                    >
                      <option value="">-- Select Player --</option>
                      {players.map(player => (
                        <option key={player.id} value={player.id}>
                          {player.full_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label>Player 2 Score</label>
                  <input
                    type="number"
                    name="player2_score"
                    value={formData.player2_score}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Match Status</label>
                <select
                  name="match_status"
                  value={formData.match_status}
                  onChange={handleInputChange}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="button btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="button btn-primary">
                  {editingMatch ? 'Update Match' : 'Create Match'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
