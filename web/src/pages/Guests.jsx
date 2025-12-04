import React, { useState, useEffect } from 'react';
import apiClient from '../api';

export default function Guests() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
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

      // Add donation data
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
    } catch (error) {
      console.error('Failed to fetch guests:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading Guests...</div>;

  return (
    <div>
      <h1 className="page-title">👤 Guests</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Guests</div>
          <div className="stat-value">{guests.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Sessions with Guests</div>
          <div className="stat-value">{guests.reduce((sum, g) => sum + g.sessions, 0)}</div>
        </div>
            <div className="stat-card">
              <div className="stat-label">Total Guest Income</div>
              <div className="stat-value">VND {Number(guests.reduce((sum, g) => sum + g.donations, 0) || 0).toFixed(2)}</div>
        </div>
      </div>

      <div className="section">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Guest Name</th>
                <th>Sessions Attended</th>
                <th>Total Income</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((guest, idx) => (
                <tr key={idx}>
                  <td>{guest.name}</td>
                  <td>{guest.sessions}</td>
                    <td>VND {Number(guest.donations || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
