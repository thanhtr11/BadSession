const express = require('express');
const pool = require('../db');
const { authenticateToken, authorizeRole } = require('../auth');

const router = express.Router();

// Get all matches for a session
router.get('/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [matches] = await connection.execute(
      `SELECT 
        m.id,
        m.session_id,
        m.match_name,
        m.player1_id,
        m.player1_guest_name,
        m.player1_is_guest,
        m.player2_id,
        m.player2_guest_name,
        m.player2_is_guest,
        m.player1_score,
        m.player2_score,
        m.match_status,
        m.created_by,
        m.created_at,
        m.updated_at,
        u1.full_name as player1_name,
        u2.full_name as player2_name,
        created_user.full_name as created_by_name
       FROM matches m
       LEFT JOIN users u1 ON m.player1_id = u1.id
       LEFT JOIN users u2 ON m.player2_id = u2.id
       LEFT JOIN users created_user ON m.created_by = created_user.id
       WHERE m.session_id = ?
       ORDER BY m.created_at DESC`,
      [req.params.sessionId]
    );

    await connection.release();
    res.json(matches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve matches' });
  }
});

// Get single match
router.get('/:matchId', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [matches] = await connection.execute(
      `SELECT 
        m.id,
        m.session_id,
        m.match_name,
        m.player1_id,
        m.player1_guest_name,
        m.player1_is_guest,
        m.player2_id,
        m.player2_guest_name,
        m.player2_is_guest,
        m.player1_score,
        m.player2_score,
        m.match_status,
        m.created_by,
        m.created_at,
        m.updated_at,
        u1.full_name as player1_name,
        u2.full_name as player2_name,
        created_user.full_name as created_by_name
       FROM matches m
       LEFT JOIN users u1 ON m.player1_id = u1.id
       LEFT JOIN users u2 ON m.player2_id = u2.id
       LEFT JOIN users created_user ON m.created_by = created_user.id
       WHERE m.id = ?`,
      [req.params.matchId]
    );

    if (matches.length === 0) {
      await connection.release();
      return res.status(404).json({ error: 'Match not found' });
    }

    await connection.release();
    res.json(matches[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve match' });
  }
});

// Create match
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      session_id,
      match_name,
      player1_id,
      player1_guest_name,
      player1_is_guest,
      player2_id,
      player2_guest_name,
      player2_is_guest
    } = req.body;

    // Validate required fields
    if (!session_id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Validate at least one player/guest on each side
    if (!player1_id && !player1_guest_name) {
      return res.status(400).json({ error: 'Player 1 (player or guest) is required' });
    }
    if (!player2_id && !player2_guest_name) {
      return res.status(400).json({ error: 'Player 2 (player or guest) is required' });
    }

    // Ensure user ID and guest name consistency
    if (player1_is_guest && !player1_guest_name) {
      return res.status(400).json({ error: 'Guest name required for Player 1' });
    }
    if (player2_is_guest && !player2_guest_name) {
      return res.status(400).json({ error: 'Guest name required for Player 2' });
    }

    const connection = await pool.getConnection();

    // Check if session exists
    const [sessionCheck] = await connection.execute(
      'SELECT id FROM sessions WHERE id = ?',
      [session_id]
    );

    if (sessionCheck.length === 0) {
      await connection.release();
      return res.status(404).json({ error: 'Session not found' });
    }

    // Insert match
    const [result] = await connection.execute(
      `INSERT INTO matches 
       (session_id, match_name, player1_id, player1_guest_name, player1_is_guest, 
        player2_id, player2_guest_name, player2_is_guest, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session_id,
        match_name || `Match ${Date.now()}`,
        player1_id || null,
        player1_guest_name || null,
        player1_is_guest ? 1 : 0,
        player2_id || null,
        player2_guest_name || null,
        player2_is_guest ? 1 : 0,
        req.user.id
      ]
    );

    await connection.release();

    res.status(201).json({
      message: 'Match created successfully',
      match_id: result.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create match' });
  }
});

// Update match (scores and status)
router.put('/:matchId', authenticateToken, async (req, res) => {
  try {
    const {
      player1_score,
      player2_score,
      match_status,
      match_name
    } = req.body;

    const connection = await pool.getConnection();

    // Check if match exists
    const [matchCheck] = await connection.execute(
      'SELECT id FROM matches WHERE id = ?',
      [req.params.matchId]
    );

    if (matchCheck.length === 0) {
      await connection.release();
      return res.status(404).json({ error: 'Match not found' });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (player1_score !== undefined) {
      updateFields.push('player1_score = ?');
      updateValues.push(player1_score);
    }
    if (player2_score !== undefined) {
      updateFields.push('player2_score = ?');
      updateValues.push(player2_score);
    }
    if (match_status !== undefined) {
      updateFields.push('match_status = ?');
      updateValues.push(match_status);
    }
    if (match_name !== undefined) {
      updateFields.push('match_name = ?');
      updateValues.push(match_name);
    }

    if (updateFields.length === 0) {
      await connection.release();
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(req.params.matchId);

    const query = `UPDATE matches SET ${updateFields.join(', ')} WHERE id = ?`;

    await connection.execute(query, updateValues);
    await connection.release();

    res.json({ message: 'Match updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update match' });
  }
});

// Delete match
router.delete('/:matchId', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // Check if match exists
    const [matchCheck] = await connection.execute(
      'SELECT id FROM matches WHERE id = ?',
      [req.params.matchId]
    );

    if (matchCheck.length === 0) {
      await connection.release();
      return res.status(404).json({ error: 'Match not found' });
    }

    // Delete match
    await connection.execute(
      'DELETE FROM matches WHERE id = ?',
      [req.params.matchId]
    );

    await connection.release();
    res.json({ message: 'Match deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete match' });
  }
});

module.exports = router;
