// Secure File Upload System with Virus Scanning and Content Type Verification

// Import necessary libraries
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const virusScanner = require('virus-scanner-library'); // Placeholder for virus scanning library

// Initialize Express app
const app = express();
const port = 3000;

// Middleware
app.use(express.static('public'));

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.ms-excel'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Function to strip metadata from files
function stripMetadata(filePath) {
  // Placeholder for metadata stripping logic
  // Example: Using a library like exiftool to remove metadata
  // exiftool -all= filePath
  console.log(`Stripping metadata from ${filePath}`);
}

// Function to scan files for viruses
async function scanFileForViruses(filePath) {
  // Placeholder for virus scanning logic
  // Example: Using a virus scanning library or API
  const scanResult = await virusScanner.scan(filePath);
  return scanResult;
}

// Function to handle file uploads
async function handleFileUpload(req, res) {
  const file = req.file;
  const filePath = file.path;

  // Strip metadata from the file
  stripMetadata(filePath);

  // Scan the file for viruses
  const scanResult = await scanFileForViruses(filePath);
  if (scanResult.isInfected) {
    // Remove the file if it is infected
    fs.unlinkSync(filePath);
    return res.status(400).json({ message: 'File is infected with a virus.' });
  }

  // Move the file to the secure storage location
  const secureFilePath = path.join(__dirname, 'secure_uploads', file.filename);
  fs.renameSync(filePath, secureFilePath);

  return res.status(200).json({ message: 'File uploaded successfully.', filePath: secureFilePath });
}

// API endpoint to handle file uploads
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    await handleFileUpload(req, res);
  } catch (error) {
    res.status(500).json({ message: 'File upload failed.', error: error.message });
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
  <title>Secure File Upload</title>
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
  <h1>Secure File Upload</h1>
  <div class="upload-container">
    <input type="file" id="file-input" name="file">
    <button id="upload-button">Upload File</button>
  </div>
  <script>
    document.getElementById('upload-button').addEventListener('click', async () => {
      const fileInput = document.getElementById('file-input');
      const file = fileInput.files[0];

      if (!file) {
        alert('Please select a file to upload.');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        alert('File uploaded successfully.');
      } else {
        alert(data.message);
      }
    });
  </script>
</body>
</html>
*/