// Expense Tracker Application

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Initialize Express app
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory data store for user expenses
const userExpenses = {};

// Function to add a transaction
function addTransaction(userId, transaction) {
  if (!userExpenses[userId]) {
    userExpenses[userId] = [];
  }
  userExpenses[userId].push(transaction);
}

// Function to generate a report
function generateReport(userId) {
  const expenses = userExpenses[userId] || [];
  const report = {
    total: expenses.reduce((acc, curr) => acc + curr.amount, 0),
    categories: expenses.reduce((acc, curr) => {
      if (!acc[curr.category]) {
        acc[curr.category] = 0;
      }
      acc[curr.category] += curr.amount;
      return acc;
    }, {}),
  };
  return report;
}

// API routes
app.post('/api/addTransaction', (req, res) => {
  const { userId, category, amount, date } = req.body;
  const transaction = { id: uuidv4(), category, amount, date };
  addTransaction(userId, transaction);
  res.status(200).json(transaction);
});

app.get('/api/getTransactions/:userId', (req, res) => {
  const { userId } = req.params;
  if (userExpenses[userId]) {
    res.status(200).json(userExpenses[userId]);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.get('/api/generateReport/:userId', (req, res) => {
  const { userId } = req.params;
  const report = generateReport(userId);
  res.status(200).json(report);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Example frontend code using React
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';

function App() {
  const [userId, setUserId] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [report, setReport] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, [userId]);

  const fetchTransactions = async () => {
    const response = await axios.get(`/api/getTransactions/${userId}`);
    setTransactions(response.data);
  };

  const handleAddTransaction = async (category, amount, date) => {
    const response = await axios.post('/api/addTransaction', { userId, category, amount, date });
    setTransactions((prevTransactions) => [...prevTransactions, response.data]);
  };

  const handleGenerateReport = async () => {
    const response = await axios.get(`/api/generateReport/${userId}`);
    setReport(response.data);
  };

  const chartData = {
    labels: report ? Object.keys(report.categories) : [],
    datasets: [
      {
        label: 'Expenses by Category',
        data: report ? Object.values(report.categories) : [],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div>
      <h1>Expense Tracker Application</h1>
      <div>
        <input
          type="text"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <button onClick={fetchTransactions}>Load Transactions</button>
      </div>
      <div>
        <input
          type="text"
          placeholder="Category"
          onChange={(e) => handleAddTransaction(e.target.value, parseFloat(prompt('Amount')), new Date().toISOString())}
        />
        <button onClick={() => handleAddTransaction(prompt('Category'), parseFloat(prompt('Amount')), new Date().toISOString())}>
          Add Transaction
        </button>
      </div>
      <div>
        <button onClick={handleGenerateReport}>Generate Report</button>
      </div>
      <div>
        <h2>Transactions</h2>
        <ul>
          {transactions.map((transaction) => (
            <li key={transaction.id}>
              {transaction.date} - {transaction.category}: ${transaction.amount}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2>Expense Report</h2>
        {report && (
          <div>
            <p>Total: ${report.total}</p>
            <Bar data={chartData} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;