import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="loading">Loading Dashboard...</div>;

  return (
    <div className="dashboard">
      <h1 className="page-title">📊 Dashboard</h1>

      {/* Key Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Players</div>
          <div className="stat-value">{dashboard?.player_count || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Guests</div>
          <div className="stat-value">{dashboard?.guest_count || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Fund</div>
          <div className="stat-value">${dashboard?.total_donations?.toFixed(2) || '0.00'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Remaining Fund</div>
          <div className="stat-value" style={{ color: dashboard?.remaining_fund >= 0 ? '#27ae60' : '#e74c3c' }}>
            ${dashboard?.remaining_fund?.toFixed(2) || '0.00'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Donations (30 days)</div>
          <div className="stat-value">${dashboard?.donations_30_days?.toFixed(2) || '0.00'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Expenses (30 days)</div>
          <div className="stat-value">${dashboard?.expenses_30_days?.toFixed(2) || '0.00'}</div>
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
        <h2 className="section-title">💸 Recent Donations (Last 5)</h2>
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
                  <td>${parseFloat(donation.amount).toFixed(2)}</td>
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
                  <td>${parseFloat(expense.amount).toFixed(2)}</td>
                  <td>{expense.category || 'N/A'}</td>
                  <td>{new Date(expense.recorded_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
