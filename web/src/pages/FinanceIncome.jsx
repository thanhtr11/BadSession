import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { formatVND } from '../utils/format';

export default function FinanceIncome({ user }) {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donationForm, setDonationForm] = useState({
    contributor_name: '',
    is_guest: false,
    contributor_id: '',
    amount: '',
    notes: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const canEdit = user?.role === 'Admin';

  useEffect(() => {
    fetchIncome();
  }, []);

  const fetchIncome = async () => {
    try {
      const res = await apiClient.get('/finance/income');
      setDonations(res.data);
    } catch (error) {
      console.error('Failed to fetch income:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchContributorWithSync = async (query) => {
    setSearchQuery(query);
    if (donationForm.is_guest) {
      setDonationForm({ ...donationForm, contributor_name: query });
    }
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    try {
      const type = donationForm.is_guest ? 'guest' : 'player';
      const res = await apiClient.get(`/finance/search?type=${type}&query=${encodeURIComponent(query)}`);
      setSearchResults(res.data);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Failed to search:', error);
      setSearchResults([]);
    }
  };

  const handleSelectContributor = (contributor) => {
    if (donationForm.is_guest) {
      const name = contributor.full_name || contributor.name;
      setDonationForm({ ...donationForm, contributor_name: name });
      setSearchQuery(name);
    } else {
      setDonationForm({ ...donationForm, contributor_id: contributor.id, contributor_name: contributor.full_name });
      setSearchQuery(contributor.full_name);
    }
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleAddDonation = async (e) => {
    e.preventDefault();
    if (user?.role !== 'Admin') {
      alert('Only admins can record income');
      return;
    }
    try {
      const payload = {
        ...donationForm,
        amount: parseFloat(donationForm.amount),
        contributor_id: donationForm.is_guest ? null : parseInt(donationForm.contributor_id),
        contributor_name: donationForm.is_guest ? donationForm.contributor_name : ''
      };
      await apiClient.post('/finance/income', payload);
      setShowDonationModal(false);
      setDonationForm({
        contributor_name: '',
        is_guest: false,
        contributor_id: '',
        amount: '',
        notes: ''
      });
      fetchIncome();
    } catch (error) {
      console.error('Failed to record income:', error);
      alert('Failed to record income');
    }
  };

  const handleMarkAsPaid = async (donationId) => {
    if (user?.role !== 'Admin') {
      alert('Only admins can mark as paid');
      return;
    }
    try {
      const response = await apiClient.post(`/finance/income/${donationId}/toggle-paid`);
      // Update the donation in the local state immediately
      setDonations(donations.map(d => 
        d.id === donationId ? { ...d, is_paid: response.data.is_paid } : d
      ));
    } catch (error) {
      console.error('Failed to toggle paid status:', error);
      alert('Failed to toggle paid status');
      // Refresh to show correct state if error
      fetchIncome();
    }
  };

  if (loading) return <div className="loading">Loading Income Records...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#2c3e50' }}>💸 All Income Records ({donations.length})</h2>
        {canEdit && (
          <button className="button btn-success" onClick={() => setShowDonationModal(true)}>
            ➕ Record Income
          </button>
        )}
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Contributor</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th>Notes</th>
              {canEdit && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {donations.map(donation => (
              <tr key={donation.id}>
                <td>{donation.contributor_full_name || donation.contributor_name || 'Anonymous'}</td>
                <td>{formatVND(donation.amount)}</td>
                <td>{new Date(donation.donated_at).toLocaleDateString()}</td>
                <td>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: donation.is_paid ? '#d4edda' : '#fff3cd',
                    color: donation.is_paid ? '#155724' : '#856404'
                  }}>
                    {donation.is_paid ? '✓ Paid' : 'Pending'}
                  </span>
                </td>
                <td>{donation.notes || '-'}</td>
                {canEdit && (
                  <td>
                    <button
                      onClick={() => handleMarkAsPaid(donation.id)}
                      style={{
                        padding: '6px 16px',
                        fontSize: '12px',
                        margin: 0,
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: donation.is_paid ? '#27ae60' : '#e74c3c',
                        color: 'white'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.opacity = '0.9';
                        e.target.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.opacity = '1';
                        e.target.style.transform = 'scale(1)';
                      }}
                    >
                      {donation.is_paid ? '✓ Paid' : '💰 Pay'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Record Income Modal */}
      {showDonationModal && (
        <div className="modal-overlay" onClick={() => setShowDonationModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">Record Income</div>
            <form onSubmit={handleAddDonation}>
              <div className="form-group">
                <label className="form-label">Contributor Type</label>
                <select
                  className="form-select"
                  value={donationForm.is_guest ? 'guest' : 'player'}
                  onChange={(e) => {
                    setDonationForm({ ...donationForm, is_guest: e.target.value === 'guest', contributor_id: '', contributor_name: '' });
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                >
                  <option value="player">Player</option>
                  <option value="guest">Guest</option>
                </select>
              </div>

              {donationForm.is_guest ? (
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">Guest Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search guest name..."
                    value={donationForm.contributor_name}
                    onChange={(e) => handleSearchContributorWithSync(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                    required
                  />
                  {showSearchResults && searchResults.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: '0',
                      right: '0',
                      backgroundColor: 'white',
                      border: '1px solid #17a2b8',
                      borderTop: 'none',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: '1000',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      marginTop: '-4px',
                      borderRadius: '0 0 4px 4px'
                    }}>
                      {searchResults.map((result) => (
                        <div
                          key={result.id}
                          onClick={() => handleSelectContributor({ id: result.id, full_name: result.full_name || result.name, name: result.name })}
                          style={{
                            padding: '10px 15px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #ecf0f1',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                        >
                          <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{result.full_name || result.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">Player Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search player name..."
                    value={searchQuery}
                    onChange={(e) => handleSearchContributorWithSync(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                    required
                  />
                  {showSearchResults && searchResults.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: '0',
                      right: '0',
                      backgroundColor: 'white',
                      border: '1px solid #17a2b8',
                      borderTop: 'none',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: '1000',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      marginTop: '-4px',
                      borderRadius: '0 0 4px 4px'
                    }}>
                      {searchResults.map((result) => (
                        <div
                          key={result.id}
                          onClick={() => handleSelectContributor(result)}
                          style={{
                            padding: '10px 15px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #ecf0f1',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                        >
                          <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{result.full_name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Amount (VND)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={donationForm.amount}
                  onChange={e => setDonationForm({ ...donationForm, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <input
                  type="text"
                  className="form-input"
                  value={donationForm.notes}
                  onChange={e => setDonationForm({ ...donationForm, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="button btn-secondary" onClick={() => setShowDonationModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="button btn-success">
                  Record Income
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
