-- Run this script in your MySQL client to setup the database, tables, and fake users.

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) UNIQUE,
    google_id VARCHAR(255) UNIQUE,
    password VARCHAR(255), -- Nullable for Google users
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some fake user login data
INSERT INTO users (username, password) VALUES 
('admin', 'admin123'),
('jane_doe', 'password123'),
('demo_user', 'securepass1');
