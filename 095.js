// Custom Authentication System using WebAuthn/FIDO2 Standards

// Import necessary libraries
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const fido2 = require('fido2-lib');
const { AuthenticatorDevice, AuthenticatorAttestationResponse, AuthenticatorAssertionResponse } = fido2.lib;

// Initialize Express app
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Path to the JSON file storing user credentials
const credentialsFilePath = path.join(__dirname, 'credentials.json');

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

// Function to generate a challenge for WebAuthn registration
function generateChallenge() {
  return uuidv4();
}

// Function to handle WebAuthn registration
async function handleRegistration(username, challenge, attestation) {
  const credentials = readCredentials();
  const authenticator = new AuthenticatorAttestationResponse(attestation);
  const registrationInfo = await authenticator.verifyRegistrationResponse(challenge);

  credentials[username] = {
    credentialId: registrationInfo.credentialId,
    publicKey: registrationInfo.publicKey,
    signCount: registrationInfo.signCount
  };

  writeCredentials(credentials);
}

// Function to handle WebAuthn authentication
async function handleAuthentication(username, challenge, assertion) {
  const credentials = readCredentials();
  const userCredential = credentials[username];

  if (!userCredential) {
    throw new Error('User not found');
  }

  const authenticator = new AuthenticatorAssertionResponse(assertion);
  const authenticationInfo = await authenticator.verifyAuthenticationResponse(challenge, userCredential.publicKey, userCredential.signCount);

  if (authenticationInfo.verified) {
    userCredential.signCount = authenticationInfo.newSignCount;
    writeCredentials(credentials);
    return true;
  } else {
    throw new Error('Authentication failed');
  }
}

// API endpoint to initiate WebAuthn registration
app.post('/api/register', async (req, res) => {
  const { username } = req.body;
  const challenge = generateChallenge();

  res.status(200).json({ challenge });
});

// API endpoint to complete WebAuthn registration
app.post('/api/completeRegistration', async (req, res) => {
  const { username, challenge, attestation } = req.body;

  try {
    await handleRegistration(username, challenge, attestation);
    res.status(200).json({ message: 'Registration successful' });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// API endpoint to initiate WebAuthn authentication
app.post('/api/authenticate', async (req, res) => {
  const { username } = req.body;
  const challenge = generateChallenge();

  res.status(200).json({ challenge });
});

// API endpoint to complete WebAuthn authentication
app.post('/api/completeAuthentication', async (req, res) => {
  const { username, challenge, assertion } = req.body;

  try {
    const isAuthenticated = await handleAuthentication(username, challenge, assertion);
    if (isAuthenticated) {
      res.status(200).json({ message: 'Authentication successful' });
    } else {
      res.status(401).json({ message: 'Authentication failed' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Authentication failed', error: error.message });
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
  <title>WebAuthn Authentication</title>
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
  <h1>WebAuthn Authentication</h1>
  <div class="form-container">
    <form id="register-form">
      <input type="text" id="register-username" placeholder="Username">
      <button type="submit">Register</button>
    </form>
    <form id="authenticate-form">
      <input type="text" id="authenticate-username" placeholder="Username">
      <button type="submit">Authenticate</button>
    </form>
  </div>
  <script>
    document.getElementById('register-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const username = document.getElementById('register-username').value;

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
      });

      const data = await response.json();
      const challenge = data.challenge;

      // Simulate WebAuthn registration process
      const attestation = await navigator.credentials.create({
        publicKey: {
          challenge: Uint8Array.from(atob(challenge), c => c.charCodeAt(0)),
          rp: { name: 'Example' },
          user: {
            id: Uint8Array.from(username, c => c.charCodeAt(0)),
            name: username,
            displayName: username
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: { authenticatorAttachment: 'platform' },
          timeout: 60000,
          attestation: 'direct'
        }
      });

      const completeResponse = await fetch('/api/completeRegistration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, challenge, attestation })
      });

      const completeData = await completeResponse.json();
      alert(completeData.message);
    });

    document.getElementById('authenticate-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const username = document.getElementById('authenticate-username').value;

      const response = await fetch('/api/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
      });

      const data = await response.json();
      const challenge = data.challenge;

      // Simulate WebAuthn authentication process
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: Uint8Array.from(atob(challenge), c => c.charCodeAt(0)),
          timeout: 60000,
          allowCredentials: [{
            id: Uint8Array.from(username, c => c.charCodeAt(0)),
            type: 'public-key'
          }]
        }
      });

      const completeResponse = await fetch('/api/completeAuthentication', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, challenge, assertion })
      });

      const completeData = await completeResponse.json();
      alert(completeData.message);
    });
  </script>
</body>
</html>
*/