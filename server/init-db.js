const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  try {
    console.log('Checking database initialization...');
    
    // Check if users table exists
    const [tables] = await pool.query("SHOW TABLES LIKE 'users'");
    
    if (tables.length === 0) {
      console.log('Tables not found. Initializing database...');
      
      // Read and execute schema.sql
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Split by semicolon and execute each statement
      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (const statement of statements) {
        await pool.query(statement);
      }
      
      console.log('Database initialized successfully!');
    } else {
      console.log('Database already initialized.');
    }
  } catch (error) {
    console.error('Database initialization error:', error.message);
    // Don't exit - let the app continue, it might recover
  }
}

module.exports = initializeDatabase;
