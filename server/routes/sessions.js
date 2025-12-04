const express = require('express');
const pool = require('../db');
const { authenticateToken, authorizeRole } = require('../auth');

const router = express.Router();

// Create session (Admin only)
router.post('/', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const { session_date, session_time, location } = req.body;

    if (!session_date || !session_time || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const connection = await pool.getConnection();
    
    const [result] = await connection.execute(
      'INSERT INTO sessions (session_date, session_time, location, created_by) VALUES (?, ?, ?, ?)',
      [session_date, session_time, location, req.user.id]
    );

    await connection.release();

    res.status(201).json({ 
      message: 'Session created successfully',
      session_id: result.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Get all sessions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [sessions] = await connection.execute(
      `SELECT s.id, s.session_date, s.session_time, s.location, s.created_by, u.full_name as created_by_name, s.created_at
       FROM sessions s
       LEFT JOIN users u ON s.created_by = u.id
       ORDER BY s.session_date DESC, s.session_time DESC`
    );

    // Get attendance count for each session
    for (let session of sessions) {
      const [attendance] = await connection.execute(
        'SELECT COUNT(*) as count FROM attendance WHERE session_id = ?',
        [session.id]
      );
      session.attendance_count = attendance[0].count;
    }

    await connection.release();
    res.json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve sessions' });
  }
});

// Get session by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [sessions] = await connection.execute(
      `SELECT s.id, s.session_date, s.session_time, s.location, s.created_by, u.full_name as created_by_name, s.created_at
       FROM sessions s
       LEFT JOIN users u ON s.created_by = u.id
       WHERE s.id = ?`,
      [req.params.id]
    );

    if (sessions.length === 0) {
      await connection.release();
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get attendance details
    const [attendance] = await connection.execute(
      `SELECT a.id, a.user_id, a.guest_name, a.is_guest, a.check_in_time, a.checked_in_by,
              COALESCE(u.full_name, a.guest_name) as name,
              checked_in_player.full_name as checked_in_by_name,
              DATE_FORMAT(a.check_in_time, '%Y-%m-%d %H:%i:%s') as formatted_check_in_time
       FROM attendance a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN users checked_in_player ON a.checked_in_by = checked_in_player.id
       WHERE a.session_id = ?
       ORDER BY a.check_in_time DESC`,
      [req.params.id]
    );

    await connection.release();

    sessions[0].attendance = attendance;
    res.json(sessions[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

module.exports = router;
