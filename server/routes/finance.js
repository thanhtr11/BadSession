const express = require('express');
const pool = require('../db');
const { authenticateToken, authorizeRole } = require('../auth');

const router = express.Router();

// Record donation (Admin only)
router.post('/donations', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  let connection;
  try {
    const { contributor_id, contributor_name, is_guest, amount, notes } = req.body;

    if (!amount || (is_guest && !contributor_name) || (!is_guest && !contributor_id)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    connection = await pool.getConnection();

    const [result] = await connection.execute(
      'INSERT INTO donations (contributor_id, contributor_name, is_guest, amount, notes) VALUES (?, ?, ?, ?, ?)',
      [is_guest ? null : contributor_id, is_guest ? contributor_name : null, is_guest, amount, notes || null]
    );

    res.status(201).json({ message: 'Donation recorded', donation_id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to record donation' });
  } finally {
    if (connection) await connection.release();
  }
});

// Record expense (Admin only)
router.post('/expenses', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  let connection;
  try {
    const { description, amount, category } = req.body;

    if (!description || !amount) {
      return res.status(400).json({ error: 'Description and amount required' });
    }

    connection = await pool.getConnection();

    const [result] = await connection.execute(
      'INSERT INTO expenses (description, amount, category, recorded_by) VALUES (?, ?, ?, ?)',
      [description, amount, category || null, req.user.id]
    );

    res.status(201).json({ message: 'Expense recorded', expense_id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to record expense' });
  } finally {
    if (connection) await connection.release();
  }
});

// Get all donations
router.get('/donations', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [donations] = await connection.execute(
      `SELECT d.id, d.contributor_id, d.contributor_name, d.is_guest, d.amount, d.notes, d.is_paid, d.donated_at,
              CASE WHEN d.is_guest THEN d.contributor_name ELSE u.full_name END as contributor_full_name
       FROM donations d
       LEFT JOIN users u ON d.contributor_id = u.id
       ORDER BY d.donated_at DESC`
    );

    res.json(donations);
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ error: 'Failed to retrieve donations' });
  } finally {
    if (connection) await connection.release();
  }
});

// Get all expenses
router.get('/expenses', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [expenses] = await connection.execute(
      `SELECT e.id, e.description, e.amount, e.category, e.recorded_by, u.full_name, e.recorded_at, e.is_paid
       FROM expenses e
       LEFT JOIN users u ON e.recorded_by = u.id
       ORDER BY e.recorded_at DESC`
    );

    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to retrieve expenses' });
  } finally {
    if (connection) await connection.release();
  }
});

// Get financial summary
router.get('/summary', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

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
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Failed to retrieve financial summary' });
  } finally {
    if (connection) await connection.release();
  }
});

// Get top donors/contributors
router.get('/donations/top/contributors', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

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

    res.json(contributors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve contributors' });
  } finally {
    if (connection) await connection.release();
  }
});

// Alias routes for income (same as donations)
router.post('/income', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  let connection;
  try {
    const { contributor_id, contributor_name, is_guest, amount, notes } = req.body;

    if (!amount || (is_guest && !contributor_name) || (!is_guest && !contributor_id)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    connection = await pool.getConnection();

    const [result] = await connection.execute(
      'INSERT INTO donations (contributor_id, contributor_name, is_guest, amount, notes) VALUES (?, ?, ?, ?, ?)',
      [is_guest ? null : contributor_id, is_guest ? contributor_name : null, is_guest, amount, notes || null]
    );

    res.status(201).json({ message: 'Income recorded', income_id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to record income' });
  } finally {
    if (connection) await connection.release();
  }
});

router.get('/income', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [income] = await connection.execute(
      `SELECT d.id, d.contributor_id, d.contributor_name, d.is_guest, d.amount, d.notes, d.is_paid, d.donated_at,
              CASE WHEN d.is_guest THEN d.contributor_name ELSE u.full_name END as contributor_full_name
       FROM donations d
       LEFT JOIN users u ON d.contributor_id = u.id
       ORDER BY d.donated_at DESC`
    );

    res.json(income);
  } catch (error) {
    console.error('Error fetching income:', error);
    res.status(500).json({ error: 'Failed to retrieve income' });
  } finally {
    if (connection) await connection.release();
  }
});

// Search players or guests by name
router.get('/search', authenticateToken, async (req, res) => {
  let connection;
  try {
    const { type, query } = req.query;

    if (!type || !query) {
      return res.status(400).json({ error: 'Type and query parameters required' });
    }

    connection = await pool.getConnection();
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

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to search' });
  } finally {
    if (connection) await connection.release();
  }
});

// Mark income record as paid (Admin only)
router.post('/income/:id/paid', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await pool.getConnection();

    const [result] = await connection.execute(
      'UPDATE donations SET is_paid = TRUE WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Income record not found' });
    }

    res.json({ message: 'Income record marked as paid' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to mark as paid' });
  } finally {
    if (connection) await connection.release();
  }
});

// Toggle income record paid status (Admin only)
router.post('/income/:id/toggle-paid', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await pool.getConnection();

    // Get current paid status
    const [donation] = await connection.execute(
      'SELECT is_paid FROM donations WHERE id = ?',
      [id]
    );

    if (donation.length === 0) {
      return res.status(404).json({ error: 'Income record not found' });
    }

    const newPaidStatus = !donation[0].is_paid;

    // Toggle the paid status
    await connection.execute(
      'UPDATE donations SET is_paid = ? WHERE id = ?',
      [newPaidStatus, id]
    );

    res.json({ message: 'Income record status toggled', is_paid: newPaidStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to toggle paid status' });
  } finally {
    if (connection) await connection.release();
  }
});

// Toggle expense paid status (Admin only)
router.post('/expenses/:id/toggle-paid', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await pool.getConnection();

    // Get current paid status
    const [expense] = await connection.execute(
      'SELECT is_paid FROM expenses WHERE id = ?',
      [id]
    );

    if (expense.length === 0) {
      return res.status(404).json({ error: 'Expense record not found' });
    }

    const newPaidStatus = !expense[0].is_paid;

    // Toggle the paid status
    await connection.execute(
      'UPDATE expenses SET is_paid = ? WHERE id = ?',
      [newPaidStatus, id]
    );

    res.json({ message: 'Expense record status toggled', is_paid: newPaidStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to toggle paid status' });
  } finally {
    if (connection) await connection.release();
  }
});

// Get finance settings
router.get('/settings', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Getting settings...');
    
    // Try to fetch all columns, but fallback to just guest_daily_rate if columns don't exist
    let settings;
    try {
      const [result] = await connection.execute(
        'SELECT id, player_monthly_rate, player_monthly_year, player_monthly_month, guest_daily_rate FROM finance_settings WHERE id = 1'
      );
      settings = result;
    } catch (innerError) {
      // If columns don't exist, fetch only guest_daily_rate
      console.log('Some columns may not exist, fetching basic settings:', innerError.message);
      const [result] = await connection.execute(
        'SELECT id, guest_daily_rate FROM finance_settings WHERE id = 1'
      );
      settings = result.map(row => ({
        ...row,
        player_monthly_rate: 0,
        player_monthly_year: null,
        player_monthly_month: null
      }));
    }
    
    console.log('Settings fetched:', settings);

    if (settings.length === 0) {
      console.log('No settings found, returning defaults');
      return res.json({ 
        id: 1,
        player_monthly_rate: 0, 
        player_monthly_year: null, 
        player_monthly_month: null, 
        guest_daily_rate: 0 
      });
    }

    console.log('Returning settings:', settings[0]);
    res.json(settings[0]);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings', details: error.message });
  } finally {
    if (connection) await connection.release();
  }
});

// Update finance settings (Admin only)
router.post('/settings', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  let connection;
  try {
    const { player_monthly_rate, player_monthly_year, player_monthly_month, guest_daily_rate } = req.body;

    connection = await pool.getConnection();

    console.log('Updating settings with:', { player_monthly_rate, player_monthly_year, player_monthly_month, guest_daily_rate });

    // Update settings - try full update first
    try {
      await connection.execute(
        'UPDATE finance_settings SET player_monthly_rate = ?, player_monthly_year = ?, player_monthly_month = ?, guest_daily_rate = ? WHERE id = 1',
        [player_monthly_rate || 0, player_monthly_year || null, player_monthly_month || null, guest_daily_rate || 0]
      );
    } catch (updateError) {
      // If full update fails, try updating only guest_daily_rate
      console.log('Full update failed, trying guest_daily_rate only:', updateError.message);
      await connection.execute(
        'UPDATE finance_settings SET guest_daily_rate = ? WHERE id = 1',
        [guest_daily_rate || 0]
      );
    }

    console.log('Settings updated successfully');

    // If player_monthly_rate, year, and month are provided, auto-create income records for all players
    if (player_monthly_rate && player_monthly_year && player_monthly_month) {
      console.log(`Auto-creating income records for all players for ${player_monthly_year}-${player_monthly_month} at rate ${player_monthly_rate}`);
      
      // Get all players (non-guest users)
      const [players] = await connection.execute(
        'SELECT id, full_name FROM users WHERE role = ? ORDER BY full_name ASC',
        ['Player']
      );

      console.log(`Found ${players.length} players`);

      // Check if income records already exist for this period
      const [existingRecords] = await connection.execute(
        `SELECT COUNT(*) as count FROM donations d
         WHERE d.is_guest = FALSE 
         AND YEAR(d.donated_at) = ? 
         AND MONTH(d.donated_at) = ? 
         AND d.amount = ?`,
        [player_monthly_year, player_monthly_month, player_monthly_rate]
      );

      if (existingRecords[0].count === 0) {
        // Create income record for each player for this month
        for (const player of players) {
          await connection.execute(
            `INSERT INTO donations (contributor_id, contributor_name, is_guest, amount, notes, donated_at) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              player.id,
              null,
              false,
              player_monthly_rate,
              `Monthly income for ${player_monthly_year}-${String(player_monthly_month).padStart(2, '0')}`,
              new Date(`${player_monthly_year}-${String(player_monthly_month).padStart(2, '0')}-01`)
            ]
          );
        }
        console.log(`Created ${players.length} income records for the month`);
      } else {
        console.log('Income records already exist for this period');
      }
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error.message);
    console.error('Error details:', error);
    res.status(500).json({ error: 'Failed to update settings', details: error.message });
  } finally {
    if (connection) await connection.release();
  }
});

// Apply player monthly income rate to specific players (Admin only)
router.post('/apply-player-income', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  let connection;
  try {
    const { player_ids, amount, year, month } = req.body;

    if (!player_ids || player_ids.length === 0 || !amount || !year || !month) {
      return res.status(400).json({ error: 'Missing required fields: player_ids, amount, year, month' });
    }

    connection = await pool.getConnection();

    console.log(`Applying income rate ${amount} to ${player_ids.length} players for ${year}-${month}`);

    // Check if income records already exist for this period and these players
    const placeholders = player_ids.map(() => '?').join(',');
    const [existingRecords] = await connection.execute(
      `SELECT COUNT(*) as count FROM donations d
       WHERE d.is_guest = FALSE 
       AND d.contributor_id IN (${placeholders})
       AND YEAR(d.donated_at) = ? 
       AND MONTH(d.donated_at) = ? 
       AND d.amount = ?`,
      [...player_ids, year, month, amount]
    );

    let createdCount = 0;

    if (existingRecords[0].count === 0) {
      // Get player names for the income records
      const [players] = await connection.execute(
        `SELECT id, full_name FROM users WHERE id IN (${placeholders})`,
        player_ids
      );

      // Create income record for each selected player for this month
      for (const player of players) {
        await connection.execute(
          `INSERT INTO donations (contributor_id, contributor_name, is_guest, amount, notes, donated_at) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            player.id,
            null,
            false,
            amount,
            `Monthly income for ${year}-${String(month).padStart(2, '0')}`,
            new Date(`${year}-${String(month).padStart(2, '0')}-01`)
          ]
        );
        createdCount++;
      }
      console.log(`Created ${createdCount} income records`);
    } else {
      console.log('Some or all income records already exist for this period');
    }

    res.json({ 
      message: createdCount > 0 
        ? `Successfully created ${createdCount} income record(s)` 
        : 'Income records already exist for this period'
    });
  } catch (error) {
    console.error('Error applying player income:', error);
    res.status(500).json({ error: 'Failed to apply player income rate', details: error.message });
  } finally {
    if (connection) await connection.release();
  }
});

// Delete income record (Admin only)
router.delete('/income/:id', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await pool.getConnection();

    const [result] = await connection.execute(
      'DELETE FROM donations WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Income record not found' });
    }

    res.json({ message: 'Income record deleted successfully' });
  } catch (error) {
    console.error('Error deleting income record:', error);
    res.status(500).json({ error: 'Failed to delete income record' });
  } finally {
    if (connection) await connection.release();
  }
});

// Delete expense record (Admin only)
router.delete('/expenses/:id', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await pool.getConnection();

    const [result] = await connection.execute(
      'DELETE FROM expenses WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Expense record not found' });
    }

    res.json({ message: 'Expense record deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense record:', error);
    res.status(500).json({ error: 'Failed to delete expense record' });
  } finally {
    if (connection) await connection.release();
  }
});

// Update income record (Admin only)
router.put('/income/:id', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { amount, notes, contributor_id, contributor_name, is_guest } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    connection = await pool.getConnection();

    // Update the donation record
    const [result] = await connection.execute(
      `UPDATE donations SET 
        amount = ?,
        notes = ?,
        contributor_id = ?,
        contributor_name = ?
      WHERE id = ?`,
      [amount, notes || '', contributor_id || null, contributor_name || '', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Income record not found' });
    }

    res.json({ 
      message: 'Income record updated successfully',
      id,
      amount,
      notes,
      contributor_id,
      contributor_name
    });
  } catch (error) {
    console.error('Error updating income record:', error);
    res.status(500).json({ error: 'Failed to update income record' });
  } finally {
    if (connection) await connection.release();
  }
});

// Update expense record (Admin only)
router.put('/expenses/:id', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { amount, description, category, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    if (!description || description.trim() === '') {
      return res.status(400).json({ error: 'Description is required' });
    }

    if (!category || category.trim() === '') {
      return res.status(400).json({ error: 'Category is required' });
    }

    connection = await pool.getConnection();

    // Update the expense record
    const [result] = await connection.execute(
      `UPDATE expenses SET 
        amount = ?,
        description = ?,
        category = ?,
        notes = ?
      WHERE id = ?`,
      [amount, description, category, notes || '', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Expense record not found' });
    }

    res.json({ 
      message: 'Expense record updated successfully',
      id,
      amount,
      description,
      category,
      notes
    });
  } catch (error) {
    console.error('Error updating expense record:', error);
    res.status(500).json({ error: 'Failed to update expense record' });
  } finally {
    if (connection) await connection.release();
  }
});

module.exports = router;

