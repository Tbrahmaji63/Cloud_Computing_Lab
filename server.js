require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');

// Configure MySQL Connection using a connection pool for stability!
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',      
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME,
  port: 3307,
  waitForConnections: true,
  connectionLimit: 10
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL Pool: ', err.message);
  } else {
    console.log('Connected to MySQL Database Pool successfully.');
    connection.release();
  }
});

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  console.log(`Request for ${req.url}`);
  
  // --- AUTHENTICATION API ROUTE ---
  if (req.method === 'POST' && req.url === '/api/login') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    
    req.on('end', () => {
        try {
            const { username, password } = JSON.parse(body);
            
            // Validate credentials against the database
            db.query(
                'SELECT * FROM users WHERE username = ? AND password = ?',
                [username, password],
                (err, results) => {
                    if (err) {
                        console.error('Login Login Query Error Details:', err.message);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, message: 'Database error: ' + err.message }));
                        return;
                    }
                    
                    if (results.length > 0) {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, message: 'Logged in successfully!' }));
                    } else {
                        res.writeHead(401, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, message: 'Invalid username or password' }));
                    }
                }
            );
        } catch(e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Bad request payload' }));
        }
    });
    return;
  }
  // ---------------------------------

  // Standard specific HTML page routing
  let filePath = req.url;
  if (req.url === '/' || req.url === '/route') {
      filePath = '/login.html';
  } else if (req.url === '/page') {
      filePath = '/index.html';
  }
  filePath = path.join(__dirname, filePath);
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if(error.code == 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log('Press Ctrl+C to stop.');
});
