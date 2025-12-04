-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('Admin', 'Player') DEFAULT 'Player',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_date DATE NOT NULL,
  session_time TIME NOT NULL,
  location VARCHAR(255) NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Attendance records for players
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  user_id INT,
  guest_name VARCHAR(255),
  is_guest BOOLEAN DEFAULT FALSE,
  checked_in_by INT,
  check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (checked_in_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_player_session (session_id, user_id, is_guest)
);

-- Donations table
CREATE TABLE IF NOT EXISTS donations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contributor_id INT,
  contributor_name VARCHAR(255),
  is_guest BOOLEAN DEFAULT FALSE,
  amount DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  is_paid BOOLEAN DEFAULT FALSE,
  donated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contributor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100),
  recorded_by INT NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_paid BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Finance Settings table
CREATE TABLE IF NOT EXISTS finance_settings (
  id INT PRIMARY KEY DEFAULT 1,
  player_monthly_rate DECIMAL(10, 2) DEFAULT 0,
  player_monthly_year INT,
  player_monthly_month INT,
  guest_daily_rate DECIMAL(10, 2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add missing columns to finance_settings if they don't exist
ALTER TABLE finance_settings ADD COLUMN IF NOT EXISTS player_monthly_year INT;
ALTER TABLE finance_settings ADD COLUMN IF NOT EXISTS player_monthly_month INT;

-- Insert default finance settings
INSERT IGNORE INTO finance_settings (id, player_monthly_rate, guest_daily_rate) 
VALUES (1, 0, 0);

-- Matches table - stores badminton matches
CREATE TABLE IF NOT EXISTS matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  match_number INT NOT NULL,
  match_type ENUM('Singles', 'Doubles', 'Mixed Doubles') DEFAULT 'Singles',
  status ENUM('Pending', 'In Progress', 'Completed') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_match_per_session (session_id, match_number)
);

-- Match Players table - links players/guests to matches
CREATE TABLE IF NOT EXISTS match_players (
  id INT AUTO_INCREMENT PRIMARY KEY,
  match_id INT NOT NULL,
  user_id INT,
  guest_name VARCHAR(255),
  is_guest BOOLEAN DEFAULT FALSE,
  team ENUM('Team A', 'Team B') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_player_per_match (match_id, team, user_id, is_guest)
);

-- Match Results table - stores match scores
CREATE TABLE IF NOT EXISTS match_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  match_id INT NOT NULL,
  team_a_score INT DEFAULT 0,
  team_b_score INT DEFAULT 0,
  winner ENUM('Team A', 'Team B') DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  UNIQUE KEY unique_result_per_match (match_id)
);

-- Insert default admin user
INSERT IGNORE INTO users (id, username, password, full_name, role) 
VALUES (1, 'Admin', '$2a$10$rMfB/8ga/rO95ttGQEO.behPAab0zeiAwdeNMrEAvXerW6PxC7lQ2', 'Administrator', 'Admin');
