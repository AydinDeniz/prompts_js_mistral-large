// WebSocket-based Real-Time File Transfer System with End-to-End Encryption

// Import necessary libraries
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const throttle = require('express-throttle');

// Initialize Express app
const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server);

// Middleware for bandwidth throttling
const throttleMiddleware = throttle({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(throttleMiddleware);

// Function to generate a random key for encryption
function generateKey() {
  return crypto.randomBytes(32).toString('hex');
}

// Function to encrypt data
function encryptData(data, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + encrypted;
}

// Function to decrypt data
function decryptData(encryptedData, key) {
  const iv = Buffer.from(encryptedData.slice(0, 32), 'hex');
  const encryptedText = encryptedData.slice(32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Function to calculate checksum for file integrity verification
function calculateChecksum(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// WebSocket connection event
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle file upload
  socket.on('uploadFile', async (fileData, fileName, fileSize, checksum) => {
    const filePath = path.join(__dirname, 'uploads', fileName);
    const writeStream = fs.createWriteStream(filePath);

    let receivedSize = 0;
    let receivedChecksum = '';

    // Write file data in chunks
    for (let i = 0; i < fileData.length; i++) {
      const chunk = fileData[i];
      writeStream.write(chunk);
      receivedSize += chunk.length;
      receivedChecksum = calculateChecksum(chunk);
    }

    writeStream.end(() => {
      // Verify file integrity
      const calculatedChecksum = calculateChecksum(fs.readFileSync(filePath));
      if (calculatedChecksum === checksum) {
        socket.emit('fileUploaded', { success: true, message: 'File uploaded successfully.' });
      } else {
        socket.emit('fileUploaded', { success: false, message: 'File integrity verification failed.' });
      }
    });
  });

  // Handle file download
  socket.on('downloadFile', (fileName) => {
    const filePath = path.join(__dirname, 'uploads', fileName);
    const readStream = fs.createReadStream(filePath);

    let fileData = [];
    let fileSize = 0;
    let checksum = '';

    readStream.on('data', (chunk) => {
      fileData.push(chunk);
      fileSize += chunk.length;
      checksum = calculateChecksum(chunk);
    });

    readStream.on('end', () => {
      socket.emit('fileData', { fileData, fileName, fileSize, checksum });
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Example HTML structure
/*
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Real-Time File Transfer</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
    }
    .upload-container {
      margin-bottom: 20px;
    }
    .upload-container input[type="file"] {
      display: block;
      margin-bottom: 10px;
    }
    .upload-container button {
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
  <h1>Real-Time File Transfer</h1>
  <div class="upload-container">
    <input type="file" id="file-input">
    <button id="upload-button">Upload File</button>
  </div>
  <script src="/socket.io/socket.io.js"></script>
  <script>
    const socket = io();
    const fileInput = document.getElementById('file-input');
    const uploadButton = document.getElementById('upload-button');

    uploadButton.addEventListener('click', () => {
      const file = fileInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const fileData = event.target.result;
          const fileName = file.name;
          const fileSize = file.size;
          const checksum = calculateChecksum(fileData);
          socket.emit('uploadFile', fileData, fileName, fileSize, checksum);
        };
        reader.readAsArrayBuffer(file);
      }
    });

    socket.on('fileUploaded', (data) => {
      if (data.success) {
        alert(data.message);
      } else {
        alert(data.message);
      }
    });

    function calculateChecksum(data) {
      const hash = crypto.createHash('sha256');
      hash.update(data);
      return hash.digest('hex');
    }
  </script>
</body>
</html>
*/