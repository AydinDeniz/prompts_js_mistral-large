// Decentralized Identity Management System

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import { Web3 } from 'web3';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Initialize Express app
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Initialize Web3 for blockchain interaction
const web3 = new Web3('http://localhost:8545'); // Replace with your blockchain node URL

// Smart contract ABI and address (example)
const contractABI = [/* ABI here */];
const contractAddress = '0xYourContractAddress';
const contract = new web3.eth.Contract(contractABI, contractAddress);

// Function to create a Decentralized Identifier (DID)
function createDID() {
  const did = `did:example:${uuidv4()}`;
  return did;
}

// Function to issue a verifiable credential
async function issueCredential(did, credentialData) {
  const accounts = await web3.eth.getAccounts();
  const credential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuer: accounts[0],
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: did,
      ...credentialData,
    },
  };

  // Store the credential on the blockchain (simplified example)
  await contract.methods.issueCredential(did, JSON.stringify(credential)).send({ from: accounts[0] });

  return credential;
}

// API routes
app.post('/api/createDID', async (req, res) => {
  try {
    const did = createDID();
    res.status(200).json({ did });
  } catch (err) {
    res.status(500).json({ error: 'Error creating DID' });
  }
});

app.post('/api/issueCredential', async (req, res) => {
  const { did, credentialData } = req.body;
  try {
    const credential = await issueCredential(did, credentialData);
    res.status(200).json(credential);
  } catch (err) {
    res.status(500).json({ error: 'Error issuing credential' });
  }
});

app.get('/api/credentials/:did', async (req, res) => {
  const { did } = req.params;
  try {
    const accounts = await web3.eth.getAccounts();
    const credentials = await contract.methods.getCredentials(did).call({ from: accounts[0] });
    res.status(200).json(credentials);
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving credentials' });
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
  const [did, setDID] = useState('');
  const [credentialData, setCredentialData] = useState({});
  const [credentials, setCredentials] = useState([]);

  const handleCreateDID = async () => {
    const response = await axios.post('/api/createDID');
    setDID(response.data.did);
  };

  const handleIssueCredential = async () => {
    const response = await axios.post('/api/issueCredential', { did, credentialData });
    console.log('Credential issued:', response.data);
  };

  const fetchCredentials = async () => {
    const response = await axios.get(`/api/credentials/${did}`);
    setCredentials(response.data);
  };

  return (
    <div>
      <h1>Decentralized Identity Management System</h1>
      <button onClick={handleCreateDID}>Create DID</button>
      <div>
        <h2>Issue Credential</h2>
        <input
          type="text"
          placeholder="DID"
          value={did}
          onChange={(e) => setDID(e.target.value)}
        />
        <textarea
          placeholder="Credential Data (JSON format)"
          value={JSON.stringify(credentialData, null, 2)}
          onChange={(e) => setCredentialData(JSON.parse(e.target.value))}
        />
        <button onClick={handleIssueCredential}>Issue Credential</button>
      </div>
      <button onClick={fetchCredentials}>Fetch Credentials</button>
      <ul>
        {credentials.map((credential, index) => (
          <li key={index}>{JSON.stringify(credential, null, 2)}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;