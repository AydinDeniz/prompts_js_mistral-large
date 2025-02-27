// Personal Finance Management Assistant

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import * as tf from '@tensorflow/tfjs';

// Initialize Express app
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// In-memory data store for user financial data
const userFinances = {};

// Function to load TensorFlow.js model for financial analysis
async function loadModel() {
  const model = await tf.loadLayersModel('path/to/financial_model.json');
  return model;
}

// Function to analyze financial data
async function analyzeFinances(income, expenses) {
  const model = await loadModel();
  const input = tf.tensor([income, ...expenses]);
  const prediction = model.predict(input);
  const result = prediction.dataSync();
  return result;
}

// Function to provide budget recommendations
function provideBudgetRecommendations(income, expenses) {
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr, 0);
  const remainingBudget = income - totalExpenses;
  const recommendations = {
    savings: remainingBudget * 0.2,
    discretionary: remainingBudget * 0.3,
    essentials: remainingBudget * 0.5,
  };
  return recommendations;
}

// Function to forecast savings goals
function forecastSavingsGoals(income, expenses, savingsGoal) {
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr, 0);
  const remainingBudget = income - totalExpenses;
  const monthsToGoal = savingsGoal / (remainingBudget * 0.2);
  return monthsToGoal;
}

// API routes
app.post('/api/trackExpense', (req, res) => {
  const { userId, category, amount } = req.body;
  if (!userFinances[userId]) {
    userFinances[userId] = { income: 0, expenses: [] };
  }
  userFinances[userId].expenses.push({ category, amount });
  res.status(200).json({ message: 'Expense tracked successfully' });
});

app.post('/api/setIncome', (req, res) => {
  const { userId, income } = req.body;
  if (!userFinances[userId]) {
    userFinances[userId] = { income: 0, expenses: [] };
  }
  userFinances[userId].income = income;
  res.status(200).json({ message: 'Income set successfully' });
});

app.get('/api/getFinances/:userId', (req, res) => {
  const { userId } = req.params;
  if (userFinances[userId]) {
    res.status(200).json(userFinances[userId]);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.post('/api/analyzeFinances', async (req, res) => {
  const { userId } = req.body;
  const userData = userFinances[userId];
  if (userData) {
    const expenses = userData.expenses.map((expense) => expense.amount);
    const result = await analyzeFinances(userData.income, expenses);
    res.status(200).json({ result });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.post('/api/getBudgetRecommendations', (req, res) => {
  const { userId } = req.body;
  const userData = userFinances[userId];
  if (userData) {
    const expenses = userData.expenses.map((expense) => expense.amount);
    const recommendations = provideBudgetRecommendations(userData.income, expenses);
    res.status(200).json({ recommendations });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.post('/api/forecastSavingsGoals', (req, res) => {
  const { userId, savingsGoal } = req.body;
  const userData = userFinances[userId];
  if (userData) {
    const expenses = userData.expenses.map((expense) => expense.amount);
    const monthsToGoal = forecastSavingsGoals(userData.income, expenses, savingsGoal);
    res.status(200).json({ monthsToGoal });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Example frontend code using React
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [userId, setUserId] = useState('');
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [budgetRecommendations, setBudgetRecommendations] = useState(null);
  const [savingsGoal, setSavingsGoal] = useState(0);
  const [monthsToGoal, setMonthsToGoal] = useState(null);

  useEffect(() => {
    fetchFinances();
  }, [userId]);

  const fetchFinances = async () => {
    const response = await axios.get(`/api/getFinances/${userId}`);
    setIncome(response.data.income);
    setExpenses(response.data.expenses);
  };

  const handleTrackExpense = async (category, amount) => {
    await axios.post('/api/trackExpense', { userId, category, amount });
    fetchFinances();
  };

  const handleSetIncome = async (income) => {
    await axios.post('/api/setIncome', { userId, income });
    fetchFinances();
  };

  const handleAnalyzeFinances = async () => {
    const response = await axios.post('/api/analyzeFinances', { userId });
    console.log('Financial analysis result:', response.data.result);
  };

  const handleGetBudgetRecommendations = async () => {
    const response = await axios.post('/api/getBudgetRecommendations', { userId });
    setBudgetRecommendations(response.data.recommendations);
  };

  const handleForecastSavingsGoals = async () => {
    const response = await axios.post('/api/forecastSavingsGoals', { userId, savingsGoal });
    setMonthsToGoal(response.data.monthsToGoal);
  };

  return (
    <div>
      <h1>Personal Finance Management Assistant</h1>
      <div>
        <input
          type="text"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <input
          type="number"
          placeholder="Income"
          value={income}
          onChange={(e) => setIncome(parseFloat(e.target.value))}
        />
        <button onClick={() => handleSetIncome(income)}>Set Income</button>
      </div>
      <div>
        <input
          type="text"
          placeholder="Category"
          onChange={(e) => handleTrackExpense(e.target.value, parseFloat(prompt('Amount')))}
        />
        <button onClick={() => handleTrackExpense(prompt('Category'), parseFloat(prompt('Amount')))}>
          Track Expense
        </button>
      </div>
      <div>
        <button onClick={handleAnalyzeFinances}>Analyze Finances</button>
        <button onClick={handleGetBudgetRecommendations}>Get Budget Recommendations</button>
        <button onClick={handleForecastSavingsGoals}>Forecast Savings Goals</button>
      </div>
      <div>
        <h2>Expenses</h2>
        <ul>
          {expenses.map((expense, index) => (
            <li key={index}>
              {expense.category}: ${expense.amount}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2>Budget Recommendations</h2>
        {budgetRecommendations && (
          <div>
            <p>Savings: ${budgetRecommendations.savings.toFixed(2)}</p>
            <p>Discretionary: ${budgetRecommendations.discretionary.toFixed(2)}</p>
            <p>Essentials: ${budgetRecommendations.essentials.toFixed(2)}</p>
          </div>
        )}
      </div>
      <div>
        <h2>Savings Goal</h2>
        <input
          type="number"
          placeholder="Savings Goal"
          value={savingsGoal}
          onChange={(e) => setSavingsGoal(parseFloat(e.target.value))}
        />
        {monthsToGoal && (
          <p>Months to Goal: {monthsToGoal.toFixed(2)}</p>
        )}
      </div>
    </div>
  );
}

export default App;