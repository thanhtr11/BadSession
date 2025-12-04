import React, { useState, useEffect } from 'react';
import apiClient from '../api';

export default function MatchManager({ sessionId, sessionDetails }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [matchType, setMatchType] = useState('Singles');
  const [editingMatch, setEditingMatch] = useState(null);
  const [editingScore, setEditingScore] = useState(null);
  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);

  useEffect(() => {
    if (sessionId) {
      fetchMatches();
    }
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

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/matches', {
        session_id: sessionId,
        match_type: matchType
      });
      setShowCreateMatch(false);
      setMatchType('Singles');
      fetchMatches();
      alert('Match created successfully!');
    } catch (error) {
      console.error('Failed to create match:', error);
      alert('Failed to create match: ' + error.response?.data?.error);
    }
  };

  const handleAddPlayer = async (matchId, playerData) => {
    try {
      await apiClient.post(`/matches/${matchId}/player`, playerData);
      fetchMatches();
      alert('Player added to match successfully!');
    } catch (error) {
      console.error('Failed to add player:', error);
      alert('Failed to add player: ' + error.response?.data?.error);
    }
  };

  const handleRemovePlayer = async (playerId) => {
    if (!window.confirm('Remove this player from the match?')) return;
    try {
      await apiClient.delete(`/matches/player/${playerId}`);
      fetchMatches();
      alert('Player removed successfully!');
    } catch (error) {
      console.error('Failed to remove player:', error);
      alert('Failed to remove player: ' + error.response?.data?.error);
    }
  };

  const handleUpdateScore = async (matchId) => {
    try {
      await apiClient.put(`/matches/${matchId}/result`, {
        team_a_score: teamAScore,
        team_b_score: teamBScore,
        status: 'Completed'
      });
      setEditingScore(null);
      setEditingMatch(null);
      setTeamAScore(0);
      setTeamBScore(0);
      fetchMatches();
      alert('Match score updated successfully!');
    } catch (error) {
      console.error('Failed to update score:', error);
      alert('Failed to update score: ' + error.response?.data?.error);
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm('Delete this match?')) return;
    try {
      await apiClient.delete(`/matches/${matchId}`);
      fetchMatches();
      alert('Match deleted successfully!');
    } catch (error) {
      console.error('Failed to delete match:', error);
      alert('Failed to delete match: ' + error.response?.data?.error);
    }
  };

  const getAttendanceList = () => {
    if (!sessionDetails || !sessionDetails.attendance) {
      return [];
    }
    return sessionDetails.attendance;
  };

  if (loading) {
    return <div className="loading">Loading Matches...</div>;
  }

  return (
    <div className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>🏸 Matches</h3>
        <button 
          className="button btn-primary" 
          onClick={() => setShowCreateMatch(!showCreateMatch)}
        >
          {showCreateMatch ? '✕ Cancel' : '➕ Create Match'}
        </button>
      </div>

      {showCreateMatch && (
        <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
          <h4>Create New Match</h4>
          <form onSubmit={handleCreateMatch} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select 
              value={matchType} 
              onChange={(e) => setMatchType(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="Singles">Singles</option>
              <option value="Doubles">Doubles</option>
              <option value="Mixed Doubles">Mixed Doubles</option>
            </select>
            <button type="submit" className="button btn-primary">Create Match</button>
          </form>
        </div>
      )}

      {matches.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          No matches yet. Create one to get started!
        </div>
      ) : (
        <div className="matches-container">
          {matches.map((match) => (
            <div key={match.id} className="card match-card" style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                <div>
                  <h4>Match #{match.match_number} - {match.match_type}</h4>
                  <p style={{ color: '#666', fontSize: '0.9em' }}>
                    Status: <span style={{ fontWeight: 'bold', color: getStatusColor(match.status) }}>
                      {match.status}
                    </span>
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {match.status === 'Pending' && (
                    <button 
                      className="button btn-secondary"
                      onClick={() => {
                        setEditingMatch(match.id);
                        setEditingScore(match.id);
                        setTeamAScore(match.team_a_score || 0);
                        setTeamBScore(match.team_b_score || 0);
                      }}
                    >
                      📝 Set Score
                    </button>
                  )}
                  {match.status === 'Completed' && (
                    <button 
                      className="button btn-secondary"
                      onClick={() => {
                        setEditingMatch(match.id);
                        setEditingScore(match.id);
                        setTeamAScore(match.team_a_score || 0);
                        setTeamBScore(match.team_b_score || 0);
                      }}
                    >
                      ✏️ Edit Score
                    </button>
                  )}
                  <button 
                    className="button btn-danger"
                    onClick={() => handleDeleteMatch(match.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              {/* Score Display */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-around', 
                alignItems: 'center', 
                padding: '15px',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px',
                marginBottom: '15px',
                fontSize: '1.2em',
                fontWeight: 'bold'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div>Team A</div>
                  <div style={{ fontSize: '1.8em', color: '#333' }}>{match.team_a_score || 0}</div>
                </div>
                <div style={{ color: '#999' }}>vs</div>
                <div style={{ textAlign: 'center' }}>
                  <div>Team B</div>
                  <div style={{ fontSize: '1.8em', color: '#333' }}>{match.team_b_score || 0}</div>
                </div>
              </div>

              {/* Edit Score Form */}
              {editingScore === match.id && (
                <div style={{ 
                  padding: '15px', 
                  backgroundColor: '#fffacd', 
                  borderRadius: '4px',
                  marginBottom: '15px',
                  border: '2px solid #ffd700'
                }}>
                  <h5>Update Score</h5>
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                    <div>
                      <label>Team A Score:</label>
                      <input 
                        type="number" 
                        min="0" 
                        value={teamAScore}
                        onChange={(e) => setTeamAScore(parseInt(e.target.value) || 0)}
                        style={{ padding: '8px', marginTop: '5px', width: '100px' }}
                      />
                    </div>
                    <div>
                      <label>Team B Score:</label>
                      <input 
                        type="number" 
                        min="0" 
                        value={teamBScore}
                        onChange={(e) => setTeamBScore(parseInt(e.target.value) || 0)}
                        style={{ padding: '8px', marginTop: '5px', width: '100px' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      className="button btn-primary"
                      onClick={() => handleUpdateScore(match.id)}
                    >
                      Save Score
                    </button>
                    <button 
                      className="button btn-secondary"
                      onClick={() => {
                        setEditingScore(null);
                        setEditingMatch(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Players Section */}
              <div>
                <h5>Players</h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  {/* Team A */}
                  <div style={{ padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
                    <h6 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>Team A</h6>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {match.players
                        .filter(p => p.team === 'Team A')
                        .map(player => (
                          <div key={player.id} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px',
                            backgroundColor: '#fff',
                            borderRadius: '3px',
                            border: '1px solid #bbdefb'
                          }}>
                            <span>{player.name}</span>
                            <button 
                              className="button btn-small btn-danger"
                              onClick={() => handleRemovePlayer(player.id)}
                              style={{ padding: '3px 8px', fontSize: '0.8em' }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                    </div>
                    <PlayerSelector 
                      matchId={match.id} 
                      team="Team A"
                      maxPlayers={match.match_type === 'Doubles' || match.match_type === 'Mixed Doubles' ? 2 : 1}
                      currentPlayers={match.players.filter(p => p.team === 'Team A').length}
                      attendanceList={getAttendanceList()}
                      onAddPlayer={handleAddPlayer}
                    />
                  </div>

                  {/* Team B */}
                  <div style={{ padding: '10px', backgroundColor: '#f3e5f5', borderRadius: '4px' }}>
                    <h6 style={{ margin: '0 0 10px 0', color: '#c2185b' }}>Team B</h6>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {match.players
                        .filter(p => p.team === 'Team B')
                        .map(player => (
                          <div key={player.id} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px',
                            backgroundColor: '#fff',
                            borderRadius: '3px',
                            border: '1px solid #f8bbd0'
                          }}>
                            <span>{player.name}</span>
                            <button 
                              className="button btn-small btn-danger"
                              onClick={() => handleRemovePlayer(player.id)}
                              style={{ padding: '3px 8px', fontSize: '0.8em' }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                    </div>
                    <PlayerSelector 
                      matchId={match.id} 
                      team="Team B"
                      maxPlayers={match.match_type === 'Doubles' || match.match_type === 'Mixed Doubles' ? 2 : 1}
                      currentPlayers={match.players.filter(p => p.team === 'Team B').length}
                      attendanceList={getAttendanceList()}
                      onAddPlayer={handleAddPlayer}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Player Selector Component
function PlayerSelector({ matchId, team, maxPlayers, currentPlayers, attendanceList, onAddPlayer }) {
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [playerType, setPlayerType] = useState('registered');

  const handleAddClick = () => {
    if (!selectedPlayer) {
      alert('Please select a player');
      return;
    }

    if (playerType === 'registered') {
      const player = attendanceList.find(p => !p.is_guest && p.id === parseInt(selectedPlayer));
      if (player) {
        onAddPlayer(matchId, {
          user_id: player.user_id,
          team: team,
          is_guest: false
        });
      }
    } else {
      const player = attendanceList.find(p => p.is_guest && p.id === parseInt(selectedPlayer));
      if (player) {
        onAddPlayer(matchId, {
          guest_name: player.guest_name,
          team: team,
          is_guest: true
        });
      }
    }

    setSelectedPlayer('');
  };

  if (currentPlayers >= maxPlayers) {
    return null;
  }

  const registeredPlayers = attendanceList.filter(p => !p.is_guest);
  const guestPlayers = attendanceList.filter(p => p.is_guest);

  return (
    <div style={{ marginTop: '10px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '3px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <select 
          value={playerType}
          onChange={(e) => {
            setPlayerType(e.target.value);
            setSelectedPlayer('');
          }}
          style={{ padding: '6px', borderRadius: '3px', border: '1px solid #ddd', flex: 1 }}
        >
          <option value="registered">Registered Players</option>
          <option value="guest">Guests</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <select 
          value={selectedPlayer}
          onChange={(e) => setSelectedPlayer(e.target.value)}
          style={{ padding: '6px', borderRadius: '3px', border: '1px solid #ddd', flex: 1 }}
        >
          <option value="">Select {playerType === 'registered' ? 'Player' : 'Guest'}</option>
          {playerType === 'registered' ? (
            registeredPlayers.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))
          ) : (
            guestPlayers.map(p => (
              <option key={p.id} value={p.id}>{p.guest_name}</option>
            ))
          )}
        </select>
        <button 
          className="button btn-primary"
          onClick={handleAddClick}
          style={{ padding: '6px 12px', fontSize: '0.9em' }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

// Helper function to get status color
function getStatusColor(status) {
  switch (status) {
    case 'Pending':
      return '#ff9800';
    case 'In Progress':
      return '#2196f3';
    case 'Completed':
      return '#4caf50';
    default:
      return '#999';
  }
}
