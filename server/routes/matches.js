const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../auth');

const router = express.Router();

// Get all matches for a session
router.get('/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const connection = await pool.getConnection();

    // Get matches with their players and results
    const [matches] = await connection.execute(
      `SELECT m.id, m.session_id, m.match_number, m.match_type, m.status,
              mr.team_a_score, mr.team_b_score, mr.winner
       FROM matches m
       LEFT JOIN match_results mr ON m.id = mr.match_id
       WHERE m.session_id = ?
       ORDER BY m.match_number ASC`,
      [sessionId]
    );

    // For each match, get the players
    for (let match of matches) {
      const [players] = await connection.execute(
        `SELECT mp.id, mp.match_id, mp.user_id, mp.guest_name, mp.is_guest, mp.team,
                COALESCE(u.full_name, mp.guest_name) as name
         FROM match_players mp
         LEFT JOIN users u ON mp.user_id = u.id
         WHERE mp.match_id = ?
         ORDER BY mp.team`,
        [match.id]
      );
      match.players = players;
    }

    await connection.release();
    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Create a new match
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { session_id, match_type } = req.body;

    if (!session_id || !match_type) {
      return res.status(400).json({ error: 'Missing required fields: session_id, match_type' });
    }

    const connection = await pool.getConnection();

    // Get the next match number for this session
    const [countResult] = await connection.execute(
      'SELECT COUNT(*) + 1 as next_number FROM matches WHERE session_id = ?',
      [session_id]
    );
    const match_number = countResult[0].next_number;

    // Create match
    const [matchResult] = await connection.execute(
      'INSERT INTO matches (session_id, match_number, match_type, status) VALUES (?, ?, ?, ?)',
      [session_id, match_number, match_type, 'Pending']
    );

    // Create match result entry
    await connection.execute(
      'INSERT INTO match_results (match_id, team_a_score, team_b_score) VALUES (?, ?, ?)',
      [matchResult.insertId, 0, 0]
    );

    await connection.release();

    res.status(201).json({
      message: 'Match created successfully',
      match_id: matchResult.insertId,
      match_number: match_number
    });
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ error: 'Failed to create match' });
  }
});

// Add player to match
router.post('/:matchId/player', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { user_id, guest_name, is_guest, team } = req.body;

    if (!team || (!user_id && !guest_name)) {
      return res.status(400).json({ error: 'Missing required fields: team, and either user_id or guest_name' });
    }

    const connection = await pool.getConnection();

    // Check if team already has max players (for doubles: 2, for singles: 1)
    const [matchData] = await connection.execute(
      'SELECT match_type FROM matches WHERE id = ?',
      [matchId]
    );

    if (matchData.length === 0) {
      await connection.release();
      return res.status(404).json({ error: 'Match not found' });
    }

    const maxPlayers = matchData[0].match_type === 'Doubles' || matchData[0].match_type === 'Mixed Doubles' ? 2 : 1;

    const [teamPlayers] = await connection.execute(
      'SELECT COUNT(*) as count FROM match_players WHERE match_id = ? AND team = ?',
      [matchId, team]
    );

    if (teamPlayers[0].count >= maxPlayers) {
      await connection.release();
      return res.status(400).json({ error: `${team} already has maximum players` });
    }

    // Add player to match
    const [result] = await connection.execute(
      'INSERT INTO match_players (match_id, user_id, guest_name, is_guest, team) VALUES (?, ?, ?, ?, ?)',
      [matchId, user_id || null, guest_name || null, is_guest || false, team]
    );

    await connection.release();

    res.status(201).json({
      message: 'Player added to match successfully',
      player_id: result.insertId
    });
  } catch (error) {
    console.error('Error adding player to match:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Player already in this match' });
    } else {
      res.status(500).json({ error: 'Failed to add player to match' });
    }
  }
});

// Remove player from match
router.delete('/player/:playerId', authenticateToken, async (req, res) => {
  try {
    const { playerId } = req.params;
    const connection = await pool.getConnection();

    const [result] = await connection.execute(
      'DELETE FROM match_players WHERE id = ?',
      [playerId]
    );

    await connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json({ message: 'Player removed from match successfully' });
  } catch (error) {
    console.error('Error removing player from match:', error);
    res.status(500).json({ error: 'Failed to remove player from match' });
  }
});

// Update match result (score)
router.put('/:matchId/result', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { team_a_score, team_b_score, status } = req.body;

    if (team_a_score === undefined || team_b_score === undefined) {
      return res.status(400).json({ error: 'Missing required fields: team_a_score, team_b_score' });
    }

    const connection = await pool.getConnection();

    // Determine winner
    let winner = null;
    if (team_a_score > team_b_score) {
      winner = 'Team A';
    } else if (team_b_score > team_a_score) {
      winner = 'Team B';
    }

    // Update match result
    const [result] = await connection.execute(
      'UPDATE match_results SET team_a_score = ?, team_b_score = ?, winner = ? WHERE match_id = ?',
      [team_a_score, team_b_score, winner, matchId]
    );

    // Update match status if provided
    if (status) {
      await connection.execute(
        'UPDATE matches SET status = ? WHERE id = ?',
        [status, matchId]
      );
    }

    await connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Match result not found' });
    }

    res.json({
      message: 'Match result updated successfully',
      winner: winner
    });
  } catch (error) {
    console.error('Error updating match result:', error);
    res.status(500).json({ error: 'Failed to update match result' });
  }
});

// Update match status
router.put('/:matchId/status', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Missing required field: status' });
    }

    const connection = await pool.getConnection();

    await connection.execute(
      'UPDATE matches SET status = ? WHERE id = ?',
      [status, matchId]
    );

    await connection.release();

    res.json({ message: 'Match status updated successfully' });
  } catch (error) {
    console.error('Error updating match status:', error);
    res.status(500).json({ error: 'Failed to update match status' });
  }
});

// Delete match
router.delete('/:matchId', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const connection = await pool.getConnection();

    const [result] = await connection.execute(
      'DELETE FROM matches WHERE id = ?',
      [matchId]
    );

    await connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json({ message: 'Match deleted successfully' });
  } catch (error) {
    console.error('Error deleting match:', error);
    res.status(500).json({ error: 'Failed to delete match' });
  }
});

module.exports = router;
