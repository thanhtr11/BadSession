const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../auth');

const router = express.Router();

// Get recent attendance records (including guests)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [attendance] = await connection.execute(
      `SELECT a.id, a.session_id, a.user_id, a.guest_name, a.is_guest, a.check_in_time, a.checked_in_by,
              COALESCE(u.full_name, a.guest_name) as name,
              checked_in_player.full_name as checked_in_by_name
       FROM attendance a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN users checked_in_player ON a.checked_in_by = checked_in_player.id
       ORDER BY a.check_in_time DESC`
    );

    await connection.release();
    res.json(attendance);
  } catch (error) {
    console.error('Failed to fetch attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Check in player (self) or guest
router.post('/check-in', authenticateToken, async (req, res) => {
  try {
    const { session_id, is_self_checkin, guest_name } = req.body;

    // Validate required fields
    if (!session_id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // If self check-in, guest_name should not be provided. If guest check-in, guest_name is required
    if (is_self_checkin && guest_name) {
      return res.status(400).json({ error: 'Cannot use guest name for self check-in' });
    }

    if (!is_self_checkin && !guest_name) {
      return res.status(400).json({ error: 'Guest name is required for guest check-in' });
    }

    const connection = await pool.getConnection();

    // Check if session exists
    const [sessions] = await connection.execute(
      'SELECT id FROM sessions WHERE id = ?',
      [session_id]
    );

    if (sessions.length === 0) {
      await connection.release();
      return res.status(404).json({ error: 'Session not found' });
    }

    // Self check-in (player)
    if (is_self_checkin) {
      const user_id = req.user.id;

      // Check if already checked in
      const [existing] = await connection.execute(
        'SELECT id FROM attendance WHERE session_id = ? AND user_id = ?',
        [session_id, user_id]
      );

      if (existing.length > 0) {
        await connection.release();
        return res.status(400).json({ error: 'You have already checked in for this session' });
      }

      const [result] = await connection.execute(
        'INSERT INTO attendance (session_id, user_id, is_guest) VALUES (?, ?, FALSE)',
        [session_id, user_id]
      );

      await connection.release();
      res.status(201).json({ message: 'Self check-in successful', attendance_id: result.insertId });
    } else {
      // Guest check-in - store which player checked them in
      const checked_in_by = req.user.id;
      
      const [result] = await connection.execute(
        'INSERT INTO attendance (session_id, guest_name, is_guest, checked_in_by) VALUES (?, ?, TRUE, ?)',
        [session_id, guest_name, checked_in_by]
      );

      // Get guest daily rate from settings
      const [settings] = await connection.execute(
        'SELECT guest_daily_rate FROM finance_settings WHERE id = 1'
      );

      const guestDailyRate = settings.length > 0 ? settings[0].guest_daily_rate : 0;

      // Create income record for guest check-in if rate is set
      if (guestDailyRate > 0) {
        await connection.execute(
          'INSERT INTO donations (contributor_id, contributor_name, is_guest, amount, notes, donated_at) VALUES (?, ?, TRUE, ?, ?, NOW())',
          [null, guest_name, guestDailyRate, `Auto-recorded from guest check-in`]
        );
      }

      await connection.release();
      res.status(201).json({ message: 'Guest check-in successful', attendance_id: result.insertId });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Check-in failed' });
  }
});

// Get attendance history for a player
router.get('/player/:player_id/history', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [attendance] = await connection.execute(
      `SELECT a.id, s.id as session_id, s.session_date, s.session_time, s.location, a.check_in_time
       FROM attendance a
       JOIN sessions s ON a.session_id = s.id
       WHERE a.user_id = ? AND a.is_guest = FALSE
       ORDER BY s.session_date DESC, s.session_time DESC`,
      [req.params.player_id]
    );

    await connection.release();
    res.json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve attendance history' });
  }
});

// Get attendance history for a guest
router.get('/guest/:guest_name/history', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [attendance] = await connection.execute(
      `SELECT a.id, s.id as session_id, s.session_date, s.session_time, s.location, a.check_in_time
       FROM attendance a
       JOIN sessions s ON a.session_id = s.id
       WHERE a.guest_name = ? AND a.is_guest = TRUE
       ORDER BY s.session_date DESC, s.session_time DESC`,
      [req.params.guest_name]
    );

    await connection.release();
    res.json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve guest attendance history' });
  }
});

// Update attendance (only for self check-ins or guest check-ins created by the player)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { guest_name } = req.body;
    const attendance_id = req.params.id;
    const user_id = req.user.id;

    const connection = await pool.getConnection();

    // Get the attendance record
    const [attendance] = await connection.execute(
      'SELECT id, user_id, is_guest, checked_in_by FROM attendance WHERE id = ?',
      [attendance_id]
    );

    if (attendance.length === 0) {
      await connection.release();
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    const record = attendance[0];

    // Check permissions: can only edit self check-in or guest check-in they created
    if (record.is_guest) {
      // For guest check-ins, only the player who checked them in can edit
      if (record.checked_in_by !== user_id) {
        await connection.release();
        return res.status(403).json({ error: 'You can only edit guest check-ins you created' });
      }
    } else {
      // For player check-ins, only the player themselves can edit
      if (record.user_id !== user_id) {
        await connection.release();
        return res.status(403).json({ error: 'You can only edit your own check-in' });
      }
    }

    // Update the record
    if (record.is_guest && guest_name) {
      await connection.execute(
        'UPDATE attendance SET guest_name = ? WHERE id = ?',
        [guest_name, attendance_id]
      );
    }

    await connection.release();
    res.json({ message: 'Attendance record updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
});

// Delete attendance (only for self check-ins or guest check-ins created by the player)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const attendance_id = req.params.id;
    const user_id = req.user.id;

    const connection = await pool.getConnection();

    // Get the attendance record
    const [attendance] = await connection.execute(
      'SELECT id, user_id, is_guest, checked_in_by FROM attendance WHERE id = ?',
      [attendance_id]
    );

    if (attendance.length === 0) {
      await connection.release();
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    const record = attendance[0];

    // Check permissions: can only delete self check-in or guest check-in they created
    if (record.is_guest) {
      // For guest check-ins, only the player who checked them in can delete
      if (record.checked_in_by !== user_id) {
        await connection.release();
        return res.status(403).json({ error: 'You can only delete guest check-ins you created' });
      }
    } else {
      // For player check-ins, only the player themselves can delete
      if (record.user_id !== user_id) {
        await connection.release();
        return res.status(403).json({ error: 'You can only delete your own check-in' });
      }
    }

    // Delete the record
    await connection.execute('DELETE FROM attendance WHERE id = ?', [attendance_id]);

    await connection.release();
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete attendance' });
  }
});

module.exports = router;
