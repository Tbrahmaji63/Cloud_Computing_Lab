require('dotenv').config();
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// Ensure you have multipleStatements: true to run a full block of SQL
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD, 
  // database: process.env.DB_NAME, <-- REMOVED! We can't specify this until we know it exists
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

  if (!process.env.DB_NAME) {
    console.error('CRITICAL ERROR: process.env.DB_NAME is undefined! Did you forget to create your .env file on the cloud server?');
    process.exit(1);
  }

  console.log(`Connected successfully! Ensuring database \`${process.env.DB_NAME}\` exists...`);
  
  // Step 1: Force database creation and selection FIRST
  connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`; USE \`${process.env.DB_NAME}\`;`, (err) => {
      if (err) {
          console.error('FAILED to create or select database on AWS. Error:', err.message);
          console.error('Does your RDS user have permission to run CREATE DATABASE?');
          connection.end();
          return;
      }

      console.log(`Selected database \`${process.env.DB_NAME}\`. Now injecting tables...`);

      // Step 2: Inject the actual tables
      connection.query(sqlFileContent, (err, results) => {
        if (err) {
          console.error('Error executing Table SQL script:', err.message);
        } else {
          console.log('✅ Database seeded and tables created successfully!');
        }
        connection.end();
      });
  });
});
