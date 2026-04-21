require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID');

// Configure MySQL Connection using a connection pool for stability!
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost', // Usually an intricate RDS endpoint like database-1.cluster-xxx.eu-west-1.rds.amazonaws.com
  user: process.env.DB_USER || 'root',      // Usually 'admin' or 'master' in RDS
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3307,        // RDS default is usually 3306
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
  
  // --- GOOGLE SSO API ROUTE ---
  if (req.method === 'POST' && req.url === '/api/auth/google') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    
    req.on('end', async () => {
        try {
            const { credential } = JSON.parse(body);
            console.log("TOKEN RECEIVED:", credential);
            console.log("EXPECTED CLIENT ID:", process.env.GOOGLE_CLIENT_ID);
            
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            const { sub: google_id, email, name: username } = payload;

            // Check if user exists by google_id or email
            db.query(
                'SELECT * FROM users WHERE google_id = ? OR email = ?',
                [google_id, email],
                (err, results) => {
                    if (err) {
                        console.error('Database Error during Google login:', err.message);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, message: 'Database error' }));
                        return;
                    }

                    if (results.length > 0) {
                        // User exists, login successful
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, message: 'Google login successful!', user: results[0] }));
                    } else {
                        // Create new user for Google SSO
                        db.query(
                            'INSERT INTO users (username, email, google_id) VALUES (?, ?, ?)',
                            [username, email, google_id],
                            (err, insertResults) => {
                                if (err) {
                                    console.error('Database Error during Google user creation:', err.message);
                                    res.writeHead(500, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({ success: false, message: 'Failed to create user' }));
                                    return;
                                }
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ success: true, message: 'Google account linked and logged in!', user: { username, email } }));
                            }
                        );
                    }
                }
            );
        } catch(e) {
            console.error('Google Auth Error:', e.message);
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Invalid Google token' }));
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
