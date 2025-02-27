// Blockchain-Based Voting System

// HTML Structure
document.body.innerHTML = `
  <div id="app">
    <h1>Blockchain-Based Voting System</h1>
    <div id="voteForm">
      <h2>Cast Your Vote</h2>
      <label for="candidate">Select Candidate:</label>
      <select id="candidate">
        <option value="candidate1">Candidate 1</option>
        <option value="candidate2">Candidate 2</option>
        <option value="candidate3">Candidate 3</option>
      </select>
      <button id="voteButton">Vote</button>
    </div>
    <div id="results">
      <h2>Election Results</h2>
      <ul id="resultsList"></ul>
    </div>
  </div>
`;

// Web3.js Setup
const Web3 = require('web3');
const web3 = new Web3('https://ropsten.infura.io/v3/your_infura_project_id');

// Smart Contract ABI and Address
const contractABI = [
  {
    "constant": false,
    "inputs": [
      {
        "name": "candidate",
        "type": "string"
      }
    ],
    "name": "vote",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "getResults",
    "outputs": [
      {
        "name": "",
        "type": "string[]"
      },
      {
        "name": "",
        "type": "uint256[]"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];
const contractAddress = 'your_contract_address';
const contract = new web3.eth.Contract(contractABI, contractAddress);

// IPFS Setup
const IPFS = require('ipfs-http-client');
const ipfs = IPFS.create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

// Vote Function
document.getElementById('voteButton').addEventListener('click', async () => {
  const candidate = document.getElementById('candidate').value;
  const accounts = await web3.eth.getAccounts();

  contract.methods.vote(candidate).send({ from: accounts[0] })
    .on('transactionHash', (hash) => {
      console.log('Transaction Hash:', hash);
    })
    .on('confirmation', (confirmationNumber, receipt) => {
      console.log('Confirmation Number:', confirmationNumber);
    })
    .on('error', (error) => {
      console.error('Error:', error);
    });

  updateResults();
});

// Update Results
async function updateResults() {
  const results = await contract.methods.getResults().call();
  const resultsList = document.getElementById('resultsList');
  resultsList.innerHTML = '';

  results[0].forEach((candidate, index) => {
    const listItem = document.createElement('li');
    listItem.textContent = `${candidate}: ${results[1][index]} votes`;
    resultsList.appendChild(listItem);
  });
}

// Initial Results Load
updateResults();

// Node.js Server (Example)
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

app.get('/api/results', async (req, res) => {
  const results = await contract.methods.getResults().call();
  res.json(results);
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});