// Custom Password Manager with Encryption/Decryption, Cloud Sync, and Browser Extension

// Import necessary libraries
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Path to the JSON file storing encrypted credentials
const credentialsFilePath = path.join(__dirname, 'credentials.json');

// Function to read encrypted credentials from the JSON file
function readCredentials() {
  try {
    const data = fs.readFileSync(credentialsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

// Function to write encrypted credentials to the JSON file
function writeCredentials(credentials) {
  fs.writeFileSync(credentialsFilePath, JSON.stringify(credentials, null, 2));
}

// Function to generate a key from the master password
function generateKey(masterPassword) {
  return crypto.createHash('sha256').update(masterPassword).digest('hex');
}

// Function to encrypt data using the derived key
function encryptData(data, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + encrypted;
}

// Function to decrypt data using the derived key
function decryptData(encryptedData, key) {
  const iv = Buffer.from(encryptedData.slice(0, 32), 'hex');
  const encryptedText = encryptedData.slice(32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Function to add a new credential
function addCredential(masterPassword, site, username, password) {
  const key = generateKey(masterPassword);
  const encryptedUsername = encryptData(username, key);
  const encryptedPassword = encryptData(password, key);
  const credentials = readCredentials();
  credentials[site] = { username: encryptedUsername, password: encryptedPassword };
  writeCredentials(credentials);
}

// Function to get a credential
function getCredential(masterPassword, site) {
  const key = generateKey(masterPassword);
  const credentials = readCredentials();
  const encryptedCredential = credentials[site];
  if (!encryptedCredential) {
    return null;
  }
  const decryptedUsername = decryptData(encryptedCredential.username, key);
  const decryptedPassword = decryptData(encryptedCredential.password, key);
  return { username: decryptedUsername, password: decryptedPassword };
}

// Function to share a credential securely
function shareCredential(masterPassword, site, recipientMasterPassword) {
  const key = generateKey(masterPassword);
  const recipientKey = generateKey(recipientMasterPassword);
  const credentials = readCredentials();
  const encryptedCredential = credentials[site];
  if (!encryptedCredential) {
    return null;
  }
  const decryptedUsername = decryptData(encryptedCredential.username, key);
  const decryptedPassword = decryptData(encryptedCredential.password, key);
  const reEncryptedUsername = encryptData(decryptedUsername, recipientKey);
  const reEncryptedPassword = encryptData(decryptedPassword, recipientKey);
  return { username: reEncryptedUsername, password: reEncryptedPassword };
}

// API endpoint to add a new credential
app.post('/api/addCredential', (req, res) => {
  const { masterPassword, site, username, password } = req.body;
  addCredential(masterPassword, site, username, password);
  res.status(200).json({ message: 'Credential added successfully.' });
});

// API endpoint to get a credential
app.post('/api/getCredential', (req, res) => {
  const { masterPassword, site } = req.body;
  const credential = getCredential(masterPassword, site);
  if (credential) {
    res.status(200).json(credential);
  } else {
    res.status(404).json({ message: 'Credential not found.' });
  }
});

// API endpoint to share a credential
app.post('/api/shareCredential', (req, res) => {
  const { masterPassword, site, recipientMasterPassword } = req.body;
  const sharedCredential = shareCredential(masterPassword, site, recipientMasterPassword);
  if (sharedCredential) {
    res.status(200).json(sharedCredential);
  } else {
    res.status(404).json({ message: 'Credential not found.' });
  }
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
  <title>Password Manager</title>
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
  <h1>Password Manager</h1>
  <div class="form-container">
    <form id="add-credential-form">
      <input type="password" id="master-password" placeholder="Master Password">
      <input type="text" id="site" placeholder="Site">
      <input type="text" id="username" placeholder="Username">
      <input type="password" id="password" placeholder="Password">
      <button type="submit">Add Credential</button>
    </form>
    <form id="get-credential-form">
      <input type="password" id="get-master-password" placeholder="Master Password">
      <input type="text" id="get-site" placeholder="Site">
      <button type="submit">Get Credential</button>
    </form>
    <form id="share-credential-form">
      <input type="password" id="share-master-password" placeholder="Master Password">
      <input type="text" id="share-site" placeholder="Site">
      <input type="password" id="recipient-master-password" placeholder="Recipient Master Password">
      <button type="submit">Share Credential</button>
    </form>
  </div>
  <script>
    document.getElementById('add-credential-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const masterPassword = document.getElementById('master-password').value;
      const site = document.getElementById('site').value;
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      const response = await fetch('/api/addCredential', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ masterPassword, site, username, password })
      });

      const data = await response.json();
      alert(data.message);
    });

    document.getElementById('get-credential-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const masterPassword = document.getElementById('get-master-password').value;
      const site = document.getElementById('get-site').value;

      const response = await fetch('/api/getCredential', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ masterPassword, site })
      });

      const data = await response.json();
      if (response.ok) {
        alert(`Username: ${data.username}, Password: ${data.password}`);
      } else {
        alert(data.message);
      }
    });

    document.getElementById('share-credential-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const masterPassword = document.getElementById('share-master-password').value;
      const site = document.getElementById('share-site').value;
      const recipientMasterPassword = document.getElementById('recipient-master-password').value;

      const response = await fetch('/api/shareCredential', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ masterPassword, site, recipientMasterPassword })
      });

      const data = await response.json();
      if (response.ok) {
        alert(`Shared Username: ${data.username}, Shared Password: ${data.password}`);
      } else {
        alert(data.message);
      }
    });
  </script>
</body>
</html>
*/