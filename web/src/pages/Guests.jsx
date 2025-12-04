import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { formatVND } from '../utils/format';

export default function Guests() {
  const [guests, setGuests] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [guestDetails, setGuestDetails] = useState({ donations: [], sessions: [] });
  const [detailsLoading, setDetailsLoading] = useState(false);
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

  const openGuestModal = async (guestName) => {
    setSelectedGuest(guestName);
    setDetailsLoading(true);
    try {
      // fetch donations for this guest from existing donations endpoint and filter
      const donationsRes = await apiClient.get('/finance/donations');
      const guestDonations = (donationsRes.data || []).filter(d => d.is_guest && (d.contributor_name === guestName));

      // fetch session history for this guest
      const sessionsRes = await apiClient.get(`/attendance/guest/${encodeURIComponent(guestName)}/history`);

      setGuestDetails({ donations: guestDonations, sessions: sessionsRes.data || [] });
    } catch (err) {
      console.error('Failed to load guest details', err);
      setGuestDetails({ donations: [], sessions: [] });
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeGuestModal = () => {
    setSelectedGuest(null);
    setGuestDetails({ donations: [], sessions: [] });
    setDetailsLoading(false);
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
              <div className="stat-value">{formatVND(guests.reduce((sum, g) => sum + g.donations, 0))}</div>
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
                <tr key={idx} onClick={() => openGuestModal(guest.name)} style={{ cursor: 'pointer' }}>
                  <td>{guest.name}</td>
                  <td>{guest.sessions}</td>
                  <td>{formatVND(guest.donations)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guest Details Modal */}
      {selectedGuest && (
        <div className="modal-overlay" onClick={() => closeGuestModal()}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">Guest: {selectedGuest}</div>
            <div className="modal-body">
              {detailsLoading ? (
                <div className="loading">Loading details...</div>
              ) : (
                <div>
                  <div style={{ marginBottom: '12px' }}>
                    <strong>Total Guest Income: </strong>{formatVND(guestDetails.donations.reduce((s, d) => s + parseFloat(d.amount), 0))}
                  </div>

                  <h3>Donation History</h3>
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
                        {guestDetails.donations.map((d) => (
                          <tr key={d.id}>
                            <td>{formatVND(d.amount)}</td>
                            <td>{new Date(d.donated_at).toLocaleString()}</td>
                            <td>{d.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <h3 style={{ marginTop: '16px' }}>Session History</h3>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Session ID</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {guestDetails.sessions.map((s) => (
                          <tr key={s.id}>
                            <td>{s.session_id}</td>
                            <td>{s.session_date}</td>
                            <td>{s.session_time}</td>
                            <td>{s.location}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="button btn-secondary" onClick={() => closeGuestModal()}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
