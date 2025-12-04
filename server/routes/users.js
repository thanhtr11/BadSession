const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { authenticateToken, authorizeRole } = require('../auth');

const router = express.Router();

// Get all users
router.get('/', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [users] = await connection.execute(
      'SELECT id, username, full_name, role, created_at FROM users'
    );

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  } finally {
    if (connection) await connection.release();
  }
});

// Get current user profile
router.get('/profile/me', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [users] = await connection.execute(
      'SELECT id, username, full_name, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  } finally {
    if (connection) await connection.release();
  }
});

// Change user role (Admin only)
router.put('/:id/role', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['Admin', 'Player'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    connection = await pool.getConnection();
    
    const [result] = await connection.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update role' });
  } finally {
    if (connection) await connection.release();
  }
});

// Change password
router.put('/:id/password', authenticateToken, async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { old_password, new_password } = req.body;

    // Users can only change their own password unless they're admin
    if (req.user.id !== parseInt(id) && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Cannot change other user passwords' });
    }

    connection = await pool.getConnection();
    
    const [users] = await connection.execute(
      'SELECT password FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Admin can change without verifying old password
    if (req.user.role !== 'Admin') {
      const validPassword = await bcrypt.compare(old_password, users[0].password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await connection.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update password' });
  } finally {
    if (connection) await connection.release();
  }
});

// Create user (Admin only)
router.post('/', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  let connection;
  try {
    const { username, password, full_name, role } = req.body;

    if (!username || !password || !full_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const validRole = role && ['Admin', 'Player'].includes(role) ? role : 'Player';

    connection = await pool.getConnection();

    // Check if username already exists
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await connection.execute(
      'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, full_name, validRole]
    );

    res.status(201).json({
      message: 'User created successfully',
      user_id: result.insertId,
      user: {
        id: result.insertId,
        username,
        full_name,
        role: validRole
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create user' });
  } finally {
    if (connection) await connection.release();
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Prevent deleting the original admin (id=1)
    if (parseInt(id) === 1) {
      return res.status(400).json({ error: 'Cannot delete the original admin account' });
    }

    connection = await pool.getConnection();

    const [result] = await connection.execute(
      'DELETE FROM users WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete user' });
  } finally {
    if (connection) await connection.release();
  }
});

// Convert Player to Guest (Admin only)
router.post('/:id/player-to-guest', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await pool.getConnection();

    // Check if user exists and is a Player
    const [users] = await connection.execute(
      'SELECT id, role, full_name FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (users[0].role !== 'Player') {
      return res.status(400).json({ error: 'User is not a Player. Can only convert Players to Guests.' });
    }

    // Update user role to Guest
    await connection.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      ['Guest', id]
    );

    res.json({ 
      message: 'User successfully converted from Player to Guest',
      user: {
        id: users[0].id,
        full_name: users[0].full_name,
        role: 'Guest'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to convert user' });
  } finally {
    if (connection) await connection.release();
  }
});

// Convert Guest to Player (Admin only)
router.post('/:id/guest-to-player', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await pool.getConnection();

    // Check if user exists and is a Guest
    const [users] = await connection.execute(
      'SELECT id, role, full_name FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (users[0].role !== 'Guest') {
      return res.status(400).json({ error: 'User is not a Guest. Can only convert Guests to Players.' });
    }

    // Update user role to Player
    await connection.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      ['Player', id]
    );

    res.json({ 
      message: 'User successfully converted from Guest to Player',
      user: {
        id: users[0].id,
        full_name: users[0].full_name,
        role: 'Player'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to convert user' });
  } finally {
    if (connection) await connection.release();
  }
});

module.exports = router;
