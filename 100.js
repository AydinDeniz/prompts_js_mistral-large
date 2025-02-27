// Secure Document Sharing System

// Import necessary libraries
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const morgan = require('morgan');

// Initialize Express app
const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Morgan middleware for audit logging
app.use(morgan('combined', {
  stream: fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })
}));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Function to generate a random key for encryption
function generateKey() {
  return crypto.randomBytes(32).toString('hex');
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

// Function to add a watermark to a document
function addWatermark(filePath, watermarkText) {
  // Placeholder for watermarking logic
  // Example: Using a library like pdf-lib to add a watermark to a PDF
  // const { PDFDocument } = require('pdf-lib');
  // const pdfDoc = await PDFDocument.load(fs.readFileSync(filePath));
  // pdfDoc.addWatermark(watermarkText);
  // fs.writeFileSync(filePath, await pdfDoc.save());
  console.log(`Added watermark to ${filePath}`);
}

// Function to handle document uploads
async function handleDocumentUpload(req, res) {
  const file = req.file;
  const filePath = file.path;
  const userId = req.body.userId; // Assume userId is passed in the request body
  const permissions = req.body.permissions; // Assume permissions are passed in the request body

  // Encrypt the document
  const key = generateKey();
  const encryptedData = encryptData(fs.readFileSync(filePath, 'utf8'), key);
  fs.writeFileSync(filePath, encryptedData);

  // Add a watermark to the document
  addWatermark(filePath, 'Confidential');

  // Store the document metadata in the database
  const documentMetadata = {
    userId,
    filePath,
    permissions,
    key
  };
  // Placeholder for storing metadata in the database
  // Example: Using a database library to insert the metadata into a documents table
  // await db.documents.insert(documentMetadata);

  res.status(200).json({ message: 'Document uploaded successfully.' });
}

// API endpoint to handle document uploads
app.post('/api/uploadDocument', upload.single('file'), async (req, res) => {
  try {
    await handleDocumentUpload(req, res);
  } catch (error) {
    res.status(500).json({ message: 'Document upload failed.', error: error.message });
  }
});

// API endpoint to handle document downloads
app.get('/api/downloadDocument', async (req, res) => {
  const { userId, documentId } = req.query;

  // Placeholder for retrieving document metadata from the database
  // Example: Using a database library to retrieve the metadata from a documents table
  // const documentMetadata = await db.documents.findOne({ userId, documentId });

  const documentMetadata = {
    userId,
    filePath: 'uploads/example.pdf',
    permissions: { read: true, write: false },
    key: generateKey() // Placeholder key
  };

  if (!documentMetadata || !documentMetadata.permissions.read) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  // Decrypt the document
  const encryptedData = fs.readFileSync(documentMetadata.filePath, 'utf8');
  const decryptedData = decryptData(encryptedData, documentMetadata.key);

  // Send the decrypted document to the client
  res.setHeader('Content-Disposition', `attachment; filename=${path.basename(documentMetadata.filePath)}`);
  res.setHeader('Content-Type', 'application/pdf');
  res.send(decryptedData);
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
  <title>Secure Document Sharing</title>
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
  <h1>Secure Document Sharing</h1>
  <div class="upload-container">
    <input type="file" id="file-input" name="file">
    <button id="upload-button">Upload Document</button>
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
      formData.append('userId', 'user123'); // Placeholder userId
      formData.append('permissions', JSON.stringify({ read: true, write: false })); // Placeholder permissions

      const response = await fetch('/api/uploadDocument', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        alert('Document uploaded successfully.');
      } else {
        alert(data.message);
      }
    });
  </script>
</body>
</html>
*/