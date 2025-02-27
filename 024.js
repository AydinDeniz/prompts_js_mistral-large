// AI-Powered Personal Finance Tracker

// HTML Structure
document.body.innerHTML = `
  <div id="app">
    <h1>AI-Powered Personal Finance Tracker</h1>
    <div id="expenseForm">
      <h2>Add Expense</h2>
      <input type="text" id="expenseDescription" placeholder="Description">
      <input type="number" id="expenseAmount" placeholder="Amount">
      <button id="addExpenseButton">Add Expense</button>
    </div>
    <div id="expenseList">
      <h2>Expense List</h2>
      <ul id="expenses"></ul>
    </div>
    <div id="analytics">
      <h2>Expense Analytics</h2>
      <canvas id="expenseChart"></canvas>
    </div>
  </div>
`;

// TensorFlow.js Setup
async function loadModel() {
  const model = await tf.loadLayersModel('path/to/your/model.json');
  return model;
}

let model;
loadModel().then(m => model = m);

// Plaid API Integration
async function fetchTransactions() {
  const response = await fetch('/api/transactions');
  const transactions = await response.json();
  return transactions;
}

// Add Expense
document.getElementById('addExpenseButton').addEventListener('click', async () => {
  const description = document.getElementById('expenseDescription').value;
  const amount = parseFloat(document.getElementById('expenseAmount').value);

  if (description && amount) {
    const category = await predictCategory(description);
    saveExpense(description, amount, category);
    displayExpense(description, amount, category);
    updateAnalytics();
  }
});

// Predict Category using TensorFlow.js
async function predictCategory(description) {
  const input = tf.tensor([description]);
  const prediction = await model.predict(input).dataSync();
  const categoryIndex = prediction.indexOf(Math.max(...prediction));
  const categories = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Other'];
  return categories[categoryIndex];
}

// Save Expense to PostgreSQL
async function saveExpense(description, amount, category) {
  const response = await fetch('/api/expenses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ description, amount, category })
  });
  return response.json();
}

// Display Expense
function displayExpense(description, amount, category) {
  const expensesList = document.getElementById('expenses');
  const expenseItem = document.createElement('li');
  expenseItem.textContent = `${description} - $${amount.toFixed(2)} - ${category}`;
  expensesList.appendChild(expenseItem);
}

// Update Analytics using Chart.js
function updateAnalytics() {
  const ctx = document.getElementById('expenseChart').getContext('2d');
  fetch('/api/expenses')
    .then(response => response.json())
    .then(expenses => {
      const categories = {};
      expenses.forEach(expense => {
        if (categories[expense.category]) {
          categories[expense.category] += expense.amount;
        } else {
          categories[expense.category] = expense.amount;
        }
      });

      new Chart(ctx, {
        type: 'pie',
        data: {
          labels: Object.keys(categories),
          datasets: [{
            data: Object.values(categories),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: 'Expense Distribution'
            }
          }
        }
      });
    });
}

// Load initial data
async function loadInitialData() {
  const transactions = await fetchTransactions();
  transactions.forEach(transaction => {
    const category = predictCategory(transaction.description);
    displayExpense(transaction.description, transaction.amount, category);
  });
  updateAnalytics();
}

loadInitialData();

// Node.js Server (Example)
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const plaid = require('plaid');

const app = express();
app.use(bodyParser.json());

const pool = new Pool({
  user: 'your_db_user',
  host: 'your_db_host',
  database: 'your_db_name',
  password: 'your_db_password',
  port: 5432,
});

const plaidClient = new plaid.Client({
  client_id: 'your_plaid_client_id',
  secret: 'your_plaid_secret',
  public_key: 'your_plaid_public_key',
  env: plaid.environments.sandbox,
});

app.post('/api/expenses', async (req, res) => {
  const { description, amount, category } = req.body;
  try {
    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO expenses (description, amount, category) VALUES ($1, $2, $3) RETURNING id',
      [description, amount, category]
    );
    client.release();
    res.status(201).send({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).send('Error saving expense');
  }
});

app.get('/api/expenses', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM expenses');
    client.release();
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Error fetching expenses');
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const response = await plaidClient.getTransactions('your_access_token');
    res.json(response.transactions);
  } catch (err) {
    res.status(500).send('Error fetching transactions');
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});