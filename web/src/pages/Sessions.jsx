import React, { useState, useEffect } from 'react';
import apiClient from '../api';

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    session_date: '',
    session_time: '',
    location: ''
  });
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [checkInData, setCheckInData] = useState({
    type: 'self',
    guest_name: ''
  });
  const [editModal, setEditModal] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [editGuestName, setEditGuestName] = useState('');

  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Failed to parse user data:', error);
    }
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await apiClient.get('/sessions');
      setSessions(res.data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/sessions', formData);
      setShowModal(false);
      setFormData({ session_date: '', session_time: '', location: '' });
      fetchSessions();
    } catch (error) {
      console.error('Failed to create session:', error);
      alert('Failed to create session: ' + error.response?.data?.error);
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        session_id: selectedSession.id,
        ...(checkInData.type === 'self' ? { is_self_checkin: true } : { guest_name: checkInData.guest_name })
      };
      await apiClient.post('/attendance/check-in', payload);
      setCheckInData({ type: 'self', guest_name: '' });
      fetchSessionDetails(selectedSession.id);
      alert('Check-in successful!');
    } catch (error) {
      console.error('Failed to check in:', error);
      alert('Check-in failed: ' + error.response?.data?.error);
    }
  };

  const fetchSessionDetails = async (sessionId) => {
    try {
      const res = await apiClient.get(`/sessions/${sessionId}`);
      setSessionDetails(res.data);
    } catch (error) {
      console.error('Failed to fetch session details:', error);
      alert('Failed to fetch session details: ' + error.response?.data?.error);
    }
  };

  const handleEditAttendance = (attendance) => {
  setEditingAttendance(attendance);
  setEditGuestName(attendance.guest_name || attendance.name || '');
    setEditModal(true);
  };

  const handleUpdateAttendance = async () => {
    if (!editingAttendance) return;

    try {
      const payload = editingAttendance.is_guest ? { guest_name: editGuestName } : {};

      await apiClient.put(`/attendance/${editingAttendance.id}`, payload);

      setEditModal(false);
      setEditingAttendance(null);
      setEditGuestName('');
      
      // Refresh session details
      fetchSessionDetails(sessionDetails.id);
      alert('Check-in updated successfully!');
    } catch (error) {
      console.error('Failed to update:', error);
      alert('Failed to update: ' + error.response?.data?.error);
    }
  };

  const handleDeleteAttendance = async (attendance) => {
    if (!window.confirm(`Delete check-in for ${attendance.name}?`)) return;

    try {
      await apiClient.delete(`/attendance/${attendance.id}`);

      // Refresh session details
      fetchSessionDetails(sessionDetails.id);
      alert('Check-in removed successfully!');
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete: ' + error.response?.data?.error);
    }
  };

  if (loading) return <div className="loading">Loading Sessions...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 className="page-title">📅 Sessions</h1>
        {user?.role === 'Admin' && (
          <button className="button btn-primary" onClick={() => setShowModal(true)}>
            ➕ Create Session
          </button>
        )}
      </div>

      <div className="section">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Location</th>
                <th>Attendees</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(session => (
                <tr key={session.id}>
                  <td>{new Date(session.session_date).toLocaleDateString()}</td>
                  <td>{session.session_time}</td>
                  <td>{session.location}</td>
                  <td>
                    <button 
                      style={{ background: 'none', border: 'none', color: '#17a2b8', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
                      onClick={() => {
                        setSelectedSession(session);
                        fetchSessionDetails(session.id);
                      }}
                      title="Click to view details"
                    >
                      {session.attendance_count}
                    </button>
                  </td>
                  <td>
                    <button 
                      className="button btn-primary btn-small"
                      onClick={() => {
                        setSelectedSession(session);
                        fetchSessionDetails(session.id);
                      }}
                    >
                      Check-In
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session Details & Check-In Modal */}
      {selectedSession && sessionDetails && (
        <div className="modal-overlay" onClick={() => {
          setSelectedSession(null);
          setSessionDetails(null);
          setCheckInData({ type: 'self', guest_name: '' });
        }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh', overflowY: 'auto', maxWidth: '700px' }}>
            <div className="modal-header">
              📅 {new Date(sessionDetails.session_date).toLocaleDateString()} at {sessionDetails.session_time}
            </div>
            
            <div style={{ padding: '20px' }}>
              {/* Session Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '4px' }}>
                <div>
                  <p style={{ margin: '0', color: '#2c3e50', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '16px', color: '#17a2b8', fontWeight: 'bold' }}>{sessionDetails.session_time}</p>
                </div>
                <div>
                  <p style={{ margin: '0', color: '#2c3e50', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '16px', color: '#17a2b8', fontWeight: 'bold' }}>{sessionDetails.location}</p>
                </div>
              </div>

              {/* Check-In Section */}
              <div style={{ backgroundColor: '#e8f8f5', padding: '15px', borderRadius: '4px', marginBottom: '25px', border: '1px solid #17a2b8' }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#17a2b8', fontSize: '14px', fontWeight: 'bold' }}>✏️ Check-In</h3>
                <form onSubmit={handleCheckIn} style={{ display: 'grid', gap: '10px' }}>
                  <select
                    className="form-select"
                    value={checkInData.type}
                    onChange={e => setCheckInData({ ...checkInData, type: e.target.value })}
                    style={{ padding: '8px', fontSize: '13px' }}
                  >
                    <option value="self">Check-In Myself (Player)</option>
                    <option value="guest">Check-In a Guest</option>
                  </select>

                  {checkInData.type === 'guest' ? (
                    <input
                      type="text"
                      className="form-input"
                      value={checkInData.guest_name}
                      onChange={e => setCheckInData({ ...checkInData, guest_name: e.target.value })}
                      placeholder="Guest's full name"
                      style={{ padding: '8px', fontSize: '13px' }}
                      required
                    />
                  ) : (
                    <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '3px', fontSize: '13px', color: '#138496' }}>
                      ✓ {user?.full_name}
                    </div>
                  )}

                  <button type="submit" className="button btn-success" style={{ fontSize: '13px', padding: '8px' }}>
                    Check-In
                  </button>
                </form>
              </div>

              {/* Attendees Section */}
              {sessionDetails.attendance && sessionDetails.attendance.length > 0 ? (
                <div>
                  <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50', fontSize: '14px', fontWeight: 'bold', borderBottom: '2px solid #17a2b8', paddingBottom: '8px' }}>
                    👥 Attendees ({sessionDetails.attendance.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sessionDetails.attendance.map((att) => (
                      <div key={att.id} style={{
                        padding: '10px',
                        backgroundColor: att.is_guest ? '#fff3cd' : '#d4f5f8',
                        borderLeft: `3px solid ${att.is_guest ? '#ffc107' : '#17a2b8'}`,
                        borderRadius: '3px',
                        fontSize: '13px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: '0', fontWeight: 'bold', color: '#2c3e50' }}>
                              {att.is_guest ? '🧑' : '🎾'} {att.guest_name || att.name}
                              {att.is_guest && att.checked_in_by_name && (
                                <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#666', marginLeft: '5px' }}>({att.checked_in_by_name})</span>
                              )}
                            </p>
                            <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#666' }}>
                              {new Date(att.check_in_time).toLocaleString()}
                            </p>
                          </div>
                          {(
                            (att.is_guest && att.checked_in_by === user?.id) ||
                            (!att.is_guest && att.user_id === user?.id)
                          ) && (
                            <button
                              onClick={() => handleDeleteAttendance(att)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                backgroundColor: '#e74c3c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '2px',
                                cursor: 'pointer'
                              }}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '15px', textAlign: 'center', backgroundColor: '#ecf0f1', borderRadius: '4px', color: '#7f8c8d', fontSize: '13px' }}>
                  No one has checked in yet
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="button btn-secondary" onClick={() => {
                setSelectedSession(null);
                setSessionDetails(null);
                setCheckInData({ type: 'self', guest_name: '' });
              }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Session Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">➕ Create New Session</div>
            <form onSubmit={handleCreateSession}>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.session_date}
                  onChange={e => setFormData({ ...formData, session_date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={formData.session_time}
                  onChange={e => setFormData({ ...formData, session_time: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Court A, Main Hall"
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="button btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="button btn-primary">
                  Create Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Attendance Modal */}
      {editModal && editingAttendance && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">Edit Check-In</div>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateAttendance(); }}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingAttendance.name}
                  disabled
                />
              </div>

              {editingAttendance.is_guest && (
                <div className="form-group">
                  <label className="form-label">Guest Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editGuestName}
                    onChange={(e) => setEditGuestName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="button btn-secondary" onClick={() => setEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="button btn-primary">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
