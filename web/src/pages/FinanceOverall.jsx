import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { formatVND } from '../utils/format';

export default function FinanceOverall({ user }) {
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
  const [showAllDonations, setShowAllDonations] = useState(false);
  const [showAllExpenses, setShowAllExpenses] = useState(false);

  const canEdit = user?.role === 'Admin';

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      const [incomeRes, expensesRes, summaryRes] = await Promise.all([
        apiClient.get('/finance/income'),
        apiClient.get('/finance/expenses'),
        apiClient.get('/finance/summary')
      ]);
      setDonations(incomeRes.data);
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
      await apiClient.post('/finance/income', payload);
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

  return (
    <div>
      <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 'bold', color: '#2c3e50' }}>📊 Overall Summary</h2>

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

      {/* Income Table */}
      <div className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 className="section-title">💸 Recent Income</h2>
          {donations && donations.length > 5 && (
            <button 
              className="btn btn-secondary"
              onClick={() => setShowAllDonations(true)}
              style={{ marginTop: 0, padding: '8px 16px', cursor: 'pointer' }}
            >
              See All ({donations.length})
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
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {donations.slice(0, 5).map(donation => (
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

      {/* Expense Table */}
      <div className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 className="section-title">💳 Recent Expenses</h2>
          {expenses && expenses.length > 5 && (
            <button 
              className="btn btn-secondary"
              onClick={() => setShowAllExpenses(true)}
              style={{ marginTop: 0, padding: '8px 16px', cursor: 'pointer' }}
            >
              See All ({expenses.length})
            </button>
          )}
        </div>
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
              {expenses.slice(0, 5).map(expense => (
                <tr key={expense.id}>
                  <td>{expense.description}</td>
                  <td>{formatVND(expense.amount)}</td>
                  <td style={{ textTransform: 'capitalize' }}>{expense.category}</td>
                  <td>{expense.created_by || '-'}</td>
                  <td>{new Date(expense.recorded_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* See All Modals and Record Modals code would go here - same as before */}
    </div>
  );
}
