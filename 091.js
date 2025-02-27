// Custom OAuth2.0 Implementation with JWT Token Handling

// Import necessary libraries
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

// Initialize Express app
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Path to the JSON file storing user credentials
const credentialsFilePath = path.join(__dirname, 'credentials.json');

// Secret keys for JWT token generation and verification
const SECRET_KEY = 'your_secret_key';
const REFRESH_SECRET_KEY = 'your_refresh_secret_key';

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Morgan middleware for audit logging
app.use(morgan('combined', {
  stream: fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })
}));

// Function to read user credentials from the JSON file
function readCredentials() {
  try {
    const data = fs.readFileSync(credentialsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

// Function to write user credentials to the JSON file
function writeCredentials(credentials) {
  fs.writeFileSync(credentialsFilePath, JSON.stringify(credentials, null, 2));
}

// Function to generate a JWT token
function generateToken(userId, role) {
  return jwt.sign({ userId, role }, SECRET_KEY, { expiresIn: '1h' });
}

// Function to generate a refresh token
function generateRefreshToken(userId) {
  return jwt.sign({ userId }, REFRESH_SECRET_KEY, { expiresIn: '7d' });
}

// Function to verify a JWT token
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return { success: true, userId: decoded.userId, role: decoded.role };
  } catch (error) {
    return { success: false, message: 'Invalid or expired token.' };
  }
}

// Function to verify a refresh token
function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET_KEY);
    return { success: true, userId: decoded.userId };
  } catch (error) {
    return { success: false, message: 'Invalid or expired refresh token.' };
  }
}

// Middleware to verify JWT token
function verifyTokenMiddleware(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(403).json({ message: 'No token provided.' });
  }

  const verificationResult = verifyToken(token);
  if (!verificationResult.success) {
    return res.status(401).json({ message: verificationResult.message });
  }

  req.userId = verificationResult.userId;
  req.role = verificationResult.role;
  next();
}

// API endpoint to handle token refresh
app.post('/api/refreshToken', async (req, res) => {
  const { refreshToken } = req.body;
  const verificationResult = verifyRefreshToken(refreshToken);

  if (!verificationResult.success) {
    return res.status(401).json({ message: verificationResult.message });
  }

  const userId = verificationResult.userId;
  const credentials = readCredentials();
  const user = credentials[userId];

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const newToken = generateToken(userId, user.role);
  const newRefreshToken = generateRefreshToken(userId);

  return res.status(200).json({ token: newToken, refreshToken: newRefreshToken });
});

// API endpoint to handle user login and generate tokens
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const credentials = readCredentials();
  const user = credentials[username];

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ message: 'Invalid password.' });
  }

  const token = generateToken(username, user.role);
  const refreshToken = generateRefreshToken(username);

  return res.status(200).json({ token, refreshToken });
});

// API endpoint to handle user registration
app.post('/api/register', async (req, res) => {
  const { username, password, role } = req.body;
  const credentials = readCredentials();

  if (credentials[username]) {
    return res.status(400).json({ message: 'Username already exists.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  credentials[username] = { password: hashedPassword, role };
  writeCredentials(credentials);

  return res.status(201).json({ message: 'User registered successfully.' });
});

// API endpoint to handle role-based access control
app.get('/api/secureData', verifyTokenMiddleware, (req, res) => {
  if (req.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied.' });
  }

  return res.status(200).json({ message: 'Secure data accessed successfully.' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Example HTML structure
/*
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OAuth2.0 Implementation</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
    }
    .form-container {
      margin-bottom: 20px;
    }
    .form-container input[type="text"],
    .form-container input[type="password"] {
      display: block;
      margin-bottom: 10px;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    .form-container button {
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h1>OAuth2.0 Implementation</h1>
  <div class="form-container">
    <form id="register-form">
      <input type="text" id="register-username" placeholder="Username">
      <input type="password" id="register-password" placeholder="Password">
      <input type="text" id="register-role" placeholder="Role">
      <button type="submit">Register</button>
    </form>
    <form id="login-form">
      <input type="text" id="login-username" placeholder="Username">
      <input type="password" id="login-password" placeholder="Password">
      <button type="submit">Login</button>
    </form>
  </div>
  <script>
    document.getElementById('register-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const username = document.getElementById('register-username').value;
      const password = document.getElementById('register-password').value;
      const role = document.getElementById('register-role').value;

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, role })
      });

      const data = await response.json();
      alert(data.message);
    });

    document.getElementById('login-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (response.ok) {
        alert('Login successful!');
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
      } else {
        alert(data.message);
      }
    });
  </script>
</body>
</html>
*/