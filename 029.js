// Personalized Health Advisor

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import { Pool } from 'pg';
import * as tf from '@tensorflow/tfjs';

// Initialize Express app
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Connect to PostgreSQL database
const pool = new Pool({
  user: 'your-db-user',
  host: 'localhost',
  database: 'health_advisor',
  password: 'your-db-password',
  port: 5432,
});

// Define User schema and model (for illustration purposes, not using an ORM)
const createUserTable = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  age INT,
  weight FLOAT,
  height FLOAT,
  health_metrics JSONB
);
`;

pool.query(createUserTable)
  .then(() => console.log('User table created'))
  .catch(err => console.error('Error creating user table', err));

// Load TensorFlow.js model
async function loadModel() {
  const model = await tf.loadLayersModel('path/to/model.json');
  return model;
}

// Function to analyze health metrics and provide recommendations
async function getHealthRecommendations(userData) {
  const model = await loadModel();
  const input = tf.tensor(userData.healthMetrics);
  const prediction = model.predict(input);
  const recommendations = prediction.dataSync();

  // Example logic to map predictions to recommendations
  const dietPlan = recommendations[0] > 0.5 ? 'High Protein Diet' : 'Balanced Diet';
  const exercisePlan = recommendations[1] > 0.5 ? 'Intense Workout' : 'Moderate Exercise';

  return { dietPlan, exercisePlan };
}

// API routes
app.post('/api/users', async (req, res) => {
  const { name, age, weight, height, healthMetrics } = req.body;
  const query = `
    INSERT INTO users (name, age, weight, height, health_metrics)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [name, age, weight, height, healthMetrics];

  try {
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error creating user' });
  }
});

app.post('/api/recommendations', async (req, res) => {
  const { userId } = req.body;
  const query = `
    SELECT health_metrics FROM users WHERE id = $1;
  `;
  const values = [userId];

  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = { healthMetrics: result.rows[0].health_metrics };
    const recommendations = await getHealthRecommendations(userData);
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching recommendations' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Example usage of the API
async function exampleUsage() {
  // Create a new user
  const newUser = {
    name: 'John Doe',
    age: 30,
    weight: 75,
    height: 180,
    healthMetrics: [/* user health metrics data */],
  };
  const createUserResponse = await fetch('http://localhost:3000/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newUser),
  });
  const createdUser = await createUserResponse.json();
  console.log('Created User:', createdUser);

  // Get health recommendations for the user
  const recommendationsResponse = await fetch('http://localhost:3000/api/recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: createdUser.id }),
  });
  const recommendations = await recommendationsResponse.json();
  console.log('Health Recommendations:', recommendations);
}

exampleUsage();