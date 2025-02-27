// JavaScript Session Management System

// Import necessary libraries
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

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

// Function to register a new user
async function registerUser(username, password) {
  const credentials = readCredentials();
  if (credentials[username]) {
    return { success: false, message: 'Username already exists.' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  credentials[username] = hashedPassword;
  writeCredentials(credentials);

  return { success: true, message: 'User registered successfully.' };
}

// Function to validate user login and generate a JWT token
async function validateLogin(username, password) {
  const credentials = readCredentials();
  const hashedPassword = credentials[username];

  if (!hashedPassword) {
    return { success: false, message: 'Invalid username or password.' };
  }

  const isValidPassword = await bcrypt.compare(password, hashedPassword);
  if (isValidPassword) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    return { success: true, message: 'Login successful.', token };
  } else {
    return { success: false, message: 'Invalid username or password.' };
  }
}

// Function to verify the JWT token
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return { success: true, username: decoded.username };
  } catch (error) {
    return { success: false, message: 'Invalid or expired token.' };
  }
}

// Function to handle token expiration and re-authentication
async function handleTokenExpiration(username, password) {
  const result = await validateLogin(username, password);
  if (result.success) {
    return result.token;
  } else {
    return null;
  }
}

// Example usage
(async () => {
  // Register a new user
  const registerResult = await registerUser('deniz', 'password123');
  console.log(registerResult);

  // Validate user login and get a JWT token
  const loginResult = await validateLogin('deniz', 'password123');
  console.log(loginResult);

  // Verify the JWT token
  const tokenVerification = verifyToken(loginResult.token);
  console.log(tokenVerification);

  // Handle token expiration and re-authentication
  const newToken = await handleTokenExpiration('deniz', 'password123');
  console.log('New Token:', newToken);
})();