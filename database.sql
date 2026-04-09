-- Run this script in your MySQL client to setup the database, tables, and fake users.

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Note: Store hashed passwords in a real production app!
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some fake user login data
INSERT INTO users (username, password) VALUES 
('admin', 'admin123'),
('jane_doe', 'password123'),
('demo_user', 'securepass1');
