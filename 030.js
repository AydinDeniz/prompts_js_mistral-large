// Distributed Cloud Storage System

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
import { create } from 'ipfs-http-client';
import { Web3 } from 'web3';
import fs from 'fs';
import path from 'path';

// Initialize Express app
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Initialize IPFS client
const ipfs = create('https://ipfs.infura.io:5001');

// Initialize Web3 for blockchain interaction
const web3 = new Web3('http://localhost:8545'); // Replace with your blockchain node URL

// Smart contract ABI and address (example)
const contractABI = [/* ABI here */];
const contractAddress = '0xYourContractAddress';
const contract = new web3.eth.Contract(contractABI, contractAddress);

// Multer configuration for file uploads
const upload = multer({ dest: 'uploads/' });

// API routes
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const filePath = path.join(__dirname, file.path);
    const fileBuffer = fs.readFileSync(filePath);

    // Add file to IPFS
    const ipfsResult = await ipfs.add(fileBuffer);
    const ipfsHash = ipfsResult.path;

    // Register file on the blockchain
    const accounts = await web3.eth.getAccounts();
    await contract.methods.registerFile(ipfsHash, file.originalname).send({ from: accounts[0] });

    // Remove the temporary file
    fs.unlinkSync(filePath);

    res.status(200).json({ ipfsHash, fileName: file.originalname });
  } catch (err) {
    res.status(500).json({ error: 'Error uploading file' });
  }
});

app.get('/api/files', async (req, res) => {
  try {
    const accounts = await web3.eth.getAccounts();
    const files = await contract.methods.getFiles(accounts[0]).call();
    res.status(200).json(files);
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving files' });
  }
});

app.post('/api/share', async (req, res) => {
  const { ipfsHash, recipientAddress } = req.body;
  try {
    const accounts = await web3.eth.getAccounts();
    await contract.methods.shareFile(ipfsHash, recipientAddress).send({ from: accounts[0] });
    res.status(200).json({ message: 'File shared successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error sharing file' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Example frontend code using React
import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [shareData, setShareData] = useState({ ipfsHash: '', recipientAddress: '' });

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('File uploaded:', response.data);
  };

  const fetchFiles = async () => {
    const response = await axios.get('/api/files');
    setFiles(response.data);
  };

  const handleShare = async () => {
    const response = await axios.post('/api/share', shareData);
    console.log('File shared:', response.data);
  };

  return (
    <div>
      <h1>Distributed Cloud Storage System</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      <button onClick={fetchFiles}>Fetch Files</button>
      <ul>
        {files.map((file) => (
          <li key={file.ipfsHash}>{file.fileName}</li>
        ))}
      </ul>
      <div>
        <h2>Share File</h2>
        <input
          type="text"
          placeholder="IPFS Hash"
          value={shareData.ipfsHash}
          onChange={(e) => setShareData({ ...shareData, ipfsHash: e.target.value })}
        />
        <input
          type="text"
          placeholder="Recipient Address"
          value={shareData.recipientAddress}
          onChange={(e) => setShareData({ ...shareData, recipientAddress: e.target.value })}
        />
        <button onClick={handleShare}>Share</button>
      </div>
    </div>
  );
}

export default App;