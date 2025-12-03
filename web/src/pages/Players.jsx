import React, { useState, useEffect } from 'react';
import apiClient from '../api';

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [playerDetails, setPlayerDetails] = useState({
    attendance: [],
    donations: [],
    total_donations: 0
  });

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await apiClient.get('/users', {
      setPlayers(res.data.filter(u => u.role === 'Player'));
    } catch (error) {
      console.error('Failed to fetch players:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPlayer = async (player) => {
    setSelectedPlayer(player);
    try {
      const token = localStorage.getItem('token');
      const [attendanceRes, donationsRes] = await Promise.all([
        apiClient.get(`/api/attendance/player/${player.id}/history`, {
        apiClient.get('/finance/donations', {
      ]);

      const playerDonations = donationsRes.data.filter(d => d.contributor_id === player.id && !d.is_guest);
      const totalDonated = playerDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0);

      setPlayerDetails({
        attendance: attendanceRes.data,
        donations: playerDonations,
        total_donations: totalDonated
      });
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Failed to fetch player details:', error);
    }
  };

  if (loading) return <div className="loading">Loading Players...</div>;

  return (
    <div>
      <h1 className="page-title">👥 Players</h1>

      <div className="section">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {players.map(player => (
                <tr key={player.id}>
                  <td>{player.full_name}</td>
                  <td>{player.username}</td>
                  <td>{new Date(player.created_at).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="button btn-primary btn-small"
                      onClick={() => handleViewPlayer(player)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Player Details Modal */}
      {showDetailsModal && selectedPlayer && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">{selectedPlayer.full_name}</div>
            
            <div className="modal-body">
              <div style={{ marginBottom: '20px', padding: '15px', background: '#f5f7fa', borderRadius: '8px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Username:</strong> {selectedPlayer.username}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Total Donations:</strong> ${playerDetails.total_donations.toFixed(2)}
                </div>
                <div>
                  <strong>Sessions Attended:</strong> {playerDetails.attendance.length}
                </div>
              </div>

              <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>📋 Attendance History</h3>
              {playerDetails.attendance.length > 0 ? (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playerDetails.attendance.map(record => (
                        <tr key={record.id}>
                          <td>{new Date(record.session_date).toLocaleDateString()}</td>
                          <td>{record.session_time}</td>
                          <td>{record.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No attendance records</p>
              )}

              <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>💸 Donation History</h3>
              {playerDetails.donations.length > 0 ? (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playerDetails.donations.map(donation => (
                        <tr key={donation.id}>
                          <td>${donation.amount.toFixed(2)}</td>
                          <td>{new Date(donation.donated_at).toLocaleDateString()}</td>
                          <td>{donation.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No donations</p>
              )}
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="button btn-secondary" 
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
