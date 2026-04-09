require('dotenv').config();
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// Ensure you have multipleStatements: true to run a full block of SQL
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME, 
  port: process.env.DB_PORT || 3307,           
  multipleStatements: true 
});

console.log('Reading database.sql file...');
const sqlFilePath = path.join(__dirname, 'database.sql');
const sqlFileContent = fs.readFileSync(sqlFilePath, 'utf8');

console.log('Connecting to MySQL...');
connection.connect((err) => {
  if (err) {
    console.error('Failed to connect to MySQL:', err.message);
    process.exit(1);
  }

  console.log('Connected successfully! Executing queries...');

  connection.query(sqlFileContent, (err, results) => {
    if (err) {
      console.error('Error executing SQL file:', err.message);
    } else {
      console.log('✅ Database seeded and tables created successfully!');
    }
    
    // Close connection so the script exits cleanly
    connection.end();
  });
});
