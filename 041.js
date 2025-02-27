// AI-Powered Mental Health Assistant

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import { SentimentAnalyzer } from 'natural';
import * as tf from '@tensorflow/tfjs';
import axios from 'axios';

// Initialize Express app
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Initialize SentimentAnalyzer
const analyzer = new SentimentAnalyzer('English', 'PorterStemmer', 'AFINN');

// Load TensorFlow.js model
async function loadModel() {
  const model = await tf.loadLayersModel('path/to/model.json');
  return model;
}

// Function to analyze sentiment
function analyzeSentiment(text) {
  const analysis = analyzer.getSentiment(text);
  return analysis;
}

// Function to provide mental health advice
async function provideAdvice(text) {
  const sentiment = analyzeSentiment(text);
  const model = await loadModel();
  const input = tf.tensor([sentiment.score]);
  const prediction = model.predict(input);
  const advice = prediction.dataSync()[0] > 0.5 ? 'Seek professional help' : 'You are doing well';

  // Connect to professional if necessary
  if (advice === 'Seek professional help') {
    await axios.post('https://api.mentalhealth.com/connect', {
      user: 'user_id',
      message: text,
    });
  }

  return advice;
}

// API routes
app.post('/api/analyze', async (req, res) => {
  const { text } = req.body;
  const sentiment = analyzeSentiment(text);
  res.status(200).json(sentiment);
});

app.post('/api/advice', async (req, res) => {
  const { text } = req.body;
  const advice = await provideAdvice(text);
  res.status(200).json({ advice });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Example frontend code using React
import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [text, setText] = useState('');
  const [sentiment, setSentiment] = useState(null);
  const [advice, setAdvice] = useState('');

  const handleAnalyze = async () => {
    const response = await axios.post('/api/analyze', { text });
    setSentiment(response.data);
  };

  const handleGetAdvice = async () => {
    const response = await axios.post('/api/advice', { text });
    setAdvice(response.data.advice);
  };

  return (
    <div>
      <h1>AI-Powered Mental Health Assistant</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter your thoughts here..."
      />
      <button onClick={handleAnalyze}>Analyze Sentiment</button>
      <button onClick={handleGetAdvice}>Get Advice</button>
      {sentiment && (
        <div>
          <h2>Sentiment Analysis</h2>
          <p>Score: {sentiment.score}</p>
          <p>Comparison: {sentiment.comparative}</p>
        </div>
      )}
      {advice && (
        <div>
          <h2>Advice</h2>
          <p>{advice}</p>
        </div>
      )}
    </div>
  );
}

export default App;