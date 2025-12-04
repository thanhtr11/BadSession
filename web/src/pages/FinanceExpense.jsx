import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { formatVND } from '../utils/format';

export default function FinanceExpense({ user }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: ''
  });

  const canEdit = user?.role === 'Admin';

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await apiClient.get('/finance/expenses');
      console.log('Fetched expenses:', res.data);
      setExpenses(res.data);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
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
      fetchExpenses();
    } catch (error) {
      console.error('Failed to record expense:', error);
      alert('Failed to record expense');
    }
  };

  const handleMarkAsPaid = async (expenseId, currentPaidStatus) => {
    try {
      const res = await apiClient.post(`/finance/expenses/${expenseId}/toggle-paid`);
      
      // Update local state immediately with the new paid status
      setExpenses(expenses.map(expense =>
        expense.id === expenseId ? { ...expense, is_paid: res.data.is_paid } : expense
      ));
    } catch (error) {
      console.error('Failed to toggle payment status:', error);
      alert('Failed to update payment status');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (user?.role !== 'Admin') {
      alert('Only admins can delete records');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this expense record? This action cannot be undone.')) {
      return;
    }
    try {
      await apiClient.delete(`/finance/expenses/${expenseId}`);
      // Remove the expense from the local state
      setExpenses(expenses.filter(e => e.id !== expenseId));
      alert('Expense record deleted successfully');
    } catch (error) {
      console.error('Failed to delete expense record:', error);
      alert('Failed to delete expense record');
    }
  };

  if (loading) return <div className="loading">Loading Expense Records...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#2c3e50' }}>💳 All Expense Records ({expenses.length})</h2>
        {canEdit && (
          <button className="button btn-danger" onClick={() => setShowExpenseModal(true)}>
            ➕ Record Expense
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
              <th>Status</th>
              {canEdit && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {expenses.map(expense => (
              <tr key={expense.id}>
                <td>{expense.description}</td>
                <td>{formatVND(expense.amount)}</td>
                <td style={{ textTransform: 'capitalize' }}>{expense.category}</td>
                <td>{expense.full_name || '-'}</td>
                <td>{new Date(expense.recorded_at).toLocaleDateString()}</td>
                <td>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: expense.is_paid ? '#d4edda' : '#f8d7da',
                    color: expense.is_paid ? '#155724' : '#721c24'
                  }}>
                    {expense.is_paid ? '✓ Paid' : '⏳ Pending'}
                  </span>
                </td>
                {canEdit && (
                  <td>
                    <button
                      onClick={() => handleMarkAsPaid(expense.id, expense.is_paid)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: expense.is_paid ? '#27ae60' : '#e74c3c',
                        color: 'white',
                        transition: 'all 0.3s ease',
                        transform: 'scale(1)',
                        opacity: 1,
                        marginRight: '4px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.05)';
                        e.target.style.opacity = '0.9';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.opacity = '1';
                      }}
                    >
                      {expense.is_paid ? '✓ Paid' : '💰 Pay'}
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: '#c0392b',
                        color: 'white',
                        transition: 'all 0.3s ease',
                        transform: 'scale(1)',
                        opacity: 1
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.05)';
                        e.target.style.opacity = '0.9';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.opacity = '1';
                      }}
                      title="Delete expense record"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Record Expense Modal */}
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
