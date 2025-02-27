// Lightweight Authentication System

// Import necessary libraries
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

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

// Function to validate user login
async function validateLogin(username, password) {
  const credentials = readCredentials();
  const hashedPassword = credentials[username];

  if (!hashedPassword) {
    return { success: false, message: 'Invalid username or password.' };
  }

  const isValidPassword = await bcrypt.compare(password, hashedPassword);
  if (isValidPassword) {
    return { success: true, message: 'Login successful.' };
  } else {
    return { success: false, message: 'Invalid username or password.' };
  }
}

// Example usage
(async () => {
  // Register a new user
  const registerResult = await registerUser('deniz', 'password123');
  console.log(registerResult);

  // Validate user login
  const loginResult = await validateLogin('deniz', 'password123');
  console.log(loginResult);

  // Attempt to login with incorrect password
  const invalidLoginResult = await validateLogin('deniz', 'wrongpassword');
  console.log(invalidLoginResult);
})();