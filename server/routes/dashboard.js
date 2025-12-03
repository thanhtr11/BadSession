const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../auth');

const router = express.Router();

// Get dashboard data
router.get('/', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // Count players
    const [playerCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM users WHERE role = "Player"'
    );

    // Count unique guests
    const [guestCount] = await connection.execute(
      'SELECT COUNT(DISTINCT guest_name) as count FROM attendance WHERE is_guest = TRUE'
    );

    // Financial summary
    const [totalDonations] = await connection.execute(
      'SELECT COALESCE(SUM(amount), 0) as total FROM donations'
    );

    const [totalExpenses] = await connection.execute(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses'
    );

    // Last 30 days
    const [donations30] = await connection.execute(
      'SELECT COALESCE(SUM(amount), 0) as total FROM donations WHERE donated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );

    const [expenses30] = await connection.execute(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE recorded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );

    // Recent donations (5)
    const [recentDonations] = await connection.execute(
      `SELECT d.id, d.contributor_name, d.amount, d.donated_at,
              CASE WHEN d.is_guest THEN d.contributor_name ELSE u.full_name END as contributor_full_name
       FROM donations d
       LEFT JOIN users u ON d.contributor_id = u.id
       ORDER BY d.donated_at DESC
       LIMIT 5`
    );

    // Recent expenses (5)
    const [recentExpenses] = await connection.execute(
      `SELECT e.id, e.description, e.amount, e.recorded_at
       FROM expenses e
       ORDER BY e.recorded_at DESC
       LIMIT 5`
    );

    // Recent sessions (5)
    const [recentSessions] = await connection.execute(
      `SELECT s.id, s.session_date, s.session_time, s.location, COUNT(a.id) as attendance_count
       FROM sessions s
       LEFT JOIN attendance a ON s.id = a.session_id
       GROUP BY s.id
       ORDER BY s.session_date DESC, s.session_time DESC
       LIMIT 5`
    );

    await connection.release();

    res.json({
      player_count: playerCount[0].count,
      guest_count: guestCount[0].count,
      total_donations: parseFloat(totalDonations[0].total),
      total_expenses: parseFloat(totalExpenses[0].total),
      remaining_fund: parseFloat(totalDonations[0].total) - parseFloat(totalExpenses[0].total),
      donations_30_days: parseFloat(donations30[0].total),
      expenses_30_days: parseFloat(expenses30[0].total),
      recent_donations: recentDonations,
      recent_expenses: recentExpenses,
      recent_sessions: recentSessions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve dashboard data' });
  }
});

module.exports = router;
