import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { formatVND } from '../utils/format';

export default function Finance({ user }) {
  const [donations, setDonations] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
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
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: ''
  });

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      const [donationsRes, expensesRes, summaryRes] = await Promise.all([
        apiClient.get('/finance/donations'),
        apiClient.get('/finance/expenses'),
        apiClient.get('/finance/summary')
      ]);
      setDonations(donationsRes.data);
      setExpenses(expensesRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Failed to fetch finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchContributor = async (query) => {
    setSearchQuery(query);
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

  // When typing guest name, keep the typed value in donationForm.contributor_name
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
      const token = localStorage.getItem('token');
      const payload = {
        ...donationForm,
        amount: parseFloat(donationForm.amount),
        contributor_id: donationForm.is_guest ? null : parseInt(donationForm.contributor_id),
        contributor_name: donationForm.is_guest ? donationForm.contributor_name : ''
      };
      await apiClient.post('/finance/donations', payload);
      setShowDonationModal(false);
      setDonationForm({
        contributor_name: '',
        is_guest: false,
        contributor_id: '',
        amount: '',
        notes: ''
      });
      fetchFinanceData();
    } catch (error) {
      console.error('Failed to record income:', error);
      alert('Failed to record income');
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (user?.role !== 'Admin') {
      alert('Only admins can record expenses');
      return;
    }
    try {
      const payload = {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount)
      };
      await apiClient.post('/finance/expenses', payload);
      setShowExpenseModal(false);
      setExpenseForm({
        description: '',
        amount: '',
        category: ''
      });
      fetchFinanceData();
    } catch (error) {
      console.error('Failed to record expense:', error);
      alert('Failed to record expense');
    }
  };

  if (loading) return <div className="loading">Loading Finance Data...</div>;

  const canEdit = user?.role === 'Admin';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 className="page-title">💰 Finance Management</h1>
        {canEdit && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="button btn-success" onClick={() => setShowDonationModal(true)}>
              ➕ Record Income
            </button>
            <button className="button btn-danger" onClick={() => setShowExpenseModal(true)}>
              ➕ Record Expense
            </button>
          </div>
        )}
      </div>

      {/* Financial Summary */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Income</div>
          <div className="stat-value">{formatVND(summary?.total_donations)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value">{formatVND(summary?.total_expenses)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ color: summary?.remaining_fund >= 0 ? '#27ae60' : '#e74c3c' }}>
            Remaining Fund
          </div>
          <div className="stat-value" style={{ color: summary?.remaining_fund >= 0 ? '#27ae60' : '#e74c3c' }}>
            {formatVND(summary?.remaining_fund)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Income (30 days)</div>
          <div className="stat-value">{formatVND(summary?.donations_30_days)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Expenses (30 days)</div>
          <div className="stat-value">{formatVND(summary?.expenses_30_days)}</div>
        </div>
      </div>

      {/* Donations Table */}
      <div className="section">
        <h2 className="section-title">💸 Income</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Contributor</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {donations.map(donation => (
                <tr key={donation.id}>
                  <td>{donation.contributor_full_name || donation.contributor_name || 'Anonymous'}</td>
                  <td>{formatVND(donation.amount)}</td>
                  <td>{new Date(donation.donated_at).toLocaleDateString()}</td>
                  <td>{donation.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="section">
        <h2 className="section-title">💳 Expenses</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Recorded By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(expense => (
                <tr key={expense.id}>
                  <td>{expense.description}</td>
                  <td>{formatVND(expense.amount)}</td>
                  <td>{expense.category || '-'}</td>
                  <td>{expense.full_name}</td>
                  <td>{new Date(expense.recorded_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Donation Modal */}
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
                  onChange={e => setDonationForm({ ...donationForm, is_guest: e.target.value === 'guest', contributor_id: '', contributor_name: '' })}
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
                    onChange={(e) => handleSearchContributor(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
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
                          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>ID: {result.id}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showSearchResults && searchResults.length === 0 && searchQuery.length >= 2 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: '0',
                      right: '0',
                      backgroundColor: 'white',
                      border: '1px solid #17a2b8',
                      borderTop: 'none',
                      padding: '10px 15px',
                      color: '#7f8c8d',
                      zIndex: '1000',
                      marginTop: '-4px',
                      borderRadius: '0 0 4px 4px'
                    }}>
                      No players found
                    </div>
                  )}
                  {donationForm.contributor_id && (
                    <div style={{ marginTop: '8px', fontSize: '14px', color: '#27ae60' }}>
                      ✓ Selected: {donationForm.contributor_name}
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
                <textarea
                  className="form-textarea"
                  value={donationForm.notes}
                  onChange={e => setDonationForm({ ...donationForm, notes: e.target.value })}
                  placeholder="Optional notes"
                  rows="3"
                ></textarea>
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

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">Record Expense</div>
            <form onSubmit={handleAddExpense}>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  className="form-input"
                  value={expenseForm.description}
                  onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="e.g., Equipment, Venue Rental"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Amount (VND)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={expenseForm.amount}
                  onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={expenseForm.category}
                  onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                >
                  <option value="">Select Category</option>
                  <option value="equipment">Equipment</option>
                  <option value="venue">Venue Rental</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="button btn-secondary" onClick={() => setShowExpenseModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="button btn-danger">
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
