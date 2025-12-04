import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api';
import { formatVND } from '../utils/format';

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Player modal states
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [playerDetails, setPlayerDetails] = useState({
    attendance: [],
    donations: [],
    total_donations: 0
  });

  // Guest modal states
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestDetails, setGuestDetails] = useState({ donations: [], sessions: [] });
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Player list for modal
  const [players, setPlayers] = useState([]);
  // Guest list for modal
  const [guests, setGuests] = useState([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await apiClient.get('/dashboard');
      setDashboard(res.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerClick = async () => {
    try {
      const res = await apiClient.get('/users');
      const players = res.data.filter(u => u.role === 'Player');
      setPlayers(players);
      setShowPlayerModal(true);
    } catch (error) {
      console.error('Failed to fetch players:', error);
    }
  };

  const handleGuestClick = async () => {
    try {
      const [attendanceRes, donationsRes] = await Promise.all([
        apiClient.get('/attendance'),
        apiClient.get('/finance/donations')
      ]);

      // Get unique guests from attendance
      const uniqueGuests = {};
      attendanceRes.data?.forEach(record => {
        if (record.is_guest && record.guest_name) {
          if (!uniqueGuests[record.guest_name]) {
            uniqueGuests[record.guest_name] = {
              name: record.guest_name,
              sessions: 0,
              donations: 0,
              donation_records: []
            };
          }
          uniqueGuests[record.guest_name].sessions += 1;
        }
      });

      // Add donations
      donationsRes.data?.forEach(donation => {
        if (donation.is_guest && donation.contributor_name) {
          if (!uniqueGuests[donation.contributor_name]) {
            uniqueGuests[donation.contributor_name] = {
              name: donation.contributor_name,
              sessions: 0,
              donations: 0,
              donation_records: []
            };
          }
          uniqueGuests[donation.contributor_name].donations += parseFloat(donation.amount);
          uniqueGuests[donation.contributor_name].donation_records.push(donation);
        }
      });

      setGuests(Object.values(uniqueGuests));
      setShowGuestModal(true);
    } catch (error) {
      console.error('Failed to fetch guests:', error);
    }
  };

  const closePlayerModal = () => {
    setShowPlayerModal(false);
    setSelectedPlayer(null);
    setPlayerDetails({ attendance: [], donations: [], total_donations: 0 });
  };

  const closeGuestModal = () => {
    setSelectedGuest(null);
    setGuestDetails({ donations: [], sessions: [] });
    setDetailsLoading(false);
    setShowGuestModal(false);
  };

  if (loading) return <div className="loading">Loading Dashboard...</div>;

  return (
    <div className="dashboard">
      <h1 className="page-title">📊 Dashboard</h1>

      {/* Key Stats */}
      <div className="stats-grid">
        <div className="stat-card" onClick={handlePlayerClick} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Players</div>
          <div className="stat-value">{dashboard?.player_count || 0}</div>
        </div>
        <div className="stat-card" onClick={handleGuestClick} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Guests</div>
          <div className="stat-value">{dashboard?.guest_count || 0}</div>
        </div>
        <div className="stat-card" onClick={() => navigate('/finance')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Total Income</div>
          <div className="stat-value">{formatVND(dashboard?.total_donations)}</div>
        </div>
        <div className="stat-card" onClick={() => navigate('/finance')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Remaining Fund</div>
          <div className="stat-value" style={{ color: dashboard?.remaining_fund >= 0 ? '#27ae60' : '#e74c3c' }}>
            {formatVND(dashboard?.remaining_fund)}
          </div>
        </div>
        <div className="stat-card" onClick={() => navigate('/finance')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Income (30 days)</div>
          <div className="stat-value">{formatVND(dashboard?.donations_30_days)}</div>
        </div>
        <div className="stat-card" onClick={() => navigate('/finance')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Expenses (30 days)</div>
          <div className="stat-value">{formatVND(dashboard?.expenses_30_days)}</div>
        </div>
      </div>

      {/* Recent Records */}
      <div className="section">
        <h2 className="section-title">📋 Recent Sessions (Last 5)</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Location</th>
                <th>Attendees</th>
              </tr>
            </thead>
            <tbody>
              {dashboard?.recent_sessions?.map(session => (
                <tr key={session.id}>
                  <td>{new Date(session.session_date).toLocaleDateString()}</td>
                  <td>{session.session_time}</td>
                  <td>{session.location}</td>
                  <td>{session.attendance_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

  <div className="section">
  <h2 className="section-title">💸 Recent Income (Last 5)</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Contributor</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {dashboard?.recent_donations?.map(donation => (
                <tr key={donation.id}>
                  <td>{donation.contributor_full_name || 'Anonymous'}</td>
                  <td>{formatVND(donation.amount)}</td>
                  <td>{new Date(donation.donated_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">💳 Recent Expenses (Last 5)</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {dashboard?.recent_expenses?.map(expense => (
                <tr key={expense.id}>
                  <td>{expense.description}</td>
                  <td>{formatVND(expense.amount)}</td>
                  <td>{expense.category || 'N/A'}</td>
                  <td>{new Date(expense.recorded_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Player Modal */}
      {showPlayerModal && (
        <div className="modal-overlay" onClick={closePlayerModal}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">Players</div>
            <div className="modal-body">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Username</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map(player => (
                      <tr key={player.id}>
                        <td>{player.full_name}</td>
                        <td>{player.username}</td>
                        <td>{new Date(player.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="button btn-secondary" onClick={closePlayerModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Modal */}
      {showGuestModal && (
        <div className="modal-overlay" onClick={closeGuestModal}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">Guests</div>
            <div className="modal-body">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Sessions</th>
                      <th>Total Income</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guests.map(guest => (
                      <tr key={guest.name}>
                        <td>{guest.name}</td>
                        <td>{guest.sessions}</td>
                        <td>{formatVND(guest.donations)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="button btn-secondary" onClick={closeGuestModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
