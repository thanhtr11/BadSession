const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { generateToken } = require('../auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, full_name } = req.body;

    if (!username || !password || !full_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

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
      [username, hashedPassword, full_name, 'Player']
    );

    await connection.release();

    res.status(201).json({ 
      message: 'User registered successfully',
      user_id: result.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const connection = await pool.getConnection();

    const [users] = await connection.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    await connection.release();

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({ 
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
