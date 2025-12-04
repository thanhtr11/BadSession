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
      `SELECT d.id, d.contributor_id, d.contributor_name, d.is_guest, d.amount, d.notes, d.donated_at,
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
      `SELECT e.id, e.description, e.amount, e.category, e.recorded_by, u.full_name, e.recorded_at
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

    // Total donations
    const [donationData] = await connection.execute(
      'SELECT COALESCE(SUM(amount), 0) as total_donations FROM donations'
    );

    // Total expenses
    const [expenseData] = await connection.execute(
      'SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses'
    );

    // Last 30 days donations
    const [last30Donations] = await connection.execute(
      'SELECT COALESCE(SUM(amount), 0) as total_30_days FROM donations WHERE donated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );

    // Last 30 days expenses
    const [last30Expenses] = await connection.execute(
      'SELECT COALESCE(SUM(amount), 0) as total_30_days FROM expenses WHERE recorded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
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
      `SELECT d.id, d.contributor_id, d.contributor_name, d.is_guest, d.amount, d.notes, d.donated_at,
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

module.exports = router;
