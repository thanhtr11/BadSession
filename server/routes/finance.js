const express = require('express');
const pool = require('../db');
const { authenticateToken, authorizeRole } = require('../auth');

const router = express.Router();

// Record donation (Admin only)
router.post('/donations', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const { contributor_id, contributor_name, is_guest, amount, notes } = req.body;

    if (!amount || (is_guest && !contributor_name) || (!is_guest && !contributor_id)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const connection = await pool.getConnection();

    const [result] = await connection.execute(
      'INSERT INTO donations (contributor_id, contributor_name, is_guest, amount, notes) VALUES (?, ?, ?, ?, ?)',
      [is_guest ? null : contributor_id, is_guest ? contributor_name : null, is_guest, amount, notes || null]
    );

    await connection.release();

    res.status(201).json({ message: 'Donation recorded', donation_id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to record donation' });
  }
});

// Record expense (Admin only)
router.post('/expenses', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const { description, amount, category } = req.body;

    if (!description || !amount) {
      return res.status(400).json({ error: 'Description and amount required' });
    }

    const connection = await pool.getConnection();

    const [result] = await connection.execute(
      'INSERT INTO expenses (description, amount, category, recorded_by) VALUES (?, ?, ?, ?)',
      [description, amount, category || null, req.user.id]
    );

    await connection.release();

    res.status(201).json({ message: 'Expense recorded', expense_id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to record expense' });
  }
});

// Get all donations
router.get('/donations', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [donations] = await connection.execute(
      `SELECT d.id, d.contributor_id, d.contributor_name, d.is_guest, d.amount, d.notes, d.is_paid, d.donated_at,
              CASE WHEN d.is_guest THEN d.contributor_name ELSE u.full_name END as contributor_full_name
       FROM donations d
       LEFT JOIN users u ON d.contributor_id = u.id
       ORDER BY d.donated_at DESC`
    );

    await connection.release();
    res.json(donations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve donations' });
  }
});

// Get all expenses
router.get('/expenses', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [expenses] = await connection.execute(
      `SELECT e.id, e.description, e.amount, e.category, e.recorded_by, u.full_name, e.recorded_at, e.is_paid
       FROM expenses e
       LEFT JOIN users u ON e.recorded_by = u.id
       ORDER BY e.recorded_at DESC`
    );

    await connection.release();
    res.json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve expenses' });
  }
});

// Get financial summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // Total paid donations
    const [donationData] = await connection.execute(
      'SELECT COALESCE(SUM(amount), 0) as total_donations FROM donations WHERE is_paid = TRUE'
    );

    // Total paid expenses
    const [expenseData] = await connection.execute(
      'SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses WHERE is_paid = TRUE'
    );

    // Last 30 days paid donations
    const [last30Donations] = await connection.execute(
      'SELECT COALESCE(SUM(amount), 0) as total_30_days FROM donations WHERE is_paid = TRUE AND donated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );

    // Last 30 days paid expenses
    const [last30Expenses] = await connection.execute(
      'SELECT COALESCE(SUM(amount), 0) as total_30_days FROM expenses WHERE is_paid = TRUE AND recorded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );

    await connection.release();

    const totalDonations = parseFloat(donationData[0].total_donations);
    const totalExpenses = parseFloat(expenseData[0].total_expenses);

    res.json({
      total_donations: totalDonations,
      total_expenses: totalExpenses,
      remaining_fund: totalDonations - totalExpenses,
      donations_30_days: parseFloat(last30Donations[0].total_30_days),
      expenses_30_days: parseFloat(last30Expenses[0].total_30_days)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve financial summary' });
  }
});

// Get top donors/contributors
router.get('/donations/top/contributors', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [contributors] = await connection.execute(
      `SELECT 
        CASE WHEN is_guest THEN contributor_name ELSE u.full_name END as name,
        SUM(amount) as total_donated,
        COUNT(*) as donation_count
       FROM donations d
       LEFT JOIN users u ON d.contributor_id = u.id
       GROUP BY d.contributor_id, d.contributor_name, d.is_guest
       ORDER BY total_donated DESC
       LIMIT 10`
    );

    await connection.release();
    res.json(contributors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve contributors' });
  }
});

// Alias routes for income (same as donations)
router.post('/income', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const { contributor_id, contributor_name, is_guest, amount, notes } = req.body;

    if (!amount || (is_guest && !contributor_name) || (!is_guest && !contributor_id)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const connection = await pool.getConnection();

    const [result] = await connection.execute(
      'INSERT INTO donations (contributor_id, contributor_name, is_guest, amount, notes) VALUES (?, ?, ?, ?, ?)',
      [is_guest ? null : contributor_id, is_guest ? contributor_name : null, is_guest, amount, notes || null]
    );

    await connection.release();

    res.status(201).json({ message: 'Income recorded', income_id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to record income' });
  }
});

router.get('/income', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [income] = await connection.execute(
      `SELECT d.id, d.contributor_id, d.contributor_name, d.is_guest, d.amount, d.notes, d.is_paid, d.donated_at,
              CASE WHEN d.is_guest THEN d.contributor_name ELSE u.full_name END as contributor_full_name
       FROM donations d
       LEFT JOIN users u ON d.contributor_id = u.id
       ORDER BY d.donated_at DESC`
    );

    await connection.release();
    res.json(income);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve income' });
  }
});

// Search players or guests by name
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { type, query } = req.query;

    if (!type || !query) {
      return res.status(400).json({ error: 'Type and query parameters required' });
    }

    const connection = await pool.getConnection();
    const searchTerm = `%${query}%`;

    let results = [];

    if (type === 'player') {
      const [players] = await connection.execute(
        `SELECT id, full_name, username, role FROM users WHERE full_name LIKE ? OR username LIKE ? ORDER BY full_name ASC LIMIT 10`,
        [searchTerm, searchTerm]
      );
      results = players;
    } else if (type === 'guest') {
      const [guests] = await connection.execute(
        `SELECT DISTINCT guest_name as name FROM attendance WHERE is_guest = TRUE AND guest_name LIKE ? ORDER BY guest_name ASC LIMIT 10`,
        [searchTerm]
      );
      results = guests.map(g => ({ id: g.name, full_name: g.name, name: g.name }));
    }

    await connection.release();
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to search' });
  }
});

// Mark income record as paid (Admin only)
router.post('/income/:id/paid', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();

    const [result] = await connection.execute(
      'UPDATE donations SET is_paid = TRUE WHERE id = ?',
      [id]
    );

    await connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Income record not found' });
    }

    res.json({ message: 'Income record marked as paid' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to mark as paid' });
  }
});

// Toggle income record paid status (Admin only)
router.post('/income/:id/toggle-paid', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();

    // Get current paid status
    const [donation] = await connection.execute(
      'SELECT is_paid FROM donations WHERE id = ?',
      [id]
    );

    if (donation.length === 0) {
      await connection.release();
      return res.status(404).json({ error: 'Income record not found' });
    }

    const newPaidStatus = !donation[0].is_paid;

    // Toggle the paid status
    await connection.execute(
      'UPDATE donations SET is_paid = ? WHERE id = ?',
      [newPaidStatus, id]
    );

    await connection.release();

    res.json({ message: 'Income record status toggled', is_paid: newPaidStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to toggle paid status' });
  }
});

// Toggle expense paid status (Admin only)
router.post('/expenses/:id/toggle-paid', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();

    // Get current paid status
    const [expense] = await connection.execute(
      'SELECT is_paid FROM expenses WHERE id = ?',
      [id]
    );

    if (expense.length === 0) {
      await connection.release();
      return res.status(404).json({ error: 'Expense record not found' });
    }

    const newPaidStatus = !expense[0].is_paid;

    // Toggle the paid status
    await connection.execute(
      'UPDATE expenses SET is_paid = ? WHERE id = ?',
      [newPaidStatus, id]
    );

    await connection.release();

    res.json({ message: 'Expense record status toggled', is_paid: newPaidStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to toggle paid status' });
  }
});

// Get finance settings
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [settings] = await connection.execute(
      'SELECT player_monthly_rate, guest_daily_rate FROM finance_settings WHERE id = 1'
    );

    await connection.release();

    if (settings.length === 0) {
      return res.json({ player_monthly_rate: 0, guest_daily_rate: 0 });
    }

    res.json(settings[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update finance settings (Admin only)
router.post('/settings', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const { player_monthly_rate, guest_daily_rate } = req.body;

    const connection = await pool.getConnection();

    await connection.execute(
      'UPDATE finance_settings SET player_monthly_rate = ?, guest_daily_rate = ? WHERE id = 1',
      [player_monthly_rate || 0, guest_daily_rate || 0]
    );

    await connection.release();

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
