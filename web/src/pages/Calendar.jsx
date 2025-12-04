import React, { useState, useEffect } from 'react';
import apiClient from '../api';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateSessions, setSelectedDateSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [sessionDetailsModal, setSessionDetailsModal] = useState(null);
  const [showSessionDetailsModal, setShowSessionDetailsModal] = useState(false);
  const [checkInData, setCheckInData] = useState({
    type: 'self',
    guest_name: ''
  });

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
      setLoading(true);
      console.log('Fetching sessions from API...');
      const res = await apiClient.get('/sessions');
      console.log('Sessions fetched:', res.data);
      setSessions(res.data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionDetails = async (sessionId) => {
    try {
      const res = await apiClient.get(`/sessions/${sessionId}`);
      setSessionDetailsModal(res.data);
      setShowSessionDetailsModal(true);
    } catch (error) {
      console.error('Failed to fetch session details:', error);
      alert('Failed to fetch session details');
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!sessionDetailsModal) return;

    try {
      const payload = {
        session_id: sessionDetailsModal.id,
        ...(checkInData.type === 'self' ? { is_self_checkin: true } : { guest_name: checkInData.guest_name })
      };
      await apiClient.post('/attendance/check-in', payload);
      setCheckInData({ type: 'self', guest_name: '' });
      await fetchSessionDetails(sessionDetailsModal.id);
      alert('Check-in successful!');
    } catch (error) {
      console.error('Failed to check in:', error);
      alert('Check-in failed: ' + error.response?.data?.error);
    }
  };

  const handleDeleteAttendance = async (attendance) => {
    if (!window.confirm('Are you sure you want to delete this check-in?')) return;

    try {
      await apiClient.delete(`/attendance/${attendance.id}`);
      await fetchSessionDetails(sessionDetailsModal.id);
      alert('Check-in deleted successfully!');
    } catch (error) {
      console.error('Failed to delete attendance:', error);
      alert('Failed to delete check-in: ' + error.response?.data?.error);
    }
  };

  // Get sessions for selected date
  useEffect(() => {
    if (selectedDate) {
      // Format date as YYYY-MM-DD using local timezone (not UTC)
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      console.log('Selected date:', dateStr);
      console.log('Available sessions:', sessions.map(s => s.session_date));
      
      const filtered = sessions.filter(s => s.session_date === dateStr);
      console.log('Filtered sessions:', filtered);
      
      setSelectedDateSessions(filtered);
    }
  }, [selectedDate, sessions]);

  // Calendar logic
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    setSelectedDate(null);
    setSelectedDateSessions([]);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    setSelectedDate(null);
    setSelectedDateSessions([]);
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
  };

  const getDaySessionCount = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    return sessions.filter(s => s.session_date === dateStr).length;
  };

  const getDaysArray = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = getDaysArray();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    return (
      selectedDate &&
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#17a2b8' }}>
        <p>Loading calendar...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px', color: '#2c3e50', fontSize: '28px', fontWeight: 'bold' }}>
        📅 Calendar
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Calendar */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '20px',
          border: '1px solid #ecf0f1'
        }}>
          {/* Month Navigation */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <button
              onClick={previousMonth}
              style={{
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={e => e.target.style.backgroundColor = '#138496'}
              onMouseLeave={e => e.target.style.backgroundColor = '#17a2b8'}
            >
              ← Previous
            </button>

            <h2 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#2c3e50'
            }}>
              {monthYear}
            </h2>

            <button
              onClick={nextMonth}
              style={{
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={e => e.target.style.backgroundColor = '#138496'}
              onMouseLeave={e => e.target.style.backgroundColor = '#17a2b8'}
            >
              Next →
            </button>
          </div>

          {/* Weekday Headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px',
            marginBottom: '8px'
          }}>
            {weekDays.map(day => (
              <div
                key={day}
                style={{
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#17a2b8',
                  padding: '10px',
                  fontSize: '12px',
                  backgroundColor: '#f0f8ff',
                  borderRadius: '4px'
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px'
          }}>
            {days.map((day, index) => {
              const sessionCount = day ? getDaySessionCount(day) : 0;
              const isCurrentDay = day && isToday(day);
              const isCurrentSelected = day && isSelected(day);

              return (
                <div
                  key={index}
                  onClick={() => day && handleDateClick(day)}
                  style={{
                    aspectRatio: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    borderRadius: '6px',
                    cursor: day ? 'pointer' : 'default',
                    backgroundColor: day ? (
                      isCurrentSelected ? '#17a2b8' :
                      isCurrentDay ? '#fff3cd' :
                      '#f8f9fa'
                    ) : 'transparent',
                    border: day ? (
                      isCurrentSelected ? '2px solid #0d6674' :
                      isCurrentDay ? '2px solid #ffc107' :
                      '1px solid #ecf0f1'
                    ) : 'none',
                    color: isCurrentSelected ? 'white' : '#2c3e50',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={e => {
                    if (day && !isCurrentSelected) {
                      e.currentTarget.style.backgroundColor = '#e8f8f5';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (day && !isCurrentSelected) {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  {day && (
                    <>
                      <span style={{ fontSize: '16px', marginBottom: '2px' }}>{day}</span>
                      {sessionCount > 0 && (
                        <span style={{
                          fontSize: '10px',
                          backgroundColor: isCurrentSelected ? 'rgba(255,255,255,0.3)' : '#17a2b8',
                          color: isCurrentSelected ? 'white' : 'white',
                          borderRadius: '10px',
                          padding: '2px 6px',
                          fontWeight: 'bold',
                          marginTop: '2px'
                        }}>
                          {sessionCount} 🎾
                        </span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{
            marginTop: '20px',
            padding: '12px',
            backgroundColor: '#f0f8ff',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#2c3e50'
          }}>
            <div style={{ marginBottom: '6px' }}>
              <span style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                backgroundColor: '#fff3cd',
                borderRadius: '2px',
                marginRight: '8px',
                border: '1px solid #ffc107'
              }}></span>
              <span>Today</span>
            </div>
            <div>
              <span style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                backgroundColor: '#17a2b8',
                borderRadius: '2px',
                marginRight: '8px'
              }}></span>
              <span>Selected</span>
            </div>
          </div>
        </div>

        {/* Session Details */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '20px',
          border: '1px solid #ecf0f1',
          height: 'fit-content'
        }}>
          <h3 style={{
            marginTop: 0,
            marginBottom: '15px',
            color: '#2c3e50',
            fontSize: '16px',
            fontWeight: 'bold',
            borderBottom: '2px solid #17a2b8',
            paddingBottom: '10px'
          }}>
            {selectedDate ? (
              <>📋 Sessions for {selectedDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</>
            ) : (
              <>📋 Select a Date</>
            )}
          </h3>

          {selectedDate ? (
            selectedDateSessions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedDateSessions.map(session => (
                  <div
                    key={session.id}
                    style={{
                      padding: '12px',
                      backgroundColor: '#f0f8ff',
                      border: '1px solid #17a2b8',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = '#e8f8f5';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = '#f0f8ff';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                    onClick={() => fetchSessionDetails(session.id)}
                  >
                    <div style={{ fontWeight: 'bold', color: '#17a2b8', marginBottom: '6px' }}>
                      ⏰ {session.session_time}
                    </div>
                    <div style={{ color: '#2c3e50', fontSize: '13px', marginBottom: '6px' }}>
                      📍 {session.location}
                    </div>
                    <div style={{ color: '#666', fontSize: '12px' }}>
                      👥 {session.attendance_count || 0} attendees
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#999',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px'
              }}>
                No sessions scheduled for this date
              </div>
            )
          ) : (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#999',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px'
            }}>
              Click on a date to view sessions
            </div>
          )}
        </div>
      </div>

      {/* Session Details Modal */}
      {showSessionDetailsModal && sessionDetailsModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowSessionDetailsModal(false);
            setSessionDetailsModal(null);
            setCheckInData({ type: 'self', guest_name: '' });
          }}
        >
          <div
            className="modal"
            onClick={e => e.stopPropagation()}
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="modal-header">🎾 Session Details</div>

            <div style={{ padding: '20px' }}>
              {/* Session Info */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '15px',
                marginBottom: '25px',
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '4px'
              }}>
                <div>
                  <p style={{
                    margin: '0',
                    color: '#2c3e50',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Time</p>
                  <p style={{
                    margin: '5px 0 0 0',
                    fontSize: '16px',
                    color: '#17a2b8',
                    fontWeight: 'bold'
                  }}>{sessionDetailsModal.session_time}</p>
                </div>
                <div>
                  <p style={{
                    margin: '0',
                    color: '#2c3e50',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Location</p>
                  <p style={{
                    margin: '5px 0 0 0',
                    fontSize: '16px',
                    color: '#17a2b8',
                    fontWeight: 'bold'
                  }}>{sessionDetailsModal.location}</p>
                </div>
              </div>

              {/* Check-In Section */}
              <div style={{
                backgroundColor: '#e8f8f5',
                padding: '15px',
                borderRadius: '4px',
                marginBottom: '25px',
                border: '1px solid #17a2b8'
              }}>
                <h3 style={{
                  margin: '0 0 12px 0',
                  color: '#17a2b8',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>✏️ Check-In</h3>
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
                    <div style={{
                      padding: '8px',
                      backgroundColor: 'white',
                      borderRadius: '3px',
                      fontSize: '13px',
                      color: '#138496'
                    }}>
                      ✓ {user?.full_name}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="button btn-success"
                    style={{ fontSize: '13px', padding: '8px' }}
                  >
                    Check-In
                  </button>
                </form>
              </div>

              {/* Attendees Section */}
              {sessionDetailsModal.attendance && sessionDetailsModal.attendance.length > 0 ? (
                <div>
                  <h3 style={{
                    margin: '0 0 12px 0',
                    color: '#2c3e50',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    borderBottom: '2px solid #17a2b8',
                    paddingBottom: '8px'
                  }}>
                    👥 Attendees ({sessionDetailsModal.attendance.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sessionDetailsModal.attendance.map((att) => (
                      <div
                        key={att.id}
                        style={{
                          padding: '10px',
                          backgroundColor: att.is_guest ? '#fff3cd' : '#d4f5f8',
                          borderLeft: `3px solid ${att.is_guest ? '#ffc107' : '#17a2b8'}`,
                          borderRadius: '3px',
                          fontSize: '13px'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '10px'
                        }}>
                          <div style={{ flex: 1 }}>
                            <p style={{
                              margin: '0',
                              fontWeight: 'bold',
                              color: '#2c3e50'
                            }}>
                              {att.is_guest ? '🧑' : '🎾'} {att.guest_name || att.name}
                              {att.is_guest && att.checked_in_by_name && (
                                <span style={{
                                  fontSize: '12px',
                                  fontWeight: 'normal',
                                  color: '#666',
                                  marginLeft: '5px'
                                }}>({att.checked_in_by_name})</span>
                              )}
                            </p>
                            <p style={{
                              margin: '3px 0 0 0',
                              fontSize: '11px',
                              color: '#666'
                            }}>
                              {att.formatted_check_in_time || (att.check_in_time ? new Date(att.check_in_time).toLocaleString() : 'N/A')}
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
                <div style={{
                  padding: '15px',
                  textAlign: 'center',
                  backgroundColor: '#ecf0f1',
                  borderRadius: '4px',
                  color: '#7f8c8d',
                  fontSize: '13px'
                }}>
                  No one has checked in yet
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="button btn-secondary"
                onClick={() => {
                  setShowSessionDetailsModal(false);
                  setSessionDetailsModal(null);
                  setCheckInData({ type: 'self', guest_name: '' });
                }}
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
