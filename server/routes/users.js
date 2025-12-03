const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { authenticateToken, authorizeRole } = require('../auth');

const router = express.Router();

// Get all users
router.get('/', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.execute(
      'SELECT id, username, full_name, role, created_at FROM users'
    );
    await connection.release();

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// Get current user profile
router.get('/profile/me', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.execute(
      'SELECT id, username, full_name, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    await connection.release();

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// Change user role (Admin only)
router.put('/:id/role', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['Admin', 'Player'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const connection = await pool.getConnection();
    
    const [result] = await connection.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, id]
    );

    await connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Change password
router.put('/:id/password', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { old_password, new_password } = req.body;

    // Users can only change their own password unless they're admin
    if (req.user.id !== parseInt(id) && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Cannot change other user passwords' });
    }

    const connection = await pool.getConnection();
    
    const [users] = await connection.execute(
      'SELECT password FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      await connection.release();
      return res.status(404).json({ error: 'User not found' });
    }

    // Admin can change without verifying old password
    if (req.user.role !== 'Admin') {
      const validPassword = await bcrypt.compare(old_password, users[0].password);
      if (!validPassword) {
        await connection.release();
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await connection.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );

    await connection.release();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Create user (Admin only)
router.post('/', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const { username, password, full_name, role } = req.body;

    if (!username || !password || !full_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const validRole = role && ['Admin', 'Player'].includes(role) ? role : 'Player';

    const connection = await pool.getConnection();

    // Check if username already exists
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      await connection.release();
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await connection.execute(
      'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, full_name, validRole]
    );

    await connection.release();

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
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, authorizeRole('Admin'), async (req, res) => {
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

    const connection = await pool.getConnection();

    const [result] = await connection.execute(
      'DELETE FROM users WHERE id = ?',
      [id]
    );

    await connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
