// Import necessary libraries
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Initialize Express app
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Path to the JSON file storing user credentials
const credentialsFilePath = path.join(__dirname, 'credentials.json');

// Secret key for JWT token generation and verification
const SECRET_KEY = 'your_secret_key';

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

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(403).json({ message: 'No token provided.' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to authenticate token.' });
    }
    req.userId = decoded.userId;
    next();
  });
}

// API endpoint to update user profile information
app.post('/api/updateProfile', verifyToken, async (req, res) => {
  const { username, email, password } = req.body;
  const credentials = readCredentials();

  // Check if the user exists
  if (!credentials[req.userId]) {
    return res.status(404).json({ message: 'User not found.' });
  }

  // Sanitize inputs
  const sanitizedUsername = username.trim();
  const sanitizedEmail = email.trim();
  const sanitizedPassword = password.trim();

  // Validate inputs
  if (!sanitizedUsername || !sanitizedEmail || !sanitizedPassword) {
    return res.status(400).json({ message: 'Invalid input.' });
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(sanitizedPassword, 10);

  // Update user profile information
  credentials[req.userId] = {
    username: sanitizedUsername,
    email: sanitizedEmail,
    password: hashedPassword
  };

  // Write updated credentials to the file
  writeCredentials(credentials);

  return res.status(200).json({ message: 'Profile updated successfully.' });
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
  <title>Update Profile</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
    }
    .form-container {
      margin-bottom: 20px;
    }
    .form-container input[type="text"],
    .form-container input[type="email"],
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
  <h1>Update Profile</h1>
  <div class="form-container">
    <form id="update-profile-form">
      <input type="text" id="username" placeholder="Username">
      <input type="email" id="email" placeholder="Email">
      <input type="password" id="password" placeholder="Password">
      <button type="submit">Update Profile</button>
    </form>
  </div>
  <script>
    document.getElementById('update-profile-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      const response = await fetch('/api/updateProfile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'your_jwt_token_here' // Replace with the actual JWT token
        },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message);
      } else {
        alert(data.message);
      }
    });
  </script>
</body>
</html>
*/